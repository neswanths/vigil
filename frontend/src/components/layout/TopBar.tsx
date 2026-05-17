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
    <div className="flex h-14 shrink-0 items-center gap-4 bg-[#014421] px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Layers size={18} className="text-[#FAF7F2]" />
        <span className="text-sm font-bold text-[#FAF7F2]">Vigil</span>
      </div>
      <div className="min-w-0 flex-1 text-center">
        <span className="block truncate text-xs text-[#FAF7F2]/70">{summary}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#86EFAC]" />
          <span className="text-xs text-[#FAF7F2]">Live</span>
        </div>
        <button
          onClick={onToggleVisualizer}
          className="inline-flex items-center gap-2 rounded-full border border-[#FAF7F2]/40 px-3 py-1 text-xs text-[#FAF7F2] transition-colors hover:border-[#FAF7F2]"
        >
          <Activity size={14} />
          <span className="hidden sm:inline">Show System Activity</span>
          <span className="sm:hidden">Activity</span>
        </button>
      </div>
    </div>
  );
}
