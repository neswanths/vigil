import { AlertTriangle } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';
import type { Insight } from '../../store/vigilStore';

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  strengthened: { bg: '#ecfdf5', color: '#10b981', border: '#10b981' },
  weakened: { bg: '#fffbeb', color: '#f59e0b', border: '#f59e0b' },
  contradicted: { bg: '#fef2f2', color: '#ef4444', border: '#ef4444' },
  new: { bg: '#ffffff', color: '#10b981', border: '#10b981' },
  unchanged: { bg: '#f9fafb', color: '#9ca3af', border: '#9ca3af' },
};

function confColor(c: number) {
  if (c >= 0.7) return '#10b981';
  if (c >= 0.4) return '#f59e0b';
  return '#ef4444';
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
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-colors"
      onClick={() => openReasoningDrawer(insight, 'insight')}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{insight.title}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded border shrink-0"
          style={{ background: st.bg, color: st.color, borderColor: st.border }}
        >
          {insight.status}
        </span>
      </div>

      <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-3">{insight.body}</p>

      <div className="mb-1 flex justify-between">
        <span className="text-gray-500 text-xs">Confidence</span>
        <span className="text-gray-900 text-xs">{Math.round(insight.confidence * 100)}%</span>
      </div>
      <div className="h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(insight.confidence * 100)}%`, background: confColor(insight.confidence) }}
        />
      </div>

      {insight.flags_for_human_review && (
        <div className="flex items-center gap-1 mb-2">
          <AlertTriangle size={12} color="#f59e0b" />
          <span className="text-[#f59e0b] text-xs">{insight.flag_reason ?? 'Review Recommended'}</span>
        </div>
      )}

      <p className="text-gray-400 text-xs">Updated {timeAgo(insight.last_updated)}</p>
    </div>
  );
}
