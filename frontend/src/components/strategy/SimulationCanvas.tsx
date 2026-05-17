import { useState } from 'react';
import { AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';
import { postSimulate } from '../../lib/api';
import type { ScenarioItem } from '../../store/vigilStore';


const PROB_COLOR: Record<string, string> = {
  likely: '#014421',
  possible: '#B45309',
  unlikely: '#EF4444',
};

function ScenarioCard({ title, scenario }: { title: string; scenario: ScenarioItem }) {
  let cardClass = "rounded-xl border border-[#D6E8B0] bg-[#FAF7F2] p-5";
  let titleClass = "text-base font-semibold text-[#012B15]";

  if (title === "Most grounded case") {
    cardClass = "rounded-xl border-y border-r border-[#D6E8B0] border-l-4 border-l-[#375534] bg-[#FFFFFF] p-5 shadow-sm";
    titleClass = "text-lg font-bold text-[#0F2A1D]";
  } else if (title === "If the risk shows up") {
    cardClass = "rounded-xl border-y border-r border-[#D6E8B0] border-l-4 border-l-[#F59E0B] bg-[#FFFBEB] p-5";
  }

  return (
    <article className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className={titleClass}>{title}</h3>
        <span className="text-xs font-semibold uppercase" style={{ color: PROB_COLOR[scenario.probability_label] }}>
          {scenario.probability_label}
        </span>
      </div>
      <p className="mb-4 text-sm leading-6 text-[#012B15]">{scenario.outcome}</p>
      <div className="mb-4 space-y-2">
        {scenario.conditions.map((condition, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#014421]" />
            <span className="text-sm leading-5 text-[#4A6741]">{condition}</span>
          </div>
        ))}
      </div>
      <div className="border-l-4 border-[#014421] pl-3">
        <p className="text-xs uppercase text-[#4A6741]">Watch for</p>
        <p className="text-sm leading-5 text-[#012B15]">{scenario.early_signal}</p>
      </div>
    </article>
  );
}

export default function SimulationCanvas() {
  const mission = useVigilStore((s) => s.mission);
  const activeSimulation = useVigilStore((s) => s.activeSimulation);
  const pending = useVigilStore((s) => s.pendingSimulationRecommendation);
  const setActiveSimulation = useVigilStore((s) => s.setActiveSimulation);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runSimulation() {
    if (!pending || !mission) return;
    setLoading(true);
    setErr(null);
    try {
      const result = await postSimulate(pending.id, mission.id);
      setActiveSimulation(result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  if (!pending) {
    return (
      <div className="flex h-64 items-center justify-center px-6 text-center">
        <span className="max-w-md text-sm leading-6 text-[#4A6741]">
          Choose an action first. Vigil will then show what is likely to happen if you take it.
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 lg:px-8">
      <section className="mb-5 rounded-xl border border-[#D6E8B0] bg-[#F2F9E0] p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#4A6741]">Testing this action</p>
        <h2 className="mb-2 font-display text-2xl font-bold text-[#012B15]">{pending.title}</h2>
        <p className="text-sm leading-6 text-[#4A6741]">{pending.action}</p>
      </section>

      {!activeSimulation && (
        <section className="rounded-xl border border-[#D6E8B0] bg-[#F2F9E0] p-5">
          {err && <p className="mb-3 text-sm text-[#EF4444]">{err}</p>}
          <button
            onClick={runSimulation}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#014421] px-5 py-3 text-sm font-semibold text-[#FAF7F2] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Play size={16} />
            {loading ? 'Testing outcome...' : 'Test outcome'}
          </button>
          {loading && (
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#014421]" />
              <span className="text-sm text-[#4A6741]">Vigil is checking the assumptions behind this action.</span>
            </div>
          )}
        </section>
      )}

      {activeSimulation && (
        <div className="space-y-5">
          <section className="rounded-xl bg-[#0F2A1D] p-6 shadow-[0_4px_24px_rgba(15,42,29,0.15)]">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-[#FAF7F2]" />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2]/70">Likely readout</p>
                <p className="text-lg leading-7 text-[#FAF7F2]">{activeSimulation.verdict}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <ScenarioCard title="If things break well" scenario={activeSimulation.scenarios.optimistic} />
            <ScenarioCard title="Most grounded case" scenario={activeSimulation.scenarios.neutral} />
            <ScenarioCard title="If the risk shows up" scenario={activeSimulation.scenarios.pessimistic} />
          </section>

          <section className="rounded-xl border-y border-r border-[#D6E8B0] border-l-4 border-l-[#F59E0B] bg-[#FFFBEB] p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#B45309]" />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-[#B45309]">Critical assumption</p>
                <p className="text-sm leading-6 text-[#012B15]">{activeSimulation.critical_assumption}</p>
                <p className="mt-2 text-xs text-[#4A6741]">
                  Evidence support: {Math.round(activeSimulation.evidence_support * 100)}%
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
