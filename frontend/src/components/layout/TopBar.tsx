import { Activity, Layers } from 'lucide-react';
import { useVigilStore } from '../../store/vigilStore';

interface Props {
  onToggleVisualizer: () => void;
}

export default function TopBar({ onToggleVisualizer }: Props) {
  const mission = useVigilStore((s) => s.mission);
  const summary = mission?.raw_input
    ? mission.raw_input.slice(0, 60) + (mission.raw_input.length > 60 ? '...' : '')
    : 'No active mission';

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <Layers size={18} color="#10b981" />
        <span className="font-bold text-emerald-600 text-sm">Vigil</span>
      </div>
      <div className="flex-1 text-center">
        <span className="text-gray-500 text-xs">{summary}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-600 text-xs">Live</span>
        </div>
        <button
          onClick={onToggleVisualizer}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-900"
        >
          <Activity size={14} />
          Show System Activity
        </button>
      </div>
    </div>
  );
}
