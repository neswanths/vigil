import { useState } from 'react';
import { AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';
import { postSimulate } from '../../lib/api';
import type { ScenarioItem } from '../../store/vigilStore';

const PROB_COLOR: Record<string, string> = {
  likely: '#10b981',
  possible: '#f59e0b',
  unlikely: '#ef4444',
};

function ScenarioCard({ title, scenario }: { title: string; scenario: ScenarioItem }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <span className="text-xs font-semibold uppercase" style={{ color: PROB_COLOR[scenario.probability_label] }}>
          {scenario.probability_label}
        </span>
      </div>
      <p className="mb-4 text-sm leading-6 text-gray-900">{scenario.outcome}</p>
      <div className="mb-4 space-y-2">
        {scenario.conditions.map((condition, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-sm leading-5 text-gray-500">{condition}</span>
          </div>
        ))}
      </div>
      <div className="border-l border-emerald-500 pl-3">
        <p className="text-xs uppercase text-gray-500">Watch for</p>
        <p className="text-sm leading-5 text-gray-900">{scenario.early_signal}</p>
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
        <span className="max-w-md text-sm leading-6 text-gray-500">
          Choose an action first. Vigil will then show what is likely to happen if you take it.
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 lg:px-8">
      <section className="mb-5 rounded-lg border border-gray-200 bg-white p-5">
        <p className="mb-1 text-xs font-medium uppercase text-gray-500">Testing this action</p>
        <h2 className="mb-2 text-2xl font-semibold text-gray-900">{pending.title}</h2>
        <p className="text-sm leading-6 text-gray-500">{pending.action}</p>
      </section>

      {!activeSimulation && (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
          <button
            onClick={runSimulation}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Play size={16} />
            {loading ? 'Testing outcome...' : 'Test outcome'}
          </button>
          {loading && (
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-gray-500">Vigil is checking the assumptions behind this action.</span>
            </div>
          )}
        </section>
      )}

      {activeSimulation && (
        <div className="space-y-5">
          <section className="rounded-lg border border-emerald-500 bg-white p-5">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} color="#10b981" className="mt-0.5 shrink-0" />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-emerald-600">Likely readout</p>
                <p className="text-lg leading-7 text-gray-900">{activeSimulation.verdict}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <ScenarioCard title="If things break well" scenario={activeSimulation.scenarios.optimistic} />
            <ScenarioCard title="Most grounded case" scenario={activeSimulation.scenarios.neutral} />
            <ScenarioCard title="If the risk shows up" scenario={activeSimulation.scenarios.pessimistic} />
          </section>

          <section className="rounded-lg border border-amber-500 bg-white p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} color="#f59e0b" className="mt-0.5 shrink-0" />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-[#f59e0b]">Critical assumption</p>
                <p className="text-sm leading-6 text-gray-900">{activeSimulation.critical_assumption}</p>
                <p className="mt-2 text-xs text-gray-500">
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
