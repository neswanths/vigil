import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import { useVigil } from '../hooks/useVigil';
import { useVigilStore } from '../store/vigilStore';

const LOADING_PHRASES = ['Initializing agents...', 'Scanning market signals...', 'Synthesizing intelligence...'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { submitMission, isLoading, error } = useVigil();
  const missionQuality = useVigilStore((s) => s.missionQuality);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'input' | 'init'>('input');
  const [loadingPhrase, setLoadingPhrase] = useState(0);

  useEffect(() => {
    if (phase !== 'init') return undefined;
    const phraseTimer = window.setInterval(() => {
      setLoadingPhrase((value) => (value + 1) % LOADING_PHRASES.length);
    }, 800);
    const routeTimer = window.setTimeout(() => navigate('/scan'), 2500);
    return () => {
      window.clearInterval(phraseTimer);
      window.clearTimeout(routeTimer);
    };
  }, [navigate, phase]);

  async function handleSubmit() {
    if (!text.trim()) return;
    try {
      const missionId = await submitMission(text.trim());
      if (!missionId) return;
      setPhase('init');
    } catch {
      // error is already set in useVigil
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF7F2] px-4 py-28 font-sans text-[#012B15]">
      <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-24px)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full border border-[#AEC3B0] bg-[#FAF7F2]/90 px-4 py-3 shadow-[0_10px_35px_rgba(15,42,29,0.10)] backdrop-blur md:px-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-[#375534]" />
          <span className="text-lg font-bold text-[#0F2A1D]">Vigil</span>
        </button>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#6B9071] md:flex">
          <button onClick={() => navigate('/')} className="hover:text-[#0F2A1D]">How it works</button>
          <button onClick={() => navigate('/')} className="hover:text-[#0F2A1D]">Examples</button>
          <button onClick={() => navigate('/')} className="hover:text-[#0F2A1D]">Pricing</button>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden rounded-full border border-[#AEC3B0] px-4 py-2 text-sm font-semibold text-[#0F2A1D] transition hover:border-[#375534] sm:inline-flex">
            Sign in
          </button>
        </div>
      </nav>
      <div className="w-full max-w-xl rounded-[24px] border border-[#D6E8B0] bg-[#FFFFFF] p-8 shadow-[0_8px_40px_rgba(1,68,33,0.08)] sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <Layers size={28} className="text-[#014421]" />
          <span className="mt-1 text-xl font-bold text-[#014421]">Vigil</span>
        </div>

        {phase === 'input' ? (
          <>
            <h1 className="mb-2 text-center font-display text-2xl font-bold text-[#012B15]">
              What market decision are you making?
            </h1>
            <p className="mb-8 text-center text-sm text-[#4A6741]">
              Describe your company, product, market, competitors, and the decision you need to make.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Example: We are X company launching Y product in Z market. Competitors include A, B, and C. Should we choose option 1 for volume or option 2 for better margins? Consider pricing pressure, customer perception, and competitor response."
              className="min-h-[180px] w-full resize-none rounded-xl border border-[#D6E8B0] bg-[#FAF7F2] p-4 text-sm text-[#012B15] placeholder:text-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#014421]"
            />
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {['Smartphone pricing in India', 'SaaS positioning vs new entrant', 'D2C brand launch strategy'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setText(prompt)}
                  className="rounded-full border border-[#D6E8B0] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#4A6741] transition hover:border-[#014421] hover:text-[#014421]"
                >
                  {prompt}
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-3 text-center text-sm text-[#EF4444]">{error}</p>
            )}
            {missionQuality?.needs_clarification && (
              <div className="mt-4 rounded-xl border border-[#F59E0B] bg-[#FFFBEB] p-4">
                <p className="text-sm font-semibold text-[#012B15]">{missionQuality.message}</p>
                {missionQuality.suggested_questions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {missionQuality.suggested_questions.map((question) => <p key={question} className="text-sm leading-5 text-[#4A6741]">{question}</p>)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setText(missionQuality.example_prompt)}
                  className="mt-3 text-sm font-semibold text-[#014421] hover:text-[#012B15]"
                >
                  Use example prompt
                </button>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#111111] py-3 text-base font-semibold text-[#FFFFFF] transition duration-150 hover:-translate-y-px hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Initializing agents...' : 'Start Intelligence Scan'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
            <p className="mt-4 text-center text-xs text-[#4A6741]">
              Takes about 60 seconds. No account needed.
            </p>
          </>
        ) : (
          <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
            <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-[#D6E8B0] border-t-[#014421]" />
            <p key={loadingPhrase} className="animate-[fadeIn_0.3s_ease] text-sm font-semibold text-[#014421]">
              {LOADING_PHRASES[loadingPhrase]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
