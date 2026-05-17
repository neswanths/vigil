import { Activity, AlertTriangle, ArrowRight, GitBranch, Play, ShieldCheck } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';

function confidenceLabel(value: number) {
  if (value >= 0.72) return 'Strong evidence';
  if (value >= 0.48) return 'Moderate evidence';
  return 'Low evidence';
}

function timeText(value: string) {
  return value.replace(/_/g, ' ');
}

function isFallbackSignal(sourceName: string, sourceUrl: string) {
  return sourceName === 'Structured Fallback' || !sourceUrl;
}

export default function DecisionHome() {
  const mission = useVigilStore((s) => s.mission);
  const missionQuality = useVigilStore((s) => s.missionQuality);
  const recommendations = useVigilStore((s) => s.recommendations);
  const insights = useVigilStore((s) => s.insights);
  const signals = useVigilStore((s) => s.signals);
  const openReasoningDrawer = useVigilStore((s) => s.openReasoningDrawer);
  const setActiveTab = useVigilStore((s) => s.setActiveTab);
  const setPendingSimulationRecommendation = useVigilStore((s) => s.setPendingSimulationRecommendation);

  const primary = [...recommendations].sort((a, b) => a.rank - b.rank)[0];
  const supportingInsights = primary
    ? insights.filter((insight) => primary.supporting_insight_ids.includes(insight.id)).slice(0, 3)
    : insights.slice(0, 3);
  const liveSignals = signals.filter((signal) => !isFallbackSignal(signal.source_name, signal.source_url));
  const latestSignals = liveSignals.slice(0, 3);
  const lowEvidence = Boolean(primary && (primary.confidence < 0.48 || liveSignals.length === 0));

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 lg:px-8">
        <section className="rounded-xl border border-[#D6E8B0] bg-[#F2F9E0] px-5 py-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#4A6741]">Current decision</p>
          <h1 className="text-sm leading-relaxed text-[#012B15]">
            {mission?.raw_input || 'Waiting for a mission'}
          </h1>
        </section>

        {missionQuality?.needs_clarification && missionQuality.level === 'medium' && (
          <section className="rounded-xl border border-[#F59E0B] bg-[#FFFBEB] px-5 py-4">
            <p className="mb-2 text-sm font-semibold text-[#B45309]">A little more detail would improve this decision.</p>
            <div className="grid gap-2 md:grid-cols-2">
              {missionQuality.suggested_questions.slice(0, 2).map((question) => (
                <p key={question} className="text-sm leading-5 text-[#4A6741]">{question}</p>
              ))}
            </div>
          </section>
        )}

        {lowEvidence && (
          <section className="rounded-xl border-l-4 border-l-[#F59E0B] bg-[#FFFBEB] px-5 py-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#0F2A1D]">
              <AlertTriangle size={16} className="text-[#F59E0B]" />
              Low evidence mode
            </p>
            <p className="text-sm leading-6 text-[#0F2A1D]">
              Vigil did not find strong domain-consistent market signals in the bounded fetch. The answer uses structured reasoning from the mission, product constraints, and competitor benchmarks.
            </p>
          </section>
        )}

        {!primary ? (
          <section className="rounded-xl border border-[#D6E8B0] bg-[#F2F9E0] px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#014421]">
              <Activity size={18} className="text-[#014421]" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold text-[#012B15]">Vigil is forming a recommendation</h2>
            <p className="mx-auto max-w-md text-sm leading-6 text-[#4A6741]">
              The system will show a clear action here when enough mission-relevant evidence is available.
            </p>
          </section>
        ) : (
          <section className="rounded-xl border-l-4 border-[#014421] bg-[#FFFFFF] px-6 py-6 shadow-[0_4px_24px_rgba(1,68,33,0.10)]">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#014421] px-3 py-1 text-xs font-semibold uppercase text-[#FAF7F2]">
                Recommended action
              </span>
              <span className="rounded-full bg-[#F2F9E0] px-3 py-1 text-xs text-[#4A6741]">{confidenceLabel(primary.confidence)}</span>
              <span className="rounded-full bg-[#F2F9E0] px-3 py-1 text-xs text-[#4A6741]">Act {timeText(primary.time_sensitivity)}</span>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="mb-3 font-display text-3xl font-bold leading-tight text-[#012B15] lg:text-4xl">
                  {primary.title}
                </h2>
                <p className="mb-5 text-lg leading-8 text-[#012B15]">{primary.action}</p>
                <p className="max-w-3xl text-sm leading-6 text-[#4A6741]">{primary.rationale}</p>
              </div>

              <div className="flex flex-col lg:items-end lg:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B9071]">Confidence Score</p>
                <p className="mt-1 font-display text-5xl font-bold text-[#375534]">{Math.round(primary.confidence * 100)} / 100</p>
                <p className="mt-4 max-w-[280px] rounded-xl bg-[#F2F9E0] p-4 text-left text-sm text-[#4A6741]">
                  <span className="mb-1 block text-xs font-semibold uppercase text-[#014421]">Main Risk</span>
                  {primary.risk}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => openReasoningDrawer(primary, 'recommendation')}
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-[#FFFFFF] transition hover:-translate-y-0.5 hover:opacity-90"
              >
                <GitBranch size={16} />
                Why this decision?
              </button>
              <button
                onClick={() => {
                  setPendingSimulationRecommendation(primary);
                  setActiveTab('outcomes');
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#375534] px-6 py-3 text-sm font-semibold text-[#375534] transition hover:-translate-y-0.5 hover:bg-[#FAF7F2]"
              >
                <Play size={16} />
                What happens if we do this?
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#4A6741] transition hover:-translate-y-0.5 hover:text-[#0F2A1D]"
              >
                View alternatives
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        <div className="mt-8 border-t border-[#AEC3B0] pt-8">
          <h2 className="mb-6 font-display text-2xl font-bold text-[#0F2A1D]">Supporting Evidence</h2>
          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-[#AEC3B0] bg-[#FFFFFF] p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-[#AEC3B0] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B9071]">Why Vigil thinks this</p>
                  <h3 className="mt-1 text-xl font-bold text-[#0F2A1D]">Key beliefs</h3>
                </div>
                <button onClick={() => setActiveTab('actions')} className="text-sm font-semibold text-[#375534] hover:text-[#0F2A1D]">
                  See all
                </button>
              </div>
              {supportingInsights.length === 0 ? (
                <p className="text-sm text-[#4A6741]">No validated beliefs yet.</p>
              ) : (
                <div className="space-y-3">
                  {supportingInsights.map((insight) => (
                    <button
                      key={insight.id}
                      onClick={() => openReasoningDrawer(insight, 'insight')}
                      className="block w-full rounded-xl border border-[#FAF7F2]/10 bg-[#014421] p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:border-l-4 hover:border-l-[#86EFAC]"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#86EFAC]" />
                        <span className="text-sm font-semibold text-[#FAF7F2]">{insight.title}</span>
                      </div>
                      <p className="line-clamp-2 text-sm leading-5 text-[#FAF7F2]/70">{insight.body}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#AEC3B0] bg-[#FFFFFF] p-6 shadow-sm">
              <div className="mb-6 border-b border-[#AEC3B0] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B9071]">Market movement</p>
                <h3 className="mt-1 text-xl font-bold text-[#0F2A1D]">Latest signals</h3>
              </div>
              {latestSignals.length === 0 ? (
                <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <p className="text-sm font-medium text-[#012B15]">No live market signals</p>
                  <p className="max-w-xs text-xs leading-5 text-[#4A6741]">
                    Weak or off-domain articles were filtered out, so this answer is marked as structured low-evidence reasoning.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {latestSignals.map((signal) => (
                    <div key={signal.id} className="rounded-xl border border-[#D6E8B0] bg-[#FAF7F2] p-3">
                      <span className="mb-2 inline-flex rounded-full border border-[#D6E8B0] bg-[#F2F9E0] px-2 py-0.5 text-xs text-[#4A6741]">
                        {signal.signal_type.replace(/_/g, ' ')}
                      </span>
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#012B15]">{signal.raw_summary}</p>
                      <p className="mt-2 border-t border-[#D6E8B0] pt-2 text-xs text-[#4A6741]">
                        {isFallbackSignal(signal.source_name, signal.source_url) ? 'Structured fallback' : signal.source_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
