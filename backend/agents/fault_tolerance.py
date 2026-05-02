import logging
import time
from datetime import datetime, timezone
from typing import Any

from pydantic import ValidationError

from backend.agents.domain import canonicalize_summary, stable_hash
from backend.models.schemas import (
    AnalystAgentOutput,
    NewsScannerOutput,
    PartialSignal,
    Signal,
    SignalScorerOutput,
    SimulationOutput,
    StrategistAgentOutput,
)

logger = logging.getLogger(__name__)

SIGNAL_TYPES = {
    "competitor_move",
    "market_trend",
    "regulatory",
    "sentiment_shift",
    "pricing",
    "product_launch",
    "other",
}
INSIGHT_STATUSES = {"strengthened", "weakened", "new", "contradicted", "unchanged"}
TIME_SENSITIVITY = {"immediate", "within_week", "within_month", "monitor"}
PROBABILITY_LABELS = {"likely", "possible", "unlikely"}


def log_validation_repair(agent_name: str, error: Exception, payload: Any) -> None:
    logger.warning(
        "agent_output_repair",
        extra={
            "agent": agent_name,
            "error_type": type(error).__name__,
            "error": str(error)[:500],
            "payload_type": type(payload).__name__,
        },
    )


def safe_list(value: Any, *, max_items: int | None = None, default: list[Any] | None = None) -> list[Any]:
    if value is None:
        items = list(default or [])
    elif isinstance(value, list):
        items = value
    elif isinstance(value, tuple | set):
        items = list(value)
    elif isinstance(value, str):
        if "," in value:
            items = [part.strip() for part in value.split(",")]
        else:
            items = [value.strip()] if value.strip() else []
    else:
        items = [value]

    cleaned: list[Any] = []
    for item in items:
        if item is None:
            continue
        if isinstance(item, str):
            item = item.strip()
            if not item:
                continue
        if item not in cleaned:
            cleaned.append(item)
    return cleaned[:max_items] if max_items is not None else cleaned


def safe_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip() or default
    return str(value).strip() or default


def safe_float(value: Any, default: float = 0.0, *, minimum: float = 0.0, maximum: float = 1.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = default
    return max(minimum, min(maximum, number))


def safe_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "yes", "1", "relevant"}:
            return True
        if normalized in {"false", "no", "0", "irrelevant"}:
            return False
    return default


def safe_datetime_string(value: Any) -> str:
    raw = safe_str(value)
    if raw:
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00")).isoformat()
        except ValueError:
            pass
    return datetime.now(timezone.utc).isoformat()


def normalize_tag(value: Any) -> str:
    tag = canonicalize_summary(safe_str(value)).replace(" ", "_")
    return tag[:40] or "market_signal"


def validate_or_repair(model_cls: type, payload: dict[str, Any], agent_name: str, sanitizer):
    repaired = sanitizer(payload)
    try:
        return model_cls(**repaired)
    except ValidationError as error:
        log_validation_repair(agent_name, error, repaired)
        repaired = sanitizer(repaired)
        return model_cls(**repaired)


def sanitize_partial_signal(payload: Any, index: int = 0) -> dict[str, Any]:
    data = payload if isinstance(payload, dict) else {"raw_summary": payload}
    summary = safe_str(data.get("raw_summary") or data.get("summary") or data.get("title"), "Market signal detected")
    source_url = safe_str(data.get("source_url") or data.get("url"))
    signal_type = safe_str(data.get("signal_type"), "other")
    if signal_type not in SIGNAL_TYPES:
        signal_type = "other"
    return {
        "id": safe_str(data.get("id"), f"NS-{stable_hash(source_url or summary or str(index), 14)}"),
        "source_name": safe_str(data.get("source_name") or data.get("source"), "Unknown"),
        "source_url": source_url,
        "published_at": safe_datetime_string(data.get("published_at") or data.get("published")),
        "collected_at": safe_datetime_string(data.get("collected_at")),
        "raw_summary": summary[:300],
        "entities_mentioned": [safe_str(item) for item in safe_list(data.get("entities_mentioned"), max_items=8)],
        "signal_type": signal_type,
    }


def sanitize_news_output(payload: dict[str, Any]) -> dict[str, Any]:
    raw_signals = safe_list(payload.get("signals"), max_items=20)
    signals = [sanitize_partial_signal(signal, index) for index, signal in enumerate(raw_signals)]
    return {
        "signals": signals,
        "articles_processed": int(safe_float(payload.get("articles_processed"), len(signals), maximum=10000)),
        "articles_skipped": int(safe_float(payload.get("articles_skipped"), 0, maximum=10000)),
        "skip_reasons": [safe_str(reason) for reason in safe_list(payload.get("skip_reasons"), max_items=20)],
    }


