import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx
from groq import AsyncGroq

from backend.agents import parse_agent_response
from backend.agents.domain import (
    DomainContext,
    build_domain_context,
    build_single_search_query,
    canonicalize_summary,
    is_domain_consistent,
    mission_relevance_score,
    stable_hash,
)
from backend.agents.fault_tolerance import (
    safe_float,
    safe_list,
    safe_str,
    sanitize_recommendation,
)
from backend.agents.smartphone_priors import build_smartphone_reasoning_context
from backend.config import config
from backend.models.schemas import Insight, Mission, Recommendation, Signal

logger = logging.getLogger(__name__)

FAST_TIMEOUT_SECONDS = 9.0
MAX_SIGNALS = 3
MAX_INSIGHTS = 3
MAX_RECOMMENDATIONS = 3
MIN_SIGNAL_RELEVANCE = 0.28
LOW_EVIDENCE_CONFIDENCE_CAP = 0.44
LIVE_EVIDENCE_CONFIDENCE_CAP = 0.72

FAST_SYSTEM_PROMPT = """You are Vigil Fast Mode.
Generate a compact decision answer from the mission and supplied market signals.
Return only JSON:
{"insights":[{"title":string,"body":string,"confidence":float,"assumptions_affected":array}],
"recommendations":[{"title":string,"action":string,"rationale":string,"supporting_insight_indexes":array integers,"confidence":float,"assumptions":array,"risk":string,"time_sensitivity":"immediate"|"within_week"|"within_month"|"monitor"}]}
Rules:
- max 3 insights and max 3 recommendations
- no prose outside JSON
- do not repeat or summarize the mission as the output
- transform facts into decision implications, tradeoffs, and actions
- use supplied evidence only when evidence is marked live
- when evidence is marked low, label the output low evidence and use structured reasoning from product specs, competitors, and constraints
- never fabricate source-backed confidence when evidence is weak."""


async def run_fast_mission(mission: Mission) -> list[dict[str, Any]]:
    started = time.monotonic()
    context = build_domain_context(mission.raw_input, mission.industry, mission.competitors)
    events: list[dict[str, Any]] = [
        _status("news_scanner", "active", {"mode": "fast"}),
        _status("pricing_scout", "active", {"mode": "fast"}),
    ]

    signals = await _fetch_signals(mission, context, started)
    if not signals:
        signals = [_fallback_signal(mission, context)]

    events.extend(_signal_event(signal) for signal in signals)
    events.append(_status("news_scanner", "completed", {"signals_found": len(signals), "mode": "fast"}))
    events.append(_status("pricing_scout", "completed", {"signals_found": len([s for s in signals if s.signal_type == "pricing"]), "mode": "fast"}))
    events.append(_status("signal_scorer", "completed", {"scored_count": len(signals), "mode": "fast"}))

    insights, recommendations = await _reason_once(mission, signals, started)
    events.append(_status("analyst", "active", {"mode": "fast"}))
    events.extend(_insight_event(insight) for insight in insights)
    events.append(_status("analyst", "completed", {"insights_count": len(insights), "mode": "fast"}))

    events.append(_status("strategist", "active", {"mode": "fast"}))
    events.extend(_recommendation_event(recommendation) for recommendation in recommendations)
    events.append(_status("strategist", "completed", {"recommendations_count": len(recommendations), "mode": "fast"}))
    return events


