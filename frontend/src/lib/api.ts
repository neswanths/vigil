import type { Signal, Insight, MissionQuality, Recommendation, SimulationOutput } from '../store/vigilStore';

const rawBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const postMission = (raw_input: string) =>
  request<{
    status: 'started' | 'needs_clarification';
    mission_id: string | null;
    quality: MissionQuality;
    signals?: Signal[];
    insights?: Insight[];
    recommendations?: Recommendation[];
  }>('/mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_input }),
  });

export const getSignals = (mission_id: string) =>
  request<{ signals: Signal[] }>(`/signals?mission_id=${mission_id}`);

export const getInsights = (mission_id: string) =>
  request<{ insights: Insight[] }>(`/insights?mission_id=${mission_id}`);

export const getStrategy = (mission_id: string) =>
  request<{ recommendations: Recommendation[] }>(`/strategy?mission_id=${mission_id}`);

export const postSimulate = (recommendation_id: string, mission_id: string) =>
  request<SimulationOutput>('/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendation_id, mission_id }),
  });