def fallback_news_output(articles: list[dict[str, Any]], skip_reasons: list[str] | None = None) -> NewsScannerOutput:
    signals = []
    for index, article in enumerate(articles[:8]):
        summary = safe_str(article.get("title") or article.get("description"), "Market signal detected")
        signals.append(
            PartialSignal(
                **sanitize_partial_signal(
                    {
                        "id": f"NS-{stable_hash(article.get('url') or summary, 14)}",
                        "source_name": article.get("author") or article.get("source") or "Unknown",
                        "source_url": article.get("url") or "",
                        "published_at": article.get("published"),
                        "raw_summary": summary,
                        "entities_mentioned": [],
                        "signal_type": "market_trend",
                    },
                    index,
                )
            )
        )
    return NewsScannerOutput(
        signals=signals,
        articles_processed=len(articles),
        articles_skipped=max(0, len(articles) - len(signals)),
        skip_reasons=safe_list(skip_reasons, max_items=20),
    )


def sanitize_signal_scorer_output(payload: dict[str, Any]) -> dict[str, Any]:
    relevance = safe_float(payload.get("relevance_score"), 0.5)
    return {
        "is_relevant": safe_bool(payload.get("is_relevant"), relevance >= 0.4),
        "relevance_score": relevance,
        "credibility_score": safe_float(payload.get("credibility_score"), 0.5),
        "topic_tags": [normalize_tag(tag) for tag in safe_list(payload.get("topic_tags"), max_items=8, default=["market_signal"])],
        "affected_assumptions": [safe_str(item) for item in safe_list(payload.get("affected_assumptions"), max_items=8)],
        "signal_summary": safe_str(payload.get("signal_summary") or payload.get("summary"), "Signal remains directionally relevant")[:200],
        "is_duplicate_likely": safe_bool(payload.get("is_duplicate_likely"), False),
        "reasoning": safe_str(payload.get("reasoning"), "Fallback scoring used because structured output was incomplete")[:300],
    }


def fallback_signal_scorer_output(signal_summary: str, relevance: float) -> SignalScorerOutput:
    return SignalScorerOutput(
        **sanitize_signal_scorer_output(
            {
                "is_relevant": relevance >= 0.4,
                "relevance_score": max(0.4, relevance),
                "credibility_score": 0.45,
                "topic_tags": canonicalize_summary(signal_summary).split()[:4] or ["market_signal"],
                "affected_assumptions": ["market context may affect decision"],
                "signal_summary": signal_summary,
                "reasoning": "Fallback scoring kept pipeline moving after invalid scorer output",
            }
        )
    )


def sanitize_analyst_output(payload: dict[str, Any]) -> dict[str, Any]:
    insight = payload.get("updated_insight")
    if not isinstance(insight, dict):
        insight = {}
    status = safe_str(insight.get("status"), "new")
    if status not in INSIGHT_STATUSES:
        status = "new"
    return {
        "action": safe_str(payload.get("action"), "create_new")
        if safe_str(payload.get("action"), "create_new") in {"update_existing", "create_new", "no_change"}
        else "create_new",
        "updated_insight": {
            "id": safe_str(insight.get("id"), f"IN-{stable_hash(insight.get('title') or insight.get('body') or str(time.time()), 14)}"),
            "title": safe_str(insight.get("title"), "Market belief updated")[:140],
            "body": safe_str(insight.get("body"), "A market signal changed the decision context.")[:600],
            "confidence": safe_float(insight.get("confidence"), 0.5),
            "confidence_delta": safe_float(insight.get("confidence_delta"), 0.0, minimum=-1.0, maximum=1.0),
            "supporting_signals": [safe_str(item) for item in safe_list(insight.get("supporting_signals"), max_items=30)],
            "contradicting_signals": [safe_str(item) for item in safe_list(insight.get("contradicting_signals"), max_items=30)],
            "assumptions_affected": [safe_str(item) for item in safe_list(insight.get("assumptions_affected"), max_items=12)],
            "status": status,
            "last_updated": safe_datetime_string(insight.get("last_updated")),
            "mission_id": safe_str(insight.get("mission_id")),
        },
        "reasoning": safe_str(payload.get("reasoning"), "Fallback repair used for analyst output")[:300],
        "flags_for_human_review": safe_bool(payload.get("flags_for_human_review"), False),
        "flag_reason": safe_str(payload.get("flag_reason")) or None,
    }


def fallback_analyst_output(signal: Signal, mission_id: str) -> AnalystAgentOutput:
    title_terms = canonicalize_summary(signal.raw_summary).split()[:6]
    title = " ".join(title_terms).title() or "Market Signal Matters"
    return AnalystAgentOutput(
        **sanitize_analyst_output(
            {
                "action": "create_new",
                "updated_insight": {
                    "id": f"IN-{stable_hash(f'{mission_id}:{signal.raw_summary}', 14)}",
                    "title": title,
                    "body": signal.raw_summary,
                    "confidence": signal.relevance_score * 0.6 + signal.credibility_score * 0.4,
                    "confidence_delta": 0.0,
                    "supporting_signals": [signal.id],
                    "contradicting_signals": [],
                    "assumptions_affected": signal.affected_assumptions,
                    "status": "new",
                    "mission_id": mission_id,
                },
                "reasoning": "Fallback insight created from scored signal after invalid analyst output",
            }
        )
    )


