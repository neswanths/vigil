import { Activity, ArrowRight, GitBranch, Play, ShieldCheck } from 'lucide-react';
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
  const latestSignals = signals.slice(0, 3);
  const liveSignals = signals.filter((signal) => !isFallbackSignal(signal.source_name, signal.source_url));
  const lowEvidence = Boolean(primary && (primary.confidence < 0.48 || liveSignals.length === 0));

  return (
    <div className="min-h-full bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 lg:px-8">
        <section className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          <p className="mb-1 text-xs font-medium uppercase text-gray-500">Current decision</p>
          <h1 className="text-xl font-semibold leading-snug text-gray-900">
            {mission?.raw_input || 'Waiting for a mission'}
          </h1>
        </section>

        {missionQuality?.needs_clarification && missionQuality.level === 'medium' && (
          <section className="rounded-lg border border-amber-500 bg-white px-5 py-4">
            <p className="mb-2 text-sm font-semibold text-[#f59e0b]">A little more detail would improve this decision.</p>
            <div className="grid gap-2 md:grid-cols-2">
              {missionQuality.suggested_questions.slice(0, 2).map((question) => (
                <p key={question} className="text-sm leading-5 text-gray-500">{question}</p>
              ))}
            </div>
          </section>
        )}

        {lowEvidence && (
          <section className="rounded-lg border border-amber-500 bg-white px-5 py-4">
            <p className="mb-1 text-sm font-semibold text-[#f59e0b]">Low evidence mode</p>
            <p className="text-sm leading-6 text-gray-500">
              Vigil did not find strong domain-consistent market signals in the bounded fetch. The answer uses structured reasoning from the mission, product constraints, and competitor benchmarks.
            </p>
          </section>
        )}

        {!primary ? (
          <section className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500">
              <Activity size={18} color="#10b981" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">Vigil is forming a recommendation</h2>
            <p className="mx-auto max-w-md text-sm leading-6 text-gray-500">
              The system will show a clear action here when enough mission-relevant evidence is available.
            </p>
          </section>
        ) : (
          <section className="rounded-lg border border-emerald-500 bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(74,222,128,0.12)]">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded border border-emerald-500 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-600">
                Recommended action
              </span>
              <span className="text-sm text-gray-500">{confidenceLabel(primary.confidence)}</span>
              <span className="text-sm text-gray-500">Act {timeText(primary.time_sensitivity)}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <h2 className="mb-3 text-3xl font-semibold leading-tight text-gray-900 lg:text-4xl">
                  {primary.title}
                </h2>
                <p className="mb-5 text-lg leading-8 text-gray-900">{primary.action}</p>
                <p className="max-w-3xl text-sm leading-6 text-gray-500">{primary.rationale}</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-[#102219] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-500">Confidence</span>
                  <span className="text-sm font-semibold text-gray-900">{Math.round(primary.confidence * 100)}%</span>
                </div>
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(primary.confidence * 100)}%` }} />
                </div>
                <p className="mb-1 text-xs uppercase text-gray-500">Main risk</p>
                <p className="text-sm leading-5 text-gray-900">{primary.risk}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => openReasoningDrawer(primary, 'recommendation')}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
              >
                <GitBranch size={16} />
                Why this decision?
              </button>
              <button
                onClick={() => {
                  setPendingSimulationRecommendation(primary);
                  setActiveTab('outcomes');
                }}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:border-emerald-500"
              >
                <Play size={16} />
                What happens if we do this?
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
              >
                View alternatives
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Why Vigil thinks this</p>
                <h3 className="text-lg font-semibold text-gray-900">Key beliefs</h3>
              </div>
              <button onClick={() => setActiveTab('actions')} className="text-sm text-gray-500 hover:text-gray-900">
                See all
              </button>
            </div>
            {supportingInsights.length === 0 ? (
              <p className="text-sm text-gray-500">No validated beliefs yet.</p>
            ) : (
              <div className="space-y-3">
                {supportingInsights.map((insight) => (
                  <button
                    key={insight.id}
                    onClick={() => openReasoningDrawer(insight, 'insight')}
                    className="block w-full rounded-md border border-gray-200 bg-[#102219] p-3 text-left transition-colors hover:border-emerald-500"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <ShieldCheck size={14} color="#10b981" />
                      <span className="text-sm font-semibold text-gray-900">{insight.title}</span>
                    </div>
                    <p className="line-clamp-2 text-sm leading-5 text-gray-500">{insight.body}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase text-gray-500">Market movement</p>
              <h3 className="text-lg font-semibold text-gray-900">Latest signals</h3>
            </div>
            {latestSignals.length === 0 ? (
              <p className="text-sm text-gray-500">Waiting for market signals.</p>
            ) : (
              <div className="space-y-3">
                {latestSignals.map((signal) => (
                  <div key={signal.id} className="border-l border-gray-200 pl-3">
                    <p className="line-clamp-2 text-sm leading-5 text-gray-900">{signal.raw_summary}</p>
                    <p className="mt-1 text-xs text-gray-500">
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
  );
}
