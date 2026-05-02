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
  if (state === 'processing' || state === 'complete') return '#10b981';
  if (state === 'blocked') return '#f59e0b';
  return '#6b7280';
}

function StateIcon({ state }: { state: StepState }) {
  if (state === 'processing') return <Loader2 size={15} color="#10b981" className="animate-spin" />;
  if (state === 'complete') return <CheckCircle size={15} color="#10b981" />;
  if (state === 'blocked') return <ShieldCheck size={15} color="#f59e0b" />;
  return <Circle size={15} color="#6b7280" />;
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
      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Radio size={15} color="#10b981" />
          <span className="text-sm font-semibold text-gray-900">Live state</span>
        </div>
        <p className="text-sm leading-6 text-gray-500">
          Vigil stays quiet until something changes. Active steps pulse; completed steps hold steady.
        </p>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => {
          const next = steps[index + 1];
          const handoffActive = step.state === 'complete' && next?.state === 'processing';
          return (
            <div key={step.label}>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: stateColor(step.state) }}
                  >
                    <StateIcon state={step.state} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">{step.label}</h3>
                      <span className="text-xs font-semibold uppercase" style={{ color: stateColor(step.state) }}>
                        {stateText(step.state)}
                      </span>
                    </div>
                    <p className="text-sm leading-5 text-gray-500">{step.detail}</p>
                    <p className="mt-2 text-xs text-gray-500">{step.count} item{step.count === 1 ? '' : 's'} passed forward</p>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex h-8 justify-center">
                  <div className={`w-px bg-[#e5e7eb] ${handoffActive ? 'animate-pulse' : ''}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Activity size={15} color="#10b981" />
          <span className="text-sm text-gray-900">Current output</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-gray-500">
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
