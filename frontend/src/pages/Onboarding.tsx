import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { useVigil } from '../hooks/useVigil';
import { useVigilStore } from '../store/vigilStore';

const AGENTS = ['News Scanner', 'Social Scanner', 'Pricing Scout', 'Analyst Agent', 'Strategist'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { submitMission, isLoading, error } = useVigil();
  const missionQuality = useVigilStore((s) => s.missionQuality);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'input' | 'init'>('input');
  const [connectedCount, setConnectedCount] = useState(0);

  async function handleSubmit() {
    if (!text.trim()) return;
    try {
      const missionId = await submitMission(text.trim());
      if (!missionId) return;
      setPhase('init');
      AGENTS.forEach((_, i) => {
        setTimeout(() => {
          setConnectedCount((c) => {
            const next = c + 1;
            if (next === AGENTS.length) {
              setTimeout(() => navigate('/dashboard'), 800);
            }
            return next;
          });
        }, 600 * (i + 1));
      });
    } catch {
      // error is already set in useVigil
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl p-10">
        <div className="flex flex-col items-center mb-8">
          <Layers size={28} color="#10b981" />
          <span className="font-bold text-xl text-emerald-600 mt-1">Vigil</span>
        </div>

        {phase === 'input' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              What market decision are you making?
            </h1>
            <p className="text-gray-500 text-sm text-center mb-8">
              Describe your company, product, market, competitors, and the decision you need to make.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Example: We are X company launching Y product in Z market. Competitors include A, B, and C. Should we choose option 1 for volume or option 2 for better margins? Consider pricing pressure, customer perception, and competitor response."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 text-sm placeholder-[#9ca3af] resize-none focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {error && (
              <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
            )}
            {missionQuality?.needs_clarification && (
              <div className="mt-4 rounded-lg border border-amber-500 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">{missionQuality.message}</p>
                {missionQuality.suggested_questions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {missionQuality.suggested_questions.map((question) => (
                      <p key={question} className="text-sm leading-5 text-gray-500">{question}</p>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setText(missionQuality.example_prompt)}
                  className="mt-3 text-sm font-semibold text-emerald-600 hover:text-gray-900"
                >
                  Use example prompt
                </button>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className="mt-4 w-full bg-emerald-500 text-[#ffffff] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Initializing...' : 'Start Intelligence Scan'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-8">
              Initializing Intelligence Network
            </h2>
            <div className="space-y-4">
              {AGENTS.map((name, i) => {
                const connected = i < connectedCount;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-500"
                      style={{ background: connected ? '#10b981' : '#9ca3af' }}
                    />
                    <span className="text-sm text-gray-900">{name}</span>
                    <span className="text-xs ml-auto" style={{ color: connected ? '#10b981' : '#9ca3af' }}>
                      {connected ? 'Connected' : 'Initializing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