async def _fetch_signals(mission: Mission, context: DomainContext, started: float) -> list[Signal]:
    remaining = max(1.0, FAST_TIMEOUT_SECONDS - (time.monotonic() - started) - 4.0)
    query = _combined_query(mission, context)
    if not query or not is_domain_consistent(query, context):
        logger.warning(
            "fast_query_rejected mission_id=%s domain=%s query=%r",
            mission.id,
            context.domain,
            query,
        )
        return []
    try:
        async with httpx.AsyncClient(timeout=min(3.0, remaining)) as client:
            response = await client.get(
                "https://api.currentsapi.services/v1/search",
                params={"apiKey": config["CURRENTS_API_KEY"], "keywords": query, "limit": MAX_SIGNALS},
            )
            data = response.json()
            logger.info("currents_response_body mission_id=%s query=%r body=%s", mission.id, query, _short_body(data))
    except Exception as error:
        logger.warning("fast_signal_fetch_failed: %s", error)
        return []

    signals: list[Signal] = []
    skipped = 0
    for index, article in enumerate(data.get("news", [])[: MAX_SIGNALS * 2]):
        summary = safe_str(article.get("title") or article.get("description"), "Market signal detected")
        text = f"{summary} {article.get('description') or ''}"
        if not is_domain_consistent(text, context):
            skipped += 1
            continue
        relevance = mission_relevance_score(text, context)
        if relevance < MIN_SIGNAL_RELEVANCE:
            skipped += 1
            continue
        signals.append(
            Signal(
                id=f"FS-{stable_hash(article.get('url') or summary or str(index), 14)}",
                source_name=safe_str(article.get("author") or article.get("source"), "Currents"),
                source_url=safe_str(article.get("url")),
                published_at=_parse_datetime(article.get("published")),
                collected_at=datetime.now(timezone.utc),
                raw_summary=summary[:280],
                entities_mentioned=[item for item in context.competitors + context.entities if item.lower() in text.lower()][:6],
                signal_type="pricing" if any(term in text.lower() for term in ["price", "pricing", "cost", "discount", "margin"]) else "market_trend",
                relevance_score=relevance,
                credibility_score=0.55,
                topic_tags=canonicalize_summary(summary).split()[:5] or [context.domain],
                affected_assumptions=["pricing pressure", "market demand"][:2],
                is_relevant=True,
                mission_id=mission.id,
            )
        )
        if len(signals) >= MAX_SIGNALS:
            break
    if skipped:
        logger.info("fast_signal_filter mission_id=%s skipped=%s accepted=%s", mission.id, skipped, len(signals))
    return signals[:MAX_SIGNALS]


