from backend.agents.domain import DomainContext


SMARTPHONE_DOMAIN_PRIORS = [
    "Indian mid-range smartphones usually operate on thin hardware margins; gross margin often depends on channel mix, launch offers, and attach revenue rather than device margin alone.",
    "Chipsets are a material bill-of-materials driver in 5G mid-range devices. A chipset cost increase typically compresses margin unless the OEM raises price, reduces memory/storage/display/camera cost, or shifts launch offers.",
    "Display panel prices can partially offset chipset pressure, but savings are uneven because AMOLED, refresh rate, brightness, and supplier choice affect perceived value.",
    "INR depreciation raises landed costs for import-heavy components such as chipsets, memory, camera sensors, and display panels, making aggressive INR pricing harder to sustain.",
    "A sub-Rs 20,000 price point is highly elastic; small price moves can change comparison sets, online conversion, and launch-week discount expectations.",
]

SMARTPHONE_POSITIONING_ANCHORS = {
    "xiaomi": "Xiaomi typically competes in value-for-spec price bands around Rs 12,000-25,000, differentiates on aggressive specifications and online value, and often uses launch offers or portfolio mix before fully passing costs through.",
    "redmi": "Redmi usually anchors the value segment with high visible specs per rupee, responding to cost pressure through variant mix, launch discounts, or selective specification tradeoffs.",
    "realme": "Realme tends to compete on fast refresh displays, charging, design, and online pricing aggression; under cost pressure it has historically used promotional pricing and variant-level specification choices.",
    "iqoo": "iQOO is performance-led in the mid-range, emphasizing chipset and gaming capability; cost pressure is more likely to be managed by premium positioning or tradeoffs outside the performance core.",
    "samsung": "Samsung often prices at a modest premium versus spec-led Chinese brands, differentiating on brand trust, retail reach, software, and after-sales; it is more willing to pass some cost through when brand equity supports it.",
    "vivo": "Vivo usually differentiates through offline reach, camera, design, and retail execution; cost pressure is often handled through channel economics, variant mix, or selective spec-down decisions.",
    "oppo": "Oppo generally leans on design, camera, retail presence, and brand experience; it is more likely to protect perceived quality than win purely on lowest price.",
    "oneplus": "OnePlus competes on performance and premium perception in upper mid-range bands; it tends to preserve brand positioning and pass some costs through rather than chase the lowest price point.",
    "motorola": "Motorola often differentiates on clean software, design, and balanced pricing; it can use selective component choices to stay competitive without leading on every spec.",
    "poco": "Poco is performance/value focused and price-sensitive; cost pressure often creates tradeoffs between chipset strength, display quality, and launch discount depth.",
}

SMARTPHONE_HISTORICAL_ANALOGUES = [
    "During recent 5G transitions in India, OEMs often protected headline performance claims while adjusting secondary specs, launch offers, or variant pricing to stay inside key online comparison brackets.",
    "When component shortages and logistics costs pressured smartphone BOMs, mid-range OEMs commonly reduced promotional depth, delayed aggressive discounting, or shifted consumers toward higher-memory variants with better rupee margin.",
    "During periods of INR weakness, import-heavy OEMs faced landed-cost pressure and often balanced modest price increases with specification rationalization rather than absorbing the entire cost shock.",
]


def build_smartphone_reasoning_context(context: DomainContext) -> str:
    if context.domain != "smartphone":
        return ""

    competitor_keys = {name.lower().strip() for name in context.competitors}
    anchors = [
        value
        for key, value in SMARTPHONE_POSITIONING_ANCHORS.items()
        if any(key in competitor for competitor in competitor_keys)
    ]
    if not anchors:
        anchors = [
            SMARTPHONE_POSITIONING_ANCHORS["xiaomi"],
            SMARTPHONE_POSITIONING_ANCHORS["realme"],
            SMARTPHONE_POSITIONING_ANCHORS["samsung"],
        ]

    sections = [
        "Structured smartphone context for low-evidence reasoning:",
        "",
        "Domain priors:",
        *[f"- {item}" for item in SMARTPHONE_DOMAIN_PRIORS],
        "",
        "Competitive positioning anchors:",
        *[f"- {item}" for item in anchors[:5]],
        "",
        "Historical analogues:",
        *[f"- {item}" for item in SMARTPHONE_HISTORICAL_ANALOGUES],
    ]
    return "\n".join(sections)

