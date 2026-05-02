import re

from backend.agents.domain import build_domain_context, normalize_text
from backend.models.schemas import MissionQuality

DECISION_TERMS = {
    "price",
    "pricing",
    "launch",
    "positioning",
    "enter",
    "expand",
    "compete",
    "market",
    "strategy",
    "margin",
    "premium",
    "discount",
}
GEO_TERMS = {
    "india",
    "indian",
    "us",
    "usa",
    "uk",
    "europe",
    "global",
    "china",
    "asia",
    "tier",
    "city",
    "cities",
}
CONSTRAINT_TERMS = {
    "budget",
    "margin",
    "q1",
    "q2",
    "q3",
    "q4",
    "month",
    "week",
    "rs",
    "₹",
    "usd",
    "competitor",
    "competing",
}


def evaluate_mission_quality(raw_input: str, industry: str = "", competitors: list[str] | None = None) -> MissionQuality:
    text = raw_input.strip()
    normalized = normalize_text(text)
    words = normalized.split()
    context = build_domain_context(text, industry, competitors or [])

    has_category = context.domain != "general" or bool(industry.strip()) or len(context.category_terms) > 0
    has_geography = any(term in normalized for term in GEO_TERMS)
    has_decision = any(term in normalized for term in DECISION_TERMS)
    has_competitors = bool(context.competitors) or "competitor" in normalized or "against" in normalized
    has_constraints = any(term in normalized for term in CONSTRAINT_TERMS) or bool(re.search(r"\d", text))
    has_enough_length = len(words) >= 8

    checks = [
        ("product or category", has_category, 0.25),
        ("geography or market", has_geography, 0.2),
        ("decision context", has_decision, 0.25),
        ("competitors or alternatives", has_competitors, 0.15),
        ("constraints or timeframe", has_constraints, 0.1),
        ("enough detail", has_enough_length, 0.05),
    ]
    score = round(sum(weight for _, passed, weight in checks if passed), 2)
    missing = [label for label, passed, _ in checks if not passed]

    if score < 0.45:
        level = "low"
        should_proceed = False
        needs_clarification = True
        message = "I need a bit more detail to give a useful recommendation."
    elif score < 0.75:
        level = "medium"
        should_proceed = True
        needs_clarification = True
        message = "I can start with this, but a few details would improve the recommendation."
    else:
        level = "high"
        should_proceed = True
        needs_clarification = False
        message = "This is enough detail to start a useful intelligence scan."

    questions = []
    if "product or category" in missing:
        questions.append("What product, category, or market are you making a decision about?")
    if "geography or market" in missing:
        questions.append("Which geography or customer market should Vigil focus on?")
    if "decision context" in missing:
        questions.append("Are you deciding on pricing, launch timing, positioning, expansion, or something else?")
    if "competitors or alternatives" in missing:
        questions.append("Which competitors, substitutes, or strategic options should be compared?")
    if "constraints or timeframe" in missing:
        questions.append("What constraints matter most: budget, margin, price range, timing, or risk?")

    example = (
        "We are launching a mid-range Snapdragon AMOLED smartphone in India in Q3 2026. "
        "Competitors are Redmi, Realme, and iQOO. Should we price at Rs 24,999 or push premium at Rs 29,999 while protecting margin?"
    )

    return MissionQuality(
        score=score,
        level=level,
        message=message,
        missing_fields=missing,
        suggested_questions=questions[:4],
        example_prompt=example,
        should_proceed=should_proceed,
        needs_clarification=needs_clarification,
    )
