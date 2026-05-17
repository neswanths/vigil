import { ChevronRight, Radio } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';
import SignalCard from '../signals/SignalCard';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidePanel({ isOpen, onToggle }: Props) {
  const signals = useVigilStore((s) => s.signals);
  const liveSignals = signals.filter((signal) => signal.source_name !== 'Structured Fallback' && signal.source_url);

  if (!isOpen) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-r border-[#D6E8B0] bg-[#F2F9E0] pt-3">
        <button onClick={onToggle} className="text-[#4A6741] transition-colors hover:text-[#012B15]">
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <aside className="flex min-h-0 w-80 shrink-0 flex-col border-l border-[#D6E8B0] bg-[#F2F9E0]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#D6E8B0] px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-[#014421]" />
          <span className="text-sm font-semibold text-[#012B15]">Market Signals</span>
          <span className="text-xs text-[#4A6741]">({liveSignals.length})</span>
        </div>
        <button onClick={onToggle} className="text-[#4A6741] transition-colors hover:text-[#012B15]">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="flex-1 divide-y divide-[#D6E8B0] overflow-y-auto">
        {liveSignals.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 px-5 text-center">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-medium text-[#012B15]">No live market signals accepted</span>
            <span className="text-xs leading-5 text-[#4A6741]">
              Vigil filtered out weak or off-domain results. The current answer is using structured reasoning, not live news evidence.
            </span>
          </div>
        ) : (
          liveSignals.map((s) => <SignalCard key={s.id} signal={s} />)
        )}
      </div>
    </aside>
  );
}
