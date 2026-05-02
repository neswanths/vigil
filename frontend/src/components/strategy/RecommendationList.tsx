import { GitBranch, PlayCircle } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';

function urgencyTone(value: string) {
  if (value === 'immediate') return 'border-red-500 text-red-600';
  if (value === 'within_week') return 'border-amber-500 text-[#f59e0b]';
  return 'border-gray-200 text-gray-500';
}

export default function RecommendationList() {
  const recommendations = [...useVigilStore((s) => s.recommendations)].sort((a, b) => a.rank - b.rank);
  const openReasoningDrawer = useVigilStore((s) => s.openReasoningDrawer);
  const setActiveTab = useVigilStore((s) => s.setActiveTab);
  const setPendingSimulationRecommendation = useVigilStore((s) => s.setPendingSimulationRecommendation);

  if (recommendations.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm text-gray-500">Waiting for recommended actions</span>
      </div>
    );
  }

  const [primary, ...others] = recommendations;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-5 py-6 lg:px-8">
      <section className="rounded-lg border border-emerald-500 bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded border border-emerald-500 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-600">
            Best action
          </span>
          <span className={`rounded border px-2.5 py-1 text-xs uppercase ${urgencyTone(primary.time_sensitivity)}`}>
            {primary.time_sensitivity.replace(/_/g, ' ')}
          </span>
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-gray-900">{primary.title}</h2>
        <p className="mb-4 text-base leading-7 text-gray-900">{primary.action}</p>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-gray-500">{primary.rationale}</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openReasoningDrawer(primary, 'recommendation')}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:opacity-90"
          >
            <GitBranch size={16} />
            Why this decision?
          </button>
          <button
            onClick={() => {
              setPendingSimulationRecommendation(primary);
              setActiveTab('outcomes');
            }}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:border-emerald-500"
          >
            <PlayCircle size={16} />
            What happens if we do this?
          </button>
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <div className="mb-3">
            <p className="text-xs font-medium uppercase text-gray-500">Decision space</p>
            <h3 className="text-lg font-semibold text-gray-900">Alternative actions</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {others.map((rec) => (
              <article key={rec.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-500">Option {rec.rank}</span>
                  <span className="text-xs text-gray-500">{Math.round(rec.confidence * 100)}% confidence</span>
                </div>
                <h4 className="mb-2 text-base font-semibold text-gray-900">{rec.title}</h4>
                <p className="mb-3 text-sm leading-6 text-gray-500">{rec.action}</p>
                <div className="flex gap-3">
                  <button onClick={() => openReasoningDrawer(rec, 'recommendation')} className="text-sm text-gray-500 hover:text-gray-900">
                    Why?
                  </button>
                  <button
                    onClick={() => {
                      setPendingSimulationRecommendation(rec);
                      setActiveTab('outcomes');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Test outcome
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
