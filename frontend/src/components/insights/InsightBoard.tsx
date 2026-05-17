import { useVigilStore } from '../../store/vigilStore';
import InsightCard from './InsightCard';

export default function InsightBoard() {
  const insights = useVigilStore((s) => s.insights);

  if (insights.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#014421]" />
        <span className="text-sm text-[#4A6741]">Waiting for key beliefs</span>
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
