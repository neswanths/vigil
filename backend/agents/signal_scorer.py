from datetime import datetime

from backend.agents.domain import DomainContext, build_domain_context, is_domain_relevant, mission_relevance_score
from backend.agents.fault_tolerance import fallback_signal_scorer_output
from backend.models.schemas import Mission, PartialSignal, Signal


async def score_signal(
    signal: PartialSignal,
    mission: Mission | str,
    context: DomainContext | None = None,
) -> Signal | None:
    mission_id = mission.id if isinstance(mission, Mission) else mission
    mission_text = mission.raw_input if isinstance(mission, Mission) else ""
    context = context or build_domain_context(
        mission_text or " ".join(signal.entities_mentioned),
        industry=mission.industry if isinstance(mission, Mission) else "",
        competitors=mission.competitors if isinstance(mission, Mission) else [],
    )
    text = f"{signal.raw_summary} {' '.join(signal.entities_mentioned)} {signal.signal_type}"
    if not is_domain_relevant(text, context, threshold=0.28):
        return None

    relevance = mission_relevance_score(text, context)
    scored = fallback_signal_scorer_output(signal.raw_summary, relevance)
    return Signal(
        id=signal.id,
        source_name=signal.source_name,
        source_url=signal.source_url,
        published_at=datetime.fromisoformat(signal.published_at.replace("Z", "+00:00")),
        collected_at=datetime.fromisoformat(signal.collected_at.replace("Z", "+00:00")),
        raw_summary=signal.raw_summary,
        entities_mentioned=signal.entities_mentioned,
        signal_type=signal.signal_type,
        relevance_score=scored.relevance_score,
        credibility_score=scored.credibility_score,
        topic_tags=scored.topic_tags,
        affected_assumptions=scored.affected_assumptions,
        is_relevant=True,
        mission_id=mission_id,
    )
