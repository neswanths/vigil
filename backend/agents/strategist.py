import time

from backend.agents.fault_tolerance import fallback_strategist_output
from backend.models.schemas import (
    Insight,
    Mission,
    Recommendation,
    Scenarios,
    SimulationOutput,
    SimulationScenario,
    StrategistAgentOutput,
)


async def generate_strategy(
    insights: list[Insight],
    mission: Mission,
    existing_recs: list[Recommendation],
) -> StrategistAgentOutput:
    if existing_recs:
        return StrategistAgentOutput(
            recommendations=existing_recs[:3],
            recommendations_count=min(3, len(existing_recs)),
            insights_used=[],
            insights_ignored=[],
            ignore_reasons=[],
        )
    return fallback_strategist_output(insights, mission.id)


async def simulate_recommendation(
    recommendation: Recommendation,
    insights: list[Insight],
) -> SimulationOutput:
    confidence = recommendation.confidence
    linked = [insight for insight in insights if insight.id in recommendation.supporting_insight_ids]
    evidence_support = max(0.35, min(0.9, confidence if confidence else 0.5))
    critical_assumption = (
        recommendation.assumptions[0]
        if recommendation.assumptions
        else "The target market responds to the proposed action"
    )
    evidence_line = linked[0].body if linked else recommendation.rationale

    return SimulationOutput(
        simulation_id=f"SIM-{int(time.time())}",
        recommendation_id=recommendation.id,
        scenarios=Scenarios(
            optimistic=SimulationScenario(
                conditions=[
                    "Target customers respond positively in the first launch cohort",
                    "Competitors do not immediately undercut the move",
                ],
                outcome="The action improves traction while preserving room to adjust.",
                probability_label="possible",
                early_signal="Early conversion or preorder rates exceed baseline.",
            ),
            neutral=SimulationScenario(
                conditions=[
                    "Market response follows current evidence",
                    "Execution stays within stated constraints",
                ],
                outcome="The action produces usable learning with controlled downside.",
                probability_label="likely" if evidence_support >= 0.55 else "possible",
                early_signal=evidence_line[:180],
            ),
            pessimistic=SimulationScenario(
                conditions=[
                    "Cost or competitive pressure worsens",
                    "Customers resist the proposed positioning",
                ],
                outcome="The action needs rollback or a narrower test before scaling.",
                probability_label="possible" if evidence_support >= 0.55 else "likely",
                early_signal=recommendation.risk[:180],
            ),
        ),
        critical_assumption=critical_assumption[:250],
        evidence_support=evidence_support,
        verdict=(
            "Proceed with a constrained test and monitor early response."
            if evidence_support >= 0.5
            else "Do not scale yet; gather stronger evidence through a narrow test."
        ),
    )
