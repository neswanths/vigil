import hashlib
import re
from dataclasses import dataclass, field


STOPWORDS = {
    "about", "above", "after", "also", "amid", "among", "and", "are", "brand",
    "called", "decide", "deciding", "for", "from", "have", "help", "india",
    "indian", "into", "launch", "market", "mission", "new", "our", "over",
    "planning", "range", "should", "that", "the", "their", "this", "whether",
    "with", "within", "would",
}

DOMAIN_KEYWORDS = {
    "smartphone": {
        "aliases": ["smartphone", "phone", "mobile", "handset", "android"],
        "terms": [
            "smartphone", "mobile phone", "handset", "android", "5g", "snapdragon",
            "amoled", "camera", "battery", "ram", "storage", "display",
        ],
        "queries": [
            "smartphone market India",
            "India smartphone shipments pricing competition",
            "Snapdragon AMOLED smartphone India launch pricing",
            "Android smartphone competitors India",
        ],
    },
    "skincare": {
        "aliases": ["skincare", "grooming", "beard", "cosmetics", "personal care"],
        "terms": [
            "skincare", "grooming", "beard", "cosmetics", "personal care",
            "face wash", "d2c", "premium", "ayurvedic",
        ],
        "queries": [
            "D2C skincare India market",
            "men grooming India pricing competitors",
            "beard care India product launch",
            "personal care India premiumization",
        ],
    },
    "consumer_goods": {
        "aliases": ["consumer goods", "fmcg", "retail"],
        "terms": ["consumer goods", "fmcg", "retail", "distribution", "brand"],
        "queries": [
            "India consumer goods market",
            "India retail pricing competition",
        ],
    },
    "electric_two_wheeler": {
        "aliases": [
            "electric scooter", "ev scooter", "scooter", "two wheeler", "2 wheeler",
            "e scooter", "bike", "motorcycle", "ev",
        ],
        "terms": [
            "electric scooter", "ev scooter", "two wheeler", "battery", "range",
            "charging", "motor", "subsidy", "ola electric", "ather", "tvs iqube",
            "bajaj chetak",
        ],
        "queries": [
            "electric scooter India pricing competition",
            "India electric two wheeler market launch pricing",
            "EV scooter competitors India battery range pricing",
        ],
    },
}

DOMAIN_NEGATIVE_TERMS = {
    "smartphone": ["skincare", "beard", "cosmetics", "scooter", "two wheeler", "ev scooter", "motorcycle"],
    "skincare": ["smartphone", "snapdragon", "amoled", "scooter", "two wheeler", "motorcycle", "ev scooter"],
    "consumer_goods": ["snapdragon", "amoled", "scooter", "ev scooter", "motorcycle"],
    "electric_two_wheeler": ["skincare", "beard", "cosmetics", "smartphone", "snapdragon", "amoled", "camera"],
}

GEOGRAPHY_TERMS = [
    "India", "Indian", "United States", "US", "USA", "UK", "United Kingdom",
    "Europe", "EU", "China", "Southeast Asia", "Indonesia", "Brazil",
]

DECISION_TERMS = [
    "pricing", "price", "launch", "positioning", "margin", "discount",
    "premium", "volume", "competitor", "benchmark",
]


@dataclass
class DomainContext:
    mission_text: str
    industry: str
    domain: str
    category_terms: list[str] = field(default_factory=list)
    entities: list[str] = field(default_factory=list)
    competitors: list[str] = field(default_factory=list)
    query_terms: list[str] = field(default_factory=list)
    geography_terms: list[str] = field(default_factory=list)
    decision_terms: list[str] = field(default_factory=list)


