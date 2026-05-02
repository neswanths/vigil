from backend.agents.domain import build_domain_context
from backend.agents.fast_pipeline import _fallback_signal, _fetch_signals
from backend.models.schemas import NewsScannerOutput, PartialSignal


async def scan_news(mission_query: str, context=None) -> NewsScannerOutput:
    context = context or build_domain_context(mission_query)

    class _Mission:
        id = "compat"
        raw_input = mission_query
        industry = context.industry
        competitors = context.competitors

    signals = await _fetch_signals(_Mission(), context, 0.0)
    if not signals:
        signals = [_fallback_signal(_Mission(), context)]

    partials = [
        PartialSignal(
            id=signal.id,
            source_name=signal.source_name,
            source_url=signal.source_url,
            published_at=signal.published_at.isoformat(),
            collected_at=signal.collected_at.isoformat(),
            raw_summary=signal.raw_summary,
            entities_mentioned=signal.entities_mentioned,
            signal_type=signal.signal_type,
        )
        for signal in signals[:3]
    ]
    return NewsScannerOutput(
        signals=partials,
        articles_processed=len(partials),
        articles_skipped=0,
        skip_reasons=[],
    )
