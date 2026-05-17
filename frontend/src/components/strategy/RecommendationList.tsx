import { GitBranch, PlayCircle } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';

function urgencyTone(value: string) {
  if (value === 'immediate') return 'border-[#EF4444] text-[#EF4444]';
  if (value === 'within_week') return 'border-[#F59E0B] text-[#B45309]';
  return 'border-[#D6E8B0] text-[#4A6741]';
}

export default function RecommendationList() {
  const recommendations = [...useVigilStore((s) => s.recommendations)].sort((a, b) => a.rank - b.rank);
  const openReasoningDrawer = useVigilStore((s) => s.openReasoningDrawer);
  const setActiveTab = useVigilStore((s) => s.setActiveTab);
  const setPendingSimulationRecommendation = useVigilStore((s) => s.setPendingSimulationRecommendation);

  if (recommendations.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 bg-[#FAF7F2]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#014421]" />
        <span className="text-sm text-[#4A6741]">Waiting for recommended actions</span>
      </div>
    );
  }

  const [primary, ...others] = recommendations;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-5 py-6 lg:px-8">
      <section className="rounded-xl border-l-4 border-[#014421] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_rgba(1,68,33,0.10)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[#014421] px-3 py-1 text-xs font-semibold uppercase text-[#FAF7F2]">
            Best action
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-xs uppercase ${urgencyTone(primary.time_sensitivity)}`}>
            {primary.time_sensitivity.replace(/_/g, ' ')}
          </span>
        </div>
        <h2 className="mb-2 font-display text-3xl font-bold text-[#012B15]">{primary.title}</h2>
        <p className="mb-4 text-base leading-7 text-[#012B15]">{primary.action}</p>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-[#4A6741]">{primary.rationale}</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openReasoningDrawer(primary, 'recommendation')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#014421] px-4 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:opacity-90"
          >
            <GitBranch size={16} />
            Why this decision?
          </button>
          <button
            onClick={() => {
              setPendingSimulationRecommendation(primary);
              setActiveTab('outcomes');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#014421] px-4 py-2.5 text-sm font-semibold text-[#014421] hover:bg-[#F2F9E0]"
          >
            <PlayCircle size={16} />
            What happens if we do this?
          </button>
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <div className="mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[#4A6741]">Decision space</p>
            <h3 className="text-lg font-semibold text-[#012B15]">Alternative actions</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {others.map((rec) => (
              <article key={rec.id} className="rounded-xl border border-[#D6E8B0] bg-[#F2F9E0] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs uppercase text-[#4A6741]">Option {rec.rank}</span>
                  <span className="text-xs text-[#4A6741]">{Math.round(rec.confidence * 100)}% confidence</span>
                </div>
                <h4 className="mb-2 text-base font-semibold text-[#012B15]">{rec.title}</h4>
                <p className="mb-3 text-sm leading-6 text-[#4A6741]">{rec.action}</p>
                <div className="flex gap-3">
                  <button onClick={() => openReasoningDrawer(rec, 'recommendation')} className="text-sm text-[#4A6741] hover:text-[#012B15]">
                    Why?
                  </button>
                  <button
                    onClick={() => {
                      setPendingSimulationRecommendation(rec);
                      setActiveTab('outcomes');
                    }}
                    className="text-sm text-[#4A6741] hover:text-[#012B15]"
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