def normalize_text(value: str) -> str:
    value = value.lower()
    value = re.sub(r"https?://\S+", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def stable_hash(value: str, length: int = 12) -> str:
    return hashlib.sha1(normalize_text(value).encode("utf-8")).hexdigest()[:length]


def canonicalize_summary(value: str) -> str:
    words = [w for w in normalize_text(value).split() if w not in STOPWORDS]
    return " ".join(words[:24])


def extract_entities(text: str) -> list[str]:
    candidates = re.findall(r"\b(?:[A-Z][A-Za-z0-9&.'-]*)(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3}", text)
    entities: list[str] = []
    for candidate in candidates:
        cleaned = candidate.strip(" ,.;:")
        cleaned = re.sub(r"^(we|our|the|new)\s+", "", cleaned, flags=re.I).strip()
        cleaned = re.sub(r"\s+(planning|deciding|considering|launching).*$", "", cleaned, flags=re.I).strip()
        normalized = cleaned.lower()
        if not cleaned or normalized in STOPWORDS or normalized in {"rs", "inr", "q1", "q2", "q3", "q4"}:
            continue
        if any(normalized == normalize_text(term) for spec in DOMAIN_KEYWORDS.values() for term in spec["terms"]):
            continue
        if cleaned not in entities:
            entities.append(cleaned)
    return entities[:12]


def extract_competitors(text: str, provided: list[str] | None = None) -> list[str]:
    competitors: list[str] = []
    for item in provided or []:
        item = item.strip()
        if item and item not in competitors:
            competitors.append(item)

    match = re.search(
        r"(?:competitors?\s+(?:are|include|including)|competing\s+with)\s+([^.;\n]+)",
        text,
        flags=re.IGNORECASE,
    )
    if match:
        raw = re.split(r",| and | & ", match.group(1))
        for item in raw:
            cleaned = re.sub(r"\b(deciding|whether|to|enter|launch|pricing)\b.*", "", item, flags=re.I).strip()
            if cleaned and cleaned not in competitors:
                competitors.append(cleaned)
    return competitors[:8]


def extract_geography(text: str) -> list[str]:
    normalized = normalize_text(text)
    found: list[str] = []
    for term in GEOGRAPHY_TERMS:
        if normalize_text(term) in normalized and term not in found:
            found.append("India" if term.lower() == "indian" else term)
    return list(dict.fromkeys(found))[:3]


def extract_decision_terms(text: str) -> list[str]:
    normalized = normalize_text(text)
    terms = [term for term in DECISION_TERMS if normalize_text(term) in normalized]
    return terms[:5]


def detect_domain(text: str, industry: str = "") -> str:
    haystack = normalize_text(f"{industry} {text}")
    best_domain = "general"
    best_score = 0
    for domain, spec in DOMAIN_KEYWORDS.items():
        score = sum(1 for alias in spec["aliases"] if alias in haystack)
        score += sum(1 for term in spec["terms"] if term in haystack)
        if score > best_score:
            best_domain = domain
            best_score = score
    return best_domain


def build_domain_context(
    mission_text: str,
    industry: str = "",
    competitors: list[str] | None = None,
) -> DomainContext:
    domain = detect_domain(mission_text, industry)
    spec = DOMAIN_KEYWORDS.get(domain, {"terms": [], "queries": []})
    entities = extract_entities(mission_text)
    resolved_competitors = extract_competitors(mission_text, competitors)
    geography_terms = extract_geography(mission_text)
    decision_terms = extract_decision_terms(mission_text)
    query_terms = [
        *resolved_competitors,
        *[e for e in entities if e not in resolved_competitors],
        *geography_terms,
        *decision_terms,
        *spec.get("terms", [])[:8],
    ]
    return DomainContext(
        mission_text=mission_text,
        industry=industry or domain.replace("_", " ").title(),
        domain=domain,
        category_terms=spec.get("terms", []),
        entities=entities,
        competitors=resolved_competitors,
        geography_terms=geography_terms,
        decision_terms=decision_terms,
        query_terms=list(dict.fromkeys([q for q in query_terms if q])),
    )


def build_search_queries(context: DomainContext) -> list[str]:
    spec = DOMAIN_KEYWORDS.get(context.domain, {})
    queries: list[str] = []
    single = build_single_search_query(context)
    if single:
        queries.append(single)
    queries.extend(spec.get("queries", [])[:1])
    return list(dict.fromkeys([q.strip() for q in queries if q.strip() and is_domain_consistent(q, context)]))[:2]


def build_single_search_query(context: DomainContext) -> str:
    geography_terms = context.geography_terms
    if not geography_terms and "india" in normalize_text(context.mission_text):
        geography_terms = ["India"]
    parts = [
        *context.competitors[:3],
        context.domain.replace("_", " "),
        *context.category_terms[:3],
        *geography_terms,
        *(context.decision_terms or ["pricing", "launch"]),
        "market",
    ]
    cleaned = [part for part in parts if part and normalize_text(part) != "general"]
    return " ".join(dict.fromkeys(cleaned))[:180]


def domain_conflicts(text: str, context: DomainContext) -> list[str]:
    normalized = normalize_text(text)
    if context.domain == "general":
        return []
    return [term for term in DOMAIN_NEGATIVE_TERMS.get(context.domain, []) if normalize_text(term) in normalized]


def is_domain_consistent(text: str, context: DomainContext) -> bool:
    return not domain_conflicts(text, context)


def mission_relevance_score(text: str, context: DomainContext) -> float:
    normalized = normalize_text(text)
    if not is_domain_consistent(text, context):
        return 0.0
    terms = [normalize_text(t) for t in context.query_terms + context.category_terms]
    terms = [t for t in terms if len(t) >= 3]
    if not terms:
        return 0.0

    hits = 0
    for term in terms:
        if term in normalized:
            hits += 2 if term in [normalize_text(e) for e in context.entities + context.competitors] else 1

    domain_hits = sum(1 for term in context.category_terms if normalize_text(term) in normalized)
    score = min(1.0, (hits / max(5, len(terms) * 0.35)) + min(0.25, domain_hits * 0.05))
    return round(score, 3)


def is_domain_relevant(text: str, context: DomainContext, threshold: float = 0.18) -> bool:
    if not is_domain_consistent(text, context):
        return False
    return mission_relevance_score(text, context) >= threshold
