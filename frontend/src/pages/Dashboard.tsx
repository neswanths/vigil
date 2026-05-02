import { useState } from 'react';
import { Activity, ListChecks, PanelRightOpen, PlayCircle, Radio } from 'lucide-react';
import { useVigilStore } from '../store/vigilStore';
import TopBar from '../components/layout/TopBar';
import SidePanel from '../components/layout/SidePanel';
import RecommendationList from '../components/strategy/RecommendationList';
import SimulationCanvas from '../components/strategy/SimulationCanvas';
import AgentPipeline from '../components/visualizer/AgentPipeline';
import ReasoningDrawer from '../components/reasoning/ReasoningDrawer';
import DecisionHome from '../components/decision/DecisionHome';
import type { MainView } from '../store/vigilStore';

const VIEWS: Array<{ id: MainView; label: string; icon: React.ReactNode }> = [
  { id: 'answer', label: 'Answer', icon: <PanelRightOpen size={15} /> },
  { id: 'actions', label: 'Recommended Actions', icon: <ListChecks size={15} /> },
  { id: 'outcomes', label: 'What happens if we do this?', icon: <PlayCircle size={15} /> },
];

export default function Dashboard() {
  const activeTab = useVigilStore((s) => s.activeTab);
  const setActiveTab = useVigilStore((s) => s.setActiveTab);
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
      <TopBar onToggleVisualizer={() => setActivityOpen((v) => !v)} />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5">
            <nav className="flex min-w-0 overflow-x-auto">
              {VIEWS.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveTab(view.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === view.id
                      ? 'border-emerald-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {view.icon}
                  {view.label}
                </button>
              ))}
            </nav>

            <div className="ml-4 flex shrink-0 items-center gap-2">
              <button
                onClick={() => setSignalsOpen((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  signalsOpen
                    ? 'border-emerald-500 text-gray-900'
                    : 'border-gray-200 text-gray-500 hover:text-gray-900'
                }`}
              >
                <Radio size={15} />
                Market Signals
              </button>
              <button
                onClick={() => setActivityOpen((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  activityOpen
                    ? 'border-emerald-500 text-gray-900'
                    : 'border-gray-200 text-gray-500 hover:text-gray-900'
                }`}
              >
                <Activity size={15} />
                System Activity
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === 'answer' && <DecisionHome />}
            {activeTab === 'actions' && <RecommendationList />}
            {activeTab === 'outcomes' && <SimulationCanvas />}
          </div>
        </main>

        {signalsOpen && <SidePanel isOpen={signalsOpen} onToggle={() => setSignalsOpen(false)} />}

        {activityOpen && (
          <aside className="flex w-[440px] shrink-0 flex-col border-l border-gray-200 bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <p className="text-xs uppercase text-gray-500">Live processing</p>
                <span className="text-sm font-semibold text-gray-900">System Activity</span>
              </div>
              <button onClick={() => setActivityOpen(false)} className="text-sm text-gray-500 hover:text-gray-900">
                Hide
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <AgentPipeline />
            </div>
          </aside>
        )}
      </div>

      <ReasoningDrawer />
    </div>
  );
}
