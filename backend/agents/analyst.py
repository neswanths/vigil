from backend.agents.fault_tolerance import fallback_analyst_output
from backend.models.schemas import AnalystAgentOutput, Insight, Signal


async def process_signal(
    signal: Signal,
    existing_insights: list[Insight],
    mission_id: str,
) -> AnalystAgentOutput:
    if existing_insights:
        insight = existing_insights[0].model_copy()
        if signal.id not in insight.supporting_signals:
            insight.supporting_signals = [*insight.supporting_signals, signal.id]
        return AnalystAgentOutput(
            action="update_existing",
            updated_insight=insight,
            reasoning="Compatibility path merged a signal without extra LLM calls.",
            flags_for_human_review=False,
            flag_reason=None,
        )
    return fallback_analyst_output(signal, mission_id)
