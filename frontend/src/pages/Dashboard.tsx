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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#FAF7F2] font-sans text-[#012B15]">
      <TopBar onToggleVisualizer={() => setActivityOpen((v) => !v)} />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-[#D6E8B0] bg-[#FAF7F2] px-3 sm:px-5">
            <nav className="no-scrollbar flex min-w-0 overflow-x-auto">
              {VIEWS.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveTab(view.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-[3px] px-3 py-3 text-sm transition-colors sm:px-4 ${
                    activeTab === view.id
                      ? 'border-[#014421] font-semibold text-[#014421]'
                      : 'border-transparent font-medium text-[#4A6741] hover:text-[#012B15]'
                  }`}
                >
                  {view.icon}
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              ))}
            </nav>

            <div className="ml-2 flex shrink-0 items-center gap-2 sm:ml-4">
              <button
                onClick={() => setSignalsOpen((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                  signalsOpen
                    ? 'border-[#014421] bg-[#014421] text-[#FAF7F2]'
                    : 'border-[#D6E8B0] bg-transparent text-[#4A6741] hover:text-[#012B15]'
                }`}
              >
                <Radio size={15} />
                <span className="hidden md:inline">Market Signals</span>
              </button>
              <button
                onClick={() => setActivityOpen((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                  activityOpen
                    ? 'border-[#014421] bg-[#014421] text-[#FAF7F2]'
                    : 'border-[#D6E8B0] bg-transparent text-[#4A6741] hover:text-[#012B15]'
                }`}
              >
                <Activity size={15} />
                <span className="hidden md:inline">System Activity</span>
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
          <aside className="flex w-[min(440px,100vw)] shrink-0 flex-col border-l border-[#D6E8B0] bg-[#F2F9E0]">
            <div className="flex shrink-0 items-center justify-between border-b border-[#D6E8B0] px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#4A6741]">Live processing</p>
                <span className="text-sm font-semibold text-[#012B15]">System Activity</span>
              </div>
              <button onClick={() => setActivityOpen(false)} className="text-sm text-[#4A6741] hover:text-[#012B15]">
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