def sanitize_recommendation(payload: Any, mission_id: str, index: int) -> dict[str, Any]:
    data = payload if isinstance(payload, dict) else {"action": payload}
    time_sensitivity = safe_str(data.get("time_sensitivity"), "monitor")
    if time_sensitivity not in TIME_SENSITIVITY:
        time_sensitivity = "monitor"
    title = safe_str(data.get("title"), "Recommended action")[:160]
    action = safe_str(data.get("action"), title)[:500]
    return {
        "id": safe_str(data.get("id"), f"REC-{int(time.time())}-{index}"),
        "rank": int(safe_float(data.get("rank"), index + 1, minimum=1, maximum=99)),
        "title": title,
        "action": action,
        "rationale": safe_str(data.get("rationale"), "This action follows the strongest available insight.")[:800],
        "supporting_insight_ids": [safe_str(item) for item in safe_list(data.get("supporting_insight_ids"), max_items=20)],
        "confidence": safe_float(data.get("confidence"), 0.5),
        "assumptions": [safe_str(item) for item in safe_list(data.get("assumptions"), max_items=12, default=["Decision context remains stable"])],
        "risk": safe_str(data.get("risk"), "Evidence may be incomplete")[:300],
        "time_sensitivity": time_sensitivity,
        "mission_id": safe_str(data.get("mission_id"), mission_id),
    }


def sanitize_strategist_output(payload: dict[str, Any], mission_id: str) -> dict[str, Any]:
    recommendations = [
        sanitize_recommendation(rec, mission_id, index)
        for index, rec in enumerate(safe_list(payload.get("recommendations"), max_items=7))
    ][:5]
    return {
        "recommendations": recommendations,
        "recommendations_count": int(safe_float(payload.get("recommendations_count"), len(recommendations), maximum=5)),
        "insights_used": [safe_str(item) for item in safe_list(payload.get("insights_used"), max_items=30)],
        "insights_ignored": [safe_str(item) for item in safe_list(payload.get("insights_ignored"), max_items=30)],
        "ignore_reasons": [safe_str(item) for item in safe_list(payload.get("ignore_reasons"), max_items=30)],
    }


def fallback_strategist_output(insights: list, mission_id: str) -> StrategistAgentOutput:
    top = sorted(insights, key=lambda item: item.confidence, reverse=True)[:3]
    primary = top[0] if top else None
    recommendation = sanitize_recommendation(
        {
            "title": "Proceed with a narrow test",
            "action": "Run a limited decision test before scaling the move",
            "rationale": f"Uses strongest available belief {primary.id if primary else 'from current evidence'} while limiting downside.",
            "supporting_insight_ids": [item.id for item in top],
            "confidence": primary.confidence if primary else 0.5,
            "assumptions": ["Small-scale test results predict broader market response"],
            "risk": "Evidence base is still thin",
            "time_sensitivity": "within_week",
        },
        mission_id,
        0,
    )
    return StrategistAgentOutput(
        recommendations=[recommendation],
        recommendations_count=1,
        insights_used=[item.id for item in top],
        insights_ignored=[],
        ignore_reasons=[],
    )


def sanitize_simulation_output(payload: dict[str, Any], recommendation_id: str) -> dict[str, Any]:
    def scenario(name: str, fallback_probability: str) -> dict[str, Any]:
        raw = payload.get("scenarios", {}).get(name, {}) if isinstance(payload.get("scenarios"), dict) else {}
        probability = safe_str(raw.get("probability_label"), fallback_probability)
        if probability not in PROBABILITY_LABELS:
            probability = fallback_probability
        return {
            "conditions": [safe_str(item) for item in safe_list(raw.get("conditions"), max_items=8, default=["Assumptions hold"])],
            "outcome": safe_str(raw.get("outcome"), "Outcome remains directionally acceptable")[:400],
            "probability_label": probability,
            "early_signal": safe_str(raw.get("early_signal"), "Watch for early demand or competitor response")[:250],
        }

    return {
        "simulation_id": safe_str(payload.get("simulation_id"), f"SIM-{int(time.time())}"),
        "recommendation_id": safe_str(payload.get("recommendation_id"), recommendation_id),
        "scenarios": {
            "optimistic": scenario("optimistic", "possible"),
            "neutral": scenario("neutral", "likely"),
            "pessimistic": scenario("pessimistic", "possible"),
        },
        "critical_assumption": safe_str(payload.get("critical_assumption"), "The recommendation has enough evidence support")[:250],
        "evidence_support": safe_float(payload.get("evidence_support"), 0.5),
        "verdict": safe_str(payload.get("verdict"), "Proceed only with close monitoring")[:300],
    }


def fallback_simulation_output(recommendation_id: str) -> SimulationOutput:
    return SimulationOutput(**sanitize_simulation_output({}, recommendation_id))
