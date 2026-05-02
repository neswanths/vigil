import { create } from 'zustand';

export interface MissionStore {
  id: string;
  raw_input: string;
  industry?: string;
  competitors?: string[];
  decision_context?: string;
  timeframe?: string;
}

export interface MissionQuality {
  score: number;
  level: 'high' | 'medium' | 'low';
  message: string;
  missing_fields: string[];
  suggested_questions: string[];
  example_prompt: string;
  should_proceed: boolean;
  needs_clarification: boolean;
}

export interface Signal {
  id: string;
  source_name: string;
  source_url: string;
  published_at: string;
  collected_at: string;
  raw_summary: string;
  entities_mentioned: string[];
  signal_type: string;
  relevance_score: number;
  credibility_score: number;
  topic_tags: string[];
  affected_assumptions: string[];
  is_relevant: boolean;
  mission_id: string;
  flags_for_human_review?: boolean;
  reasoning?: string;
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  confidence: number;
  confidence_delta: number;
  supporting_signals: string[];
  contradicting_signals: string[];
  assumptions_affected: string[];
  status: string;
  flags_for_human_review: boolean;
  flag_reason?: string | null;
  last_updated: string;
  mission_id: string;
}

export interface Recommendation {
  id: string;
  rank: number;
  title: string;
  action: string;
  rationale: string;
  supporting_insight_ids: string[];
  confidence: number;
  assumptions: string[];
  risk: string;
  time_sensitivity: string;
  mission_id: string;
}

export interface ScenarioItem {
  conditions: string[];
  outcome: string;
  probability_label: 'likely' | 'possible' | 'unlikely';
  early_signal: string;
}

export interface SimulationOutput {
  simulation_id: string;
  recommendation_id: string;
  scenarios: {
    optimistic: ScenarioItem;
    neutral: ScenarioItem;
    pessimistic: ScenarioItem;
  };
  critical_assumption: string;
  evidence_support: number;
  verdict: string;
}

export interface ReasoningDrawerState {
  isOpen: boolean;
  content: Insight | Recommendation | null;
  type: 'insight' | 'recommendation' | null;
}

export type MainView = 'answer' | 'actions' | 'outcomes';

interface VigilState {
  mission: MissionStore | null;
  missionQuality: MissionQuality | null;
  signals: Signal[];
  insights: Insight[];
  recommendations: Recommendation[];
  activeSimulation: SimulationOutput | null;
  pendingSimulationRecommendation: Recommendation | null;
  agentStatuses: Record<string, string>;
  reasoningDrawer: ReasoningDrawerState;
  activeTab: MainView;

  setMission: (mission: MissionStore) => void;
  setMissionQuality: (quality: MissionQuality | null) => void;
  appendSignal: (signal: Signal) => void;
  upsertInsight: (insight: Insight) => void;
  upsertRecommendation: (rec: Recommendation) => void;
  setActiveSimulation: (sim: SimulationOutput | null) => void;
  setPendingSimulationRecommendation: (rec: Recommendation | null) => void;
  setAgentStatus: (agent: string, status: string) => void;
  openReasoningDrawer: (content: Insight | Recommendation, type: 'insight' | 'recommendation') => void;
  closeReasoningDrawer: () => void;
  setActiveTab: (tab: MainView) => void;
  clearAll: () => void;
}

export const useVigilStore = create<VigilState>((set) => ({
  mission: null,
  missionQuality: null,
  signals: [],
  insights: [],
  recommendations: [],
  activeSimulation: null,
  pendingSimulationRecommendation: null,
  agentStatuses: {
    'News Scanner': 'idle',
    'Pricing Scout': 'idle',
    'Signal Scorer': 'idle',
    'Analyst Agent': 'idle',
    'Strategist': 'idle',
  },
  reasoningDrawer: { isOpen: false, content: null, type: null },
  activeTab: 'answer',

  setMission: (mission) => set({ mission }),
  setMissionQuality: (missionQuality) => set({ missionQuality }),
  appendSignal: (signal) => set((s) => {
    if (s.mission && signal.mission_id !== s.mission.id) return {};
    const idx = s.signals.findIndex((existing) => existing.id === signal.id);
    if (idx >= 0) {
      const next = [...s.signals];
      next[idx] = signal;
      return { signals: next };
    }
    return { signals: [signal, ...s.signals] };
  }),
  upsertInsight: (insight) => set((s) => {
    if (s.mission && insight.mission_id !== s.mission.id) return {};
    const idx = s.insights.findIndex((i) => i.id === insight.id);
    if (idx >= 0) {
      const next = [...s.insights];
      next[idx] = insight;
      return { insights: next };
    }
    return { insights: [insight, ...s.insights] };
  }),
  upsertRecommendation: (rec) => set((s) => {
    if (s.mission && rec.mission_id !== s.mission.id) return {};
    const idx = s.recommendations.findIndex((r) => r.id === rec.id);
    if (idx >= 0) {
      const next = [...s.recommendations];
      next[idx] = rec;
      return { recommendations: next.sort((a, b) => a.rank - b.rank) };
    }
    return { recommendations: [...s.recommendations, rec].sort((a, b) => a.rank - b.rank) };
  }),
  setActiveSimulation: (activeSimulation) => set({ activeSimulation }),
  setPendingSimulationRecommendation: (rec) => set({ pendingSimulationRecommendation: rec, activeSimulation: null }),
  setAgentStatus: (agent, status) => set((s) => ({
    agentStatuses: { ...s.agentStatuses, [agent]: status },
  })),
  openReasoningDrawer: (content, type) => set({ reasoningDrawer: { isOpen: true, content, type } }),
  closeReasoningDrawer: () => set({ reasoningDrawer: { isOpen: false, content: null, type: null } }),
  setActiveTab: (activeTab) => set({ activeTab }),
  clearAll: () => set({
    signals: [],
    insights: [],
    recommendations: [],
    activeSimulation: null,
    pendingSimulationRecommendation: null,
    activeTab: 'answer',
    missionQuality: null,
    agentStatuses: {
      'News Scanner': 'idle',
      'Pricing Scout': 'idle',
      'Signal Scorer': 'idle',
      'Analyst Agent': 'idle',
      'Strategist': 'idle',
    },
  }),
}));
