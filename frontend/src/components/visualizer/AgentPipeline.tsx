import { Activity, CheckCircle, Circle, Loader2, Radio, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useVigilStore } from '../../store/vigilStore';

type StepState = 'idle' | 'processing' | 'complete' | 'blocked';

function normalizeStatus(status: string | undefined, hasOutput: boolean): StepState {
  if (status === 'blocked' || status === 'error') return 'blocked';
  if (status === 'active' || status === 'processing') return 'processing';
  if (status === 'completed' || hasOutput) return 'complete';
  return 'idle';
}

function stateText(state: StepState) {
  if (state === 'processing') return 'Working';
  if (state === 'complete') return 'Complete';
  if (state === 'blocked') return 'Needs evidence';
  return 'Waiting';
}

function stateColor(state: StepState) {
  if (state === 'processing' || state === 'blocked') return '#B45309';
  if (state === 'complete') return '#014421';
  return '#4A6741';
}

function StateIcon({ state }: { state: StepState }) {
  if (state === 'processing') return <Loader2 size={15} className="animate-spin text-[#B45309]" />;
  if (state === 'complete') return <CheckCircle size={15} className="text-[#014421]" />;
  if (state === 'blocked') return <ShieldCheck size={15} className="text-[#B45309]" />;
  return <Circle size={15} className="text-[#4A6741]" />;
}

export default function AgentPipeline() {
  const statuses = useVigilStore((s) => s.agentStatuses);
  const signals = useVigilStore((s) => s.signals);
  const insights = useVigilStore((s) => s.insights);
  const recommendations = useVigilStore((s) => s.recommendations);

  const steps = useMemo(() => {
    const newsCount = signals.filter((s) => s.signal_type !== 'pricing').length;
    const pricingCount = signals.filter((s) => s.signal_type === 'pricing').length;
    return [
      {
        label: 'Market scan',
        detail: 'Finding mission-relevant movement',
        count: newsCount,
        state: normalizeStatus(statuses['News Scanner'], newsCount > 0),
      },
      {
        label: 'Pricing scan',
        detail: 'Checking pricing and competitor changes',
        count: pricingCount,
        state: normalizeStatus(statuses['Pricing Scout'], pricingCount > 0),
      },
      {
        label: 'Evidence filter',
        detail: 'Rejecting weak or off-domain signals',
        count: signals.length,
        state: normalizeStatus(statuses['Signal Scorer'], signals.length > 0),
      },
      {
        label: 'Belief update',
        detail: 'Turning evidence into decision beliefs',
        count: insights.length,
        state: normalizeStatus(statuses['Analyst Agent'], insights.length > 0),
      },
      {
        label: 'Action selection',
        detail: 'Choosing the best recommendation',
        count: recommendations.length,
        state: normalizeStatus(statuses.Strategist, recommendations.length > 0),
      },
    ];
  }, [statuses, signals, insights, recommendations]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-5 rounded-lg border border-[#D6E8B0] bg-[#F2F9E0] p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#86EFAC]" />
          <Radio size={15} className="text-[#014421]" />
          <span className="text-sm font-semibold text-[#012B15]">Live state</span>
        </div>
        <p className="text-sm leading-6 text-[#4A6741]">
          Vigil stays quiet until something changes. Active steps pulse; completed steps hold steady.
        </p>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => {
          const next = steps[index + 1];
          const handoffActive = step.state === 'complete' && next?.state === 'processing';
          return (
            <div key={step.label}>
              <div className="rounded-lg border border-[#D6E8B0] bg-[#F2F9E0] p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${step.state === 'processing' ? 'animate-pulse' : ''}`}
                    style={{ borderColor: stateColor(step.state) }}
                  >
                    <StateIcon state={step.state} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#012B15]">{step.label}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${step.state === 'complete' ? 'bg-[#014421] text-[#FAF7F2]' : ''}`} style={{ color: step.state === 'complete' ? undefined : stateColor(step.state) }}>
                        {stateText(step.state)}
                      </span>
                    </div>
                    <p className="text-xs leading-5 text-[#4A6741]">{step.detail}</p>
                    <p className="mt-2 text-xs text-[#4A6741]">{step.count} item{step.count === 1 ? '' : 's'} passed forward</p>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex h-8 justify-center">
                  <div className={`w-px bg-[#D6E8B0] ${handoffActive ? 'animate-pulse' : ''}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg bg-[#014421] p-3 text-[#FAF7F2]">
        <div className="flex items-center gap-2">
          <Activity size={15} />
          <span className="text-xs font-semibold uppercase tracking-wider">Current output</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#FAF7F2]/85">
          {recommendations.length > 0
            ? `${recommendations.length} recommended action${recommendations.length === 1 ? '' : 's'} ready.`
            : insights.length > 0
              ? `${insights.length} belief${insights.length === 1 ? '' : 's'} formed.`
              : signals.length > 0
                ? `${signals.length} market signal${signals.length === 1 ? '' : 's'} validated.`
                : 'Waiting for mission-relevant evidence.'}
        </p>
      </div>
    </div>
  );
}
