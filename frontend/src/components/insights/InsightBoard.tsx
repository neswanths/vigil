import { useVigilStore } from '../../store/vigilStore';
import InsightCard from './InsightCard';

export default function InsightBoard() {
  const insights = useVigilStore((s) => s.insights);

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-gray-500 text-sm">Waiting for key beliefs</span>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
