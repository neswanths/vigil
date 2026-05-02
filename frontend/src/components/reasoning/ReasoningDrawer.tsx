import { X, GitBranch, ShieldCheck, BarChart2, AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';
import type { Insight, Recommendation } from '../../store/vigilStore';

function isInsight(c: Insight | Recommendation): c is Insight {
  return 'body' in c;
}

function Bar({ value, color = '#10b981' }: { value: number; color?: string }) {
  return (
    <div className="flex-1 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  );
}

function Step({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="w-px flex-1 bg-[#e5e7eb] mt-1" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function ReasoningDrawer() {
  const { isOpen, content, type } = useVigilStore((s) => s.reasoningDrawer);
  const closeReasoningDrawer = useVigilStore((s) => s.closeReasoningDrawer);

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={closeReasoningDrawer} />
      <div className="relative w-96 h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-gray-900 font-semibold text-sm flex-1 mr-4 line-clamp-2">
            {isInsight(content) ? content.title : content.title}
          </h2>
          <button onClick={closeReasoningDrawer} className="text-gray-500 hover:text-gray-900 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {type === 'insight' && isInsight(content) && (
            <>
              <Step icon={<GitBranch size={13} color="#10b981" />} label="Market evidence">
                <p className="text-sm text-gray-900">
                  {content.supporting_signals.length} supporting signal{content.supporting_signals.length !== 1 ? 's' : ''}
                </p>
                {content.supporting_signals.map((id) => (
                  <span key={id} className="inline-block mr-1 mt-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">{id}</span>
                ))}
              </Step>

              <Step icon={<ShieldCheck size={13} color="#10b981" />} label="Evidence strength">
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 w-20">Confidence</span>
                  <Bar value={content.confidence} />
                  <span className="text-xs text-gray-900">{Math.round(content.confidence * 100)}%</span>
                </div>
              </Step>

              <Step icon={<BarChart2 size={13} color="#f59e0b" />} label="Belief formed">
                <p className="text-sm text-gray-900 mb-2">{content.body}</p>
                <div className="flex items-center gap-1">
                  {content.confidence_delta >= 0
                    ? <TrendingUp size={13} color="#10b981" />
                    : <TrendingDown size={13} color="#ef4444" />}
                  <span className="text-xs" style={{ color: content.confidence_delta >= 0 ? '#10b981' : '#ef4444' }}>
                    {content.confidence_delta >= 0 ? '+' : ''}{(content.confidence_delta * 100).toFixed(0)}% confidence delta
                  </span>
                </div>
              </Step>

              <Step icon={<AlertTriangle size={13} color="#f59e0b" />} label="Assumptions affected">
                {content.assumptions_affected.length === 0
                  ? <p className="text-xs text-gray-500">None identified</p>
                  : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {content.assumptions_affected.map((a) => (
                        <span key={a} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
              </Step>

              <div className="flex items-center gap-2 mt-1">
                {content.flags_for_human_review
                  ? <><AlertTriangle size={13} color="#f59e0b" /><span className="text-xs text-[#f59e0b]">{content.flag_reason ?? 'Review recommended'}</span></>
                  : <><CheckCircle size={13} color="#10b981" /><span className="text-xs text-emerald-600">No review required</span></>}
              </div>
            </>
          )}

          {type === 'recommendation' && !isInsight(content) && (
            <>
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm text-gray-900">{content.action}</p>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{content.rationale}</p>

              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Supporting beliefs</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {content.supporting_insight_ids.map((id) => (
                  <span key={id} className="px-2 py-0.5 bg-emerald-50 border border-emerald-500 rounded text-xs text-emerald-600">{id}</span>
                ))}
              </div>

              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Assumptions</p>
              <div className="space-y-1 mb-4">
                {content.assumptions.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <CheckCircle size={11} color="#10b981" className="mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-900">{a}</span>
                  </div>
                ))}
              </div>

              <div className="bg-red-50 border border-red-500 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={13} color="#ef4444" className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-red-600 font-semibold mb-1">Risk</p>
                  <p className="text-xs text-gray-900">{content.risk}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
