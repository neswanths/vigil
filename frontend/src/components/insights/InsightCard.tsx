import { AlertTriangle } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';
import type { Insight } from '../../store/vigilStore';

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  strengthened: { bg: '#F2F9E0', color: '#014421', border: '#D6E8B0' },
  weakened: { bg: '#FFFBEB', color: '#B45309', border: '#F59E0B' },
  contradicted: { bg: '#FEF2F2', color: '#EF4444', border: '#EF4444' },
  new: { bg: '#F2F9E0', color: '#014421', border: '#D6E8B0' },
  unchanged: { bg: '#F2F9E0', color: '#4A6741', border: '#D6E8B0' },
};

function confColor(c: number) {
  if (c >= 0.7) return '#014421';
  if (c >= 0.4) return '#B45309';
  return '#EF4444';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function InsightCard({ insight }: { insight: Insight }) {
  const openReasoningDrawer = useVigilStore((s) => s.openReasoningDrawer);
  const st = STATUS_STYLES[insight.status] ?? STATUS_STYLES.unchanged;

  return (
    <div
      className="cursor-pointer rounded-xl border border-[#D6E8B0] bg-[#F2F9E0] p-4 transition-colors hover:border-[#014421]"
      onClick={() => openReasoningDrawer(insight, 'insight')}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="flex-1 text-sm font-semibold leading-snug text-[#012B15]">{insight.title}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded border shrink-0"
          style={{ background: st.bg, color: st.color, borderColor: st.border }}
        >
          {insight.status}
        </span>
      </div>

      <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-[#4A6741]">{insight.body}</p>

      <div className="mb-1 flex justify-between">
        <span className="text-xs text-[#4A6741]">Confidence</span>
        <span className="text-xs text-[#012B15]">{Math.round(insight.confidence * 100)}%</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#D6E8B0]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(insight.confidence * 100)}%`, background: confColor(insight.confidence) }}
        />
      </div>

      {insight.flags_for_human_review && (
        <div className="flex items-center gap-1 mb-2">
          <AlertTriangle size={12} className="text-[#B45309]" />
          <span className="text-xs text-[#B45309]">{insight.flag_reason ?? 'Review Recommended'}</span>
        </div>
      )}

      <p className="text-xs text-[#4A6741]/75">Updated {timeAgo(insight.last_updated)}</p>
    </div>
  );
}
