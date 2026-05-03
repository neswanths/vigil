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
    low_evidence = evidence_support <= 0.45 or any(insight.flags_for_human_review for insight in linked)
    critical_assumption = _testable_assumption(recommendation)
    evidence_line = _simulation_watch_signal(recommendation, linked, low_evidence)

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
                    "The first cohort produces enough signal to compare price and variant uptake",
                    "Discounting stays inside the planned launch guardrails",
                ],
                outcome="The action produces usable learning with controlled downside.",
                probability_label="likely" if evidence_support >= 0.55 else "possible",
                early_signal=evidence_line,
            ),
            pessimistic=SimulationScenario(
                conditions=[
                    "Cost or competitive pressure worsens",
                    "Customers resist the proposed positioning",
                ],
                outcome="The action needs rollback or a narrower test before scaling.",
                probability_label="possible" if evidence_support >= 0.55 else "likely",
                early_signal=_risk_watch_signal(recommendation),
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


def _simulation_watch_signal(
    recommendation: Recommendation,
    linked: list[Insight],
    low_evidence: bool,
) -> str:
    if low_evidence:
        action_text = f"{recommendation.title} {recommendation.action}".lower()
        if "variant" in action_text or "storage" in action_text or "memory" in action_text:
            return "Watch whether higher-memory or higher-storage variants take enough share to lift blended margin."
        if "offer" in action_text or "discount" in action_text:
            return "Watch whether launch offers raise conversion without becoming an expected permanent discount."
        if "cohort" in action_text or "test" in action_text:
            return "Watch conversion, preorder quality, and competitor response in the first measured cohort."
        return "Watch early conversion, variant mix, and competitor discounts before scaling beyond the test window."

    if linked:
        return _clean_low_evidence_prefix(linked[0].body)[:180]
    return _clean_low_evidence_prefix(recommendation.rationale)[:180]


def _risk_watch_signal(recommendation: Recommendation) -> str:
    risk = _clean_low_evidence_prefix(recommendation.risk)
    if _is_descriptive_signal(risk):
        return risk[:180]

    action_text = f"{recommendation.title} {recommendation.action}".lower()
    if "price" in action_text or "pricing" in action_text or "rs " in action_text:
        return "Watch for conversion dropping below target after launch offers expire or competitors undercut the price."
    if "variant" in action_text or "storage" in action_text or "memory" in action_text:
        return "Watch for entry variants taking too much share and pulling blended margin below target."
    if "offer" in action_text or "discount" in action_text:
        return "Watch for customers converting only when promotional offers are active."
    if "spec" in action_text or "chipset" in action_text or "display" in action_text:
        return "Watch for reviews or comparison pages calling out weaker perceived value versus key competitors."
    return "Watch for weak early conversion, adverse competitor response, or margin pressure beyond the planned guardrails."


def _testable_assumption(recommendation: Recommendation) -> str:
    for assumption in recommendation.assumptions:
        cleaned = _clean_low_evidence_prefix(assumption)
        if _is_testable_assumption(cleaned):
            return cleaned[:250]

    action_text = f"{recommendation.title} {recommendation.action}".lower()
    if "price" in action_text or "pricing" in action_text or "rs " in action_text:
        return "Target customers will accept the proposed price once launch offers and competitor alternatives are visible."
    if "variant" in action_text or "storage" in action_text or "memory" in action_text:
        return "Variant mix will shift enough demand toward higher-margin configurations to offset component cost pressure."
    if "offer" in action_text or "discount" in action_text:
        return "Launch offers will improve conversion without training customers to wait for permanent discounts."
    if "spec" in action_text or "chipset" in action_text or "display" in action_text:
        return "Customers will value the protected headline specs more than any secondary component tradeoffs."
    return "The first launch cohort will produce enough demand signal to justify scaling the action."


def _is_descriptive_signal(value: str) -> bool:
    words = value.split()
    if len(words) < 6:
        return False
    vague_labels = {"low", "medium", "moderate", "high", "component", "components", "cost", "costs", "pricing", "competition"}
    return not set(word.strip(".,:;").lower() for word in words).issubset(vague_labels)


def _is_testable_assumption(value: str) -> bool:
    words = value.split()
    if len(words) < 7:
        return False
    test_words = {"will", "can", "enough", "if", "when", "without", "before", "after", "target", "below", "above"}
    return any(word.strip(".,:;").lower() in test_words for word in words)


def _clean_low_evidence_prefix(value: str) -> str:
    cleaned = value.strip()
    while cleaned.lower().startswith("low evidence:"):
        cleaned = cleaned.split(":", 1)[1].strip()
    return cleaned
