import { X, GitBranch, ShieldCheck, BarChart2, AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';
import type { Insight, Recommendation, Signal } from '../../store/vigilStore';

function isInsight(c: Insight | Recommendation): c is Insight {
  return 'body' in c;
}

function isSignal(value: Signal | undefined): value is Signal {
  return Boolean(value);
}

function isKnownInsight(value: Insight | undefined): value is Insight {
  return Boolean(value);
}

function Bar({ value, color = '#014421' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#D6E8B0]">
      <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  );
}

function Step({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D6E8B0] bg-[#F2F9E0]">
          {icon}
        </div>
        <div className="mt-1 w-px flex-1 bg-[#D6E8B0]" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <p className="mb-1 text-xs uppercase tracking-wider text-[#4A6741]">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function ReasoningDrawer() {
  const { isOpen, content, type } = useVigilStore((s) => s.reasoningDrawer);
  const closeReasoningDrawer = useVigilStore((s) => s.closeReasoningDrawer);
  const insights = useVigilStore((s) => s.insights);
  const signals = useVigilStore((s) => s.signals);

  if (!isOpen || !content) return null;

  const signalById = new Map(signals.map((signal) => [signal.id, signal]));
  const insightById = new Map(insights.map((insight) => [insight.id, insight]));
  const supportedSignals = isInsight(content)
    ? content.supporting_signals
      .map((id) => signalById.get(id))
      .filter(isSignal)
      .filter((signal) => signal.source_name !== 'Structured Fallback' && signal.source_url)
    : [];
  const supportingBeliefs = !isInsight(content)
    ? content.supporting_insight_ids.map((id) => insightById.get(id)).filter(isKnownInsight)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={closeReasoningDrawer} />
      <div className="relative flex h-full w-96 flex-col overflow-hidden border-l-4 border-[#014421] bg-[#FFFFFF]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#D6E8B0] px-6 py-4">
          <h2 className="mr-4 line-clamp-2 flex-1 font-display text-xl font-bold text-[#012B15]">
            {isInsight(content) ? content.title : content.title}
          </h2>
          <button onClick={closeReasoningDrawer} className="shrink-0 text-[#4A6741] transition-colors hover:text-[#012B15]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {type === 'insight' && isInsight(content) && (
            <>
              <Step icon={<GitBranch size={13} className="text-[#014421]" />} label="Market evidence">
                {supportedSignals.length === 0 ? (
                    <p className="text-sm leading-6 text-[#4A6741]">
                      No live market signal supports this belief. It is based on structured low-evidence reasoning.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {supportedSignals.map((signal) => (
                        <div key={signal.id} className="rounded-lg border border-[#D6E8B0] bg-[#F2F9E0] p-2">
                          <p className="text-xs leading-5 text-[#012B15]">{signal.raw_summary}</p>
                          <p className="mt-1 text-xs text-[#4A6741]">{signal.source_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </Step>

              <Step icon={<ShieldCheck size={13} className="text-[#014421]" />} label="Evidence strength">
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-20 text-xs text-[#4A6741]">Confidence</span>
                  <Bar value={content.confidence} />
                  <span className="text-xs text-[#012B15]">{Math.round(content.confidence * 100)}%</span>
                </div>
              </Step>

              <Step icon={<BarChart2 size={13} className="text-[#B45309]" />} label="Belief formed">
                <p className="mb-2 text-sm text-[#012B15]">{content.body}</p>
                <div className="flex items-center gap-1">
                  {content.confidence_delta >= 0
                    ? <TrendingUp size={13} className="text-[#014421]" />
                    : <TrendingDown size={13} className="text-[#EF4444]" />}
                  <span className="text-xs" style={{ color: content.confidence_delta >= 0 ? '#014421' : '#EF4444' }}>
                    {content.confidence_delta >= 0 ? '+' : ''}{(content.confidence_delta * 100).toFixed(0)}% confidence delta
                  </span>
                </div>
              </Step>

              <Step icon={<AlertTriangle size={13} className="text-[#B45309]" />} label="Assumptions affected">
                {content.assumptions_affected.length === 0
                  ? <p className="text-xs text-[#4A6741]">None identified</p>
                  : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {content.assumptions_affected.map((a) => (
                        <span key={a} className="rounded-full border border-[#D6E8B0] bg-[#F2F9E0] px-2 py-0.5 text-xs text-[#4A6741]">
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
              </Step>

              <div className="flex items-center gap-2 mt-1">
                {content.flags_for_human_review
                  ? <><AlertTriangle size={13} className="text-[#B45309]" /><span className="text-xs text-[#B45309]">{content.flag_reason ?? 'Review recommended'}</span></>
                  : <><CheckCircle size={13} className="text-[#014421]" /><span className="text-xs text-[#014421]">No review required</span></>}
              </div>
            </>
          )}

          {type === 'recommendation' && !isInsight(content) && (
            <>
              <div className="mb-4 rounded-xl bg-[#F2F9E0] px-4 py-3">
                <p className="text-sm text-[#4A6741]">{content.action}</p>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-[#4A6741]">{content.rationale}</p>

              <p className="mb-2 text-xs uppercase tracking-wider text-[#4A6741]">Supporting beliefs</p>
              <div className="space-y-2 mb-4">
                {supportingBeliefs.map((insight) => (
                  <div key={insight.id} className="rounded-lg border border-[#D6E8B0] bg-[#F2F9E0] p-3">
                    <p className="mb-1 text-xs font-semibold text-[#012B15]">{insight.title}</p>
                    <p className="text-xs leading-5 text-[#4A6741]">{insight.body}</p>
                  </div>
                ))}
                {supportingBeliefs.length === 0 && (
                  <p className="text-xs leading-5 text-[#4A6741]">No supporting belief details are available for this action.</p>
                )}
              </div>

              <p className="mb-2 text-xs uppercase tracking-wider text-[#4A6741]">Assumptions</p>
              <div className="space-y-1 mb-4">
                {content.assumptions.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <CheckCircle size={11} className="mt-0.5 shrink-0 text-[#014421]" />
                    <span className="text-xs text-[#012B15]">{a}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-[#EF4444] bg-[#FEF2F2] p-3">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#EF4444]" />
                <div>
                  <p className="mb-1 text-xs font-semibold text-[#EF4444]">Risk</p>
                  <p className="text-xs text-[#012B15]">{content.risk}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
