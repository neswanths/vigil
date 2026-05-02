import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Signal } from '../../store/vigilStore';

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  competitor_move: { bg: '#fef2f2', color: '#ef4444' },
  market_trend: { bg: '#ecfdf5', color: '#10b981' },
  pricing: { bg: '#fffbeb', color: '#f59e0b' },
  regulatory: { bg: '#fffbeb', color: '#f59e0b' },
  sentiment_shift: { bg: '#ffffff', color: '#6b7280' },
  product_launch: { bg: '#ffffff', color: '#10b981' },
  other: { bg: '#f9fafb', color: '#6b7280' },
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

function Bar({ value, color = '#10b981' }: { value: number; color?: string }) {
  return (
    <div className="flex-1 h-1 bg-[#e5e7eb] rounded-full overflow-hidden">
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
      className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span
          className="text-xs font-mono uppercase px-2 py-0.5 rounded shrink-0"
          style={{ background: style.bg, color: style.color }}
        >
          {signal.signal_type.replace(/_/g, ' ')}
        </span>
        {signal.flags_for_human_review && (
          <div className="flex items-center gap-1 shrink-0">
            <AlertTriangle size={12} color="#f59e0b" />
            <span className="text-[#f59e0b] text-xs">Review</span>
          </div>
        )}
      </div>

      <p className="text-gray-900 text-xs leading-relaxed line-clamp-2 mb-2">{signal.raw_summary}</p>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-500 text-xs w-14 shrink-0">Relevance</span>
        <Bar value={signal.relevance_score} />
      </div>

      <div className="flex justify-between">
        <span className="text-gray-500 text-xs">{isFallback ? 'Structured fallback' : signal.source_name}</span>
        <span className="text-gray-500 text-xs">{isFallback ? 'low evidence' : timeAgo(signal.collected_at)}</span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs w-14 shrink-0">Credibility</span>
            <Bar value={signal.credibility_score} color="#10b981" />
          </div>
          {signal.affected_assumptions.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Assumptions affected</p>
              <div className="flex flex-wrap gap-1">
                {signal.affected_assumptions.map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">
                    {a.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {signal.entities_mentioned.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Entities</p>
              <div className="flex flex-wrap gap-1">
                {signal.entities_mentioned.map((e) => (
                  <span key={e} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-500">
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
