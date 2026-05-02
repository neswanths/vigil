import { useState } from 'react';
import { useVigilStore } from '../store/vigilStore';
import { postMission } from '../lib/api';

export function useVigil() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMission = useVigilStore((s) => s.setMission);
  const appendSignal = useVigilStore((s) => s.appendSignal);
  const upsertInsight = useVigilStore((s) => s.upsertInsight);
  const upsertRecommendation = useVigilStore((s) => s.upsertRecommendation);
  const clearAll = useVigilStore((s) => s.clearAll);
  const setMissionQuality = useVigilStore((s) => s.setMissionQuality);
  const setAgentStatus = useVigilStore((s) => s.setAgentStatus);

  async function submitMission(raw_input: string): Promise<string | null> {
    setIsLoading(true);
    setError(null);
    clearAll();
    try {
      const { mission_id, quality, status, signals = [], insights = [], recommendations = [] } = await postMission(raw_input);
      setMissionQuality(quality);
      if (status === 'needs_clarification' || !mission_id) {
        return null;
      }
      setMission({ id: mission_id, raw_input });
      setAgentStatus('News Scanner', 'active');
      setAgentStatus('Pricing Scout', 'active');
      setAgentStatus('Signal Scorer', 'idle');
      setAgentStatus('Analyst Agent', 'idle');
      setAgentStatus('Strategist', 'idle');
      signals.forEach(appendSignal);
      insights.forEach(upsertInsight);
      recommendations.forEach(upsertRecommendation);
      setAgentStatus('News Scanner', 'completed');
      setAgentStatus('Pricing Scout', 'completed');
      setAgentStatus('Signal Scorer', 'completed');
      setAgentStatus('Analyst Agent', 'completed');
      setAgentStatus('Strategist', 'completed');
      return mission_id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      throw new Error(msg, { cause: e });
    } finally {
      setIsLoading(false);
    }
  }

  return { submitMission, isLoading, error };
}
