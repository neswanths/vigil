from backend.agents.domain import build_domain_context
from backend.agents.news_scanner import scan_news
from backend.models.schemas import PartialSignal


async def scan_prices(competitors: list[str], context=None) -> list[PartialSignal]:
    context = context or build_domain_context(" ".join(competitors), competitors=competitors)
    result = await scan_news(" ".join([*competitors[:3], context.domain, "pricing"]), context)
    return [signal for signal in result.signals if signal.signal_type == "pricing"][:3]
