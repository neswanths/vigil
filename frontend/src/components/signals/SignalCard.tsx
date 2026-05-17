import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Signal } from '../../store/vigilStore';

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  competitor_move: { bg: '#F2F9E0', color: '#4A6741' },
  market_trend: { bg: '#F2F9E0', color: '#4A6741' },
  pricing: { bg: '#F2F9E0', color: '#4A6741' },
  regulatory: { bg: '#F2F9E0', color: '#4A6741' },
  sentiment_shift: { bg: '#F2F9E0', color: '#4A6741' },
  product_launch: { bg: '#F2F9E0', color: '#4A6741' },
  other: { bg: '#F2F9E0', color: '#4A6741' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Bar({ value, color = '#014421' }: { value: number; color?: string }) {
  return (
    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#D6E8B0]">
      <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  );
}

interface Props { signal: Signal }

export default function SignalCard({ signal }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLES[signal.signal_type] ?? TYPE_STYLES.other;
  const isFallback = signal.source_name === 'Structured Fallback' || !signal.source_url;

  return (
    <div
      className="cursor-pointer px-4 py-3 transition-colors hover:bg-[#FAF7F2]"
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span
          className="shrink-0 rounded-full border border-[#D6E8B0] px-2 py-0.5 text-xs uppercase"
          style={{ background: style.bg, color: style.color }}
        >
          {signal.signal_type.replace(/_/g, ' ')}
        </span>
        {signal.flags_for_human_review && (
          <div className="flex items-center gap-1 shrink-0">
            <AlertTriangle size={12} className="text-[#B45309]" />
            <span className="text-xs text-[#B45309]">Review</span>
          </div>
        )}
      </div>

      <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-[#012B15]">{signal.raw_summary}</p>

      <div className="flex items-center gap-2 mb-1">
        <span className="w-14 shrink-0 text-xs text-[#4A6741]">Relevance</span>
        <Bar value={signal.relevance_score} />
      </div>

      <div className="flex justify-between">
        <span className="text-xs text-[#4A6741]">{isFallback ? 'Structured fallback' : signal.source_name}</span>
        <span className="text-xs text-[#4A6741]">{isFallback ? 'low evidence' : timeAgo(signal.collected_at)}</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-[#D6E8B0] pt-3">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-[#4A6741]">Credibility</span>
            <Bar value={signal.credibility_score} color="#014421" />
          </div>
          {signal.affected_assumptions.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-[#4A6741]">Assumptions affected</p>
              <div className="flex flex-wrap gap-1">
                {signal.affected_assumptions.map((a) => (
                  <span key={a} className="rounded-full border border-[#D6E8B0] bg-[#F2F9E0] px-2 py-0.5 text-xs text-[#4A6741]">
                    {a.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {signal.entities_mentioned.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-[#4A6741]">Entities</p>
              <div className="flex flex-wrap gap-1">
                {signal.entities_mentioned.map((e) => (
                  <span key={e} className="rounded-full border border-[#D6E8B0] bg-[#FAF7F2] px-2 py-0.5 text-xs text-[#4A6741]">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