async def _reason_once(mission: Mission, signals: list[Signal], started: float) -> tuple[list[Insight], list[Recommendation]]:
    remaining = FAST_TIMEOUT_SECONDS - (time.monotonic() - started)
    if remaining < 2.0:
        return _fallback_reasoning(mission, signals)

    client = AsyncGroq(api_key=config["GROQ_API_KEY"])
    evidence_mode = "live" if _has_live_evidence(signals) else "low"
    if evidence_mode == "low":
        signal_text = "No accepted live market signals. The fallback status is not evidence and must not be cited or paraphrased."
    else:
        signal_text = "\n".join(
            f"{idx}. {signal.raw_summary} | source={signal.source_name} | relevance={signal.relevance_score}"
            for idx, signal in enumerate(signals)
        )
    context = build_domain_context(mission.raw_input, mission.industry, mission.competitors)
    structured_context = build_smartphone_reasoning_context(context) if evidence_mode == "low" else ""
    final_instruction = (
        "Generate insights and recommendations. Reason beyond the mission text using the structured context: identify non-obvious tradeoffs, risks, and competitive implications. Never restate or paraphrase what the user already said."
        if evidence_mode == "low"
        else "Generate insights and recommendations."
    )
    prompt = f"""Mission:
{mission.raw_input}

Industry: {mission.industry}
Competitors: {', '.join(mission.competitors)}
Evidence mode: {evidence_mode}

{structured_context}

Signals:
{signal_text}

{final_instruction}"""
    if evidence_mode == "low":
        logger.info("groq_low_evidence_prompt mission_id=%s prompt=%s", mission.id, prompt)

    try:
        response = await asyncio.wait_for(
            client.chat.completions.create(
                messages=[
                    {"role": "system", "content": FAST_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                max_tokens=1400,
            ),
            timeout=max(1.0, min(5.0, remaining - 0.5)),
        )
        raw_llm_body = response.choices[0].message.content
        logger.info("groq_response_body mission_id=%s body=%s", mission.id, _short_body(raw_llm_body))
        parsed = parse_agent_response(raw_llm_body, "Fast Mode")
        return _build_outputs(mission, signals, parsed)
    except Exception as error:
        logger.warning("fast_reasoning_failed: %s", error)
        return _fallback_reasoning(mission, signals)


def _build_outputs(mission: Mission, signals: list[Signal], parsed: dict[str, Any]) -> tuple[list[Insight], list[Recommendation]]:
    now = datetime.now(timezone.utc)
    raw_insights = safe_list(parsed.get("insights"), max_items=MAX_INSIGHTS)
    insights: list[Insight] = []
    low_evidence = not _has_live_evidence(signals)
    confidence_cap = LOW_EVIDENCE_CONFIDENCE_CAP if low_evidence else LIVE_EVIDENCE_CONFIDENCE_CAP
    for index, raw in enumerate(raw_insights):
        item = raw if isinstance(raw, dict) else {"body": raw}
        body = _transform_body(
            safe_str(item.get("body"), ""),
            mission,
            signals,
            low_evidence,
        )
        title = safe_str(item.get("title"), "Decision implication")
        if low_evidence and not title.lower().startswith("low evidence"):
            title = f"Low evidence: {title}"
        supporting = _supporting_signal_ids(f"{title} {body}", signals, allow_fallback=low_evidence)
        confidence = min(confidence_cap, safe_float(item.get("confidence"), 0.4 if low_evidence else 0.58))
        insights.append(
            Insight(
                id=f"IN-{stable_hash(f'{mission.id}:{title}:{body}', 14)}",
                title=title[:100],
                body=body[:700],
                confidence=confidence,
                confidence_delta=confidence,
                supporting_signals=supporting,
                contradicting_signals=[],
                assumptions_affected=[safe_str(value) for value in safe_list(item.get("assumptions_affected"), max_items=8)],
                status="new",
                flags_for_human_review=low_evidence,
                flag_reason="Low evidence: no strong live market signal supported this insight." if low_evidence else None,
                last_updated=now,
                mission_id=mission.id,
            )
        )

    if not insights:
        insights, _ = _fallback_reasoning(mission, signals)

    raw_recommendations = safe_list(parsed.get("recommendations"), max_items=MAX_RECOMMENDATIONS)
    recommendations: list[Recommendation] = []
    for index, raw in enumerate(raw_recommendations):
        item = raw if isinstance(raw, dict) else {"action": raw}
        support_indexes = [
            int(value) for value in safe_list(item.get("supporting_insight_indexes"), max_items=MAX_INSIGHTS)
            if str(value).isdigit()
        ]
        supporting_ids = [
            insights[idx].id for idx in support_indexes
            if 0 <= idx < len(insights)
        ] or [insight.id for insight in insights[:2]]
        sanitized = sanitize_recommendation(
            {
                **item,
                "rank": index + 1,
                "supporting_insight_ids": supporting_ids,
                "mission_id": mission.id,
            },
            mission.id,
            index,
        )
        sanitized["confidence"] = min(confidence_cap, safe_float(sanitized.get("confidence"), 0.4 if low_evidence else 0.58))
        if low_evidence:
            sanitized["rationale"] = _low_evidence_text(safe_str(sanitized.get("rationale"), ""))
            sanitized["risk"] = _low_evidence_text(safe_str(sanitized.get("risk"), "Evidence is thin."))
        recommendations.append(Recommendation(**sanitized))

    if not recommendations:
        _, recommendations = _fallback_reasoning(mission, signals)
    return insights[:MAX_INSIGHTS], recommendations[:MAX_RECOMMENDATIONS]


def _fallback_reasoning(mission: Mission, signals: list[Signal]) -> tuple[list[Insight], list[Recommendation]]:
    now = datetime.now(timezone.utc)
    primary_signal = signals[0] if signals else _fallback_signal(mission, build_domain_context(mission.raw_input, mission.industry, mission.competitors))
    low_evidence = not _has_live_evidence(signals)
    context = build_domain_context(mission.raw_input, mission.industry, mission.competitors)
    competitors = ", ".join(context.competitors[:3]) or "named competitors"
    category = context.domain.replace("_", " ")
    insight = Insight(
        id=f"IN-{stable_hash(f'{mission.id}:{primary_signal.raw_summary}', 14)}",
        title="Low evidence: validate the decision with a narrow market test" if low_evidence else "Use a constrained market test",
        body=(
            f"Low evidence: no strong live {category} signal was found in the bounded fetch. "
            f"Structured reasoning points to benchmarking against {competitors}, then testing price, specs, and margin tradeoffs before rollout."
        ) if low_evidence else primary_signal.raw_summary,
        confidence=0.4 if low_evidence else 0.56,
        confidence_delta=0.4 if low_evidence else 0.56,
        supporting_signals=[primary_signal.id],
        contradicting_signals=[],
        assumptions_affected=["demand response", "pricing pressure"],
        status="new",
        flags_for_human_review=low_evidence,
        flag_reason="Low evidence: structured fallback used because strong live signals were unavailable." if low_evidence else None,
        last_updated=now,
        mission_id=mission.id,
    )
    recommendation = Recommendation(
        **sanitize_recommendation(
            {
                "title": "Run a focused pricing test",
                "action": "Benchmark the key competitors, pick a conservative test price, and run a narrow cohort launch before scaling.",
                "rationale": "Low evidence: live market signals were weak, so the safest decision is to validate structured benchmark assumptions before committing broadly.",
                "supporting_insight_ids": [insight.id],
                "confidence": 0.4 if low_evidence else 0.56,
                "assumptions": ["Small test response reflects broader market response"],
                "risk": "Evidence is thin, so broad rollout may misprice demand.",
                "time_sensitivity": "within_week",
            },
            mission.id,
            0,
        )
    )
    return [insight], [recommendation]


def _fallback_signal(mission: Mission, context: DomainContext) -> Signal:
    now = datetime.now(timezone.utc)
    return Signal(
        id=f"FS-{stable_hash(mission.raw_input, 14)}",
        source_name="Structured Fallback",
        source_url="",
        published_at=now,
        collected_at=now,
        raw_summary=f"Low evidence fallback: no strong domain-consistent live signal was available quickly; reasoning uses {context.industry} context, competitor benchmarks, and product constraints.",
        entities_mentioned=context.competitors[:5],
        signal_type="market_trend",
        relevance_score=0.25,
        credibility_score=0.25,
        topic_tags=[context.domain, "low_evidence"],
        affected_assumptions=["evidence availability"],
        is_relevant=True,
        mission_id=mission.id,
    )


def _combined_query(mission: Mission, context: DomainContext) -> str:
    return build_single_search_query(context)


def _has_live_evidence(signals: list[Signal]) -> bool:
    return any(signal.source_url and signal.source_name != "Structured Fallback" and signal.relevance_score >= MIN_SIGNAL_RELEVANCE for signal in signals)


def _supporting_signal_ids(text: str, signals: list[Signal], allow_fallback: bool = False) -> list[str]:
    matches = []
    for signal in signals:
        if signal.source_name == "Structured Fallback" and not allow_fallback:
            continue
        score = mission_relevance_score(text, build_domain_context(signal.raw_summary, competitors=signal.entities_mentioned))
        if score > 0 or any(entity.lower() in text.lower() for entity in signal.entities_mentioned):
            matches.append(signal.id)
    if matches:
        return matches[:2]
    if allow_fallback and signals:
        return [signals[0].id]
    live = [signal.id for signal in signals if signal.source_url and signal.source_name != "Structured Fallback"]
    return live[:1]


def _transform_body(body: str, mission: Mission, signals: list[Signal], low_evidence: bool) -> str:
    if not body:
        if low_evidence:
            return _fallback_reasoning(mission, signals)[0][0].body
        return f"Live evidence changes the decision by pointing to {signals[0].raw_summary[:180]} as the constraint to price and positioning."
    if low_evidence:
        return _low_evidence_text(body)
    return body


def _low_evidence_text(value: str) -> str:
    value = value.strip()
    if value.lower().startswith("low evidence"):
        return value
    return f"Low evidence: {value}" if value else "Low evidence: structured reasoning used because strong live signals were unavailable."


def _short_body(value: Any, limit: int = 2500) -> str:
    text = safe_str(value)
    if not text:
        text = repr(value)
    return text[:limit]


def _parse_datetime(value: Any) -> datetime:
    raw = safe_str(value)
    if raw:
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def _status(agent: str, status: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "event_type": "agent_status",
        "agent": agent,
        "payload": {"status": status, **(payload or {})},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _signal_event(signal: Signal) -> dict[str, Any]:
    return {
        "event_type": "signal_received",
        "agent": "fast_mode",
        "payload": signal.model_dump(mode="json"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _insight_event(insight: Insight) -> dict[str, Any]:
    return {
        "event_type": "insight_updated",
        "agent": "fast_mode",
        "payload": insight.model_dump(mode="json"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _recommendation_event(recommendation: Recommendation) -> dict[str, Any]:
    return {
        "event_type": "recommendation_ready",
        "agent": "fast_mode",
        "payload": recommendation.model_dump(mode="json"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
