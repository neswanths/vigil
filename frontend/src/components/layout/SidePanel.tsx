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
      <div className="w-10 shrink-0 bg-white border-r border-gray-200 flex flex-col items-center pt-3">
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <Radio size={14} color="#10b981" />
          <span className="font-semibold text-sm text-gray-900">Market Signals</span>
          <span className="text-gray-500 text-xs">({liveSignals.length})</span>
        </div>
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-[#e5e7eb]">
        {liveSignals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 px-5 text-center">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-900 text-sm font-medium">No live market signals accepted</span>
            <span className="text-gray-500 text-xs leading-5">
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
