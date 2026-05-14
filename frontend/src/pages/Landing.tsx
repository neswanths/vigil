import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Bot, Radio, GitBranch, ShieldCheck, Zap, Eye, Target } from 'lucide-react';

const SIGNALS = [
  { type: 'competitor_move', summary: 'Competitor X launches a lower-priced alternative that undercuts the mid-market segment', confidence: 0.91 },
  { type: 'market_trend', summary: 'Category demand shifts toward value-led products as buyers compare price and perceived quality', confidence: 0.87 },
  { type: 'pricing', summary: 'Brand Y revises pricing ahead of a seasonal launch window, increasing pressure on margins', confidence: 0.83 },
];

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  competitor_move: { bg: '#fef2f2', color: '#ef4444' },
  market_trend: { bg: '#ecfdf5', color: '#10b981' },
  pricing: { bg: '#fffbeb', color: '#f59e0b' },
};

export default function Landing() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % SIGNALS.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const sig = SIGNALS[idx];
  const style = TYPE_STYLES[sig.type] ?? { bg: '#f9fafb', color: '#6b7280' };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <Layers size={22} color="#10b981" />
          <span className="font-bold text-xl text-emerald-600">Vigil</span>
        </div>
        <button
          onClick={() => navigate('/onboard')}
          className="bg-emerald-500 text-[#ffffff] px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
        >
          Start Intelligence Scan
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-20">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 max-w-4xl">
          Market never sleeps.{' '}
          <span className="whitespace-nowrap text-emerald-600">Neither does Vigil!</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mb-12">
          Autonomous AI agents that continuously scan, synthesize, and recommend so you act before threats become problems.
        </p>

        <div className="w-full max-w-md mx-auto mb-14" style={{ height: '140px' }}>
          <div
            className="h-full bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col justify-between text-left"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease' }}
          >
            <div>
              <span
                className="text-xs font-mono uppercase px-2 py-0.5 rounded"
                style={{ background: style.bg, color: style.color }}
              >
                {sig.type.replace(/_/g, ' ')}
              </span>
              <p className="text-gray-900 text-sm mt-2 leading-snug">{sig.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs">Confidence</span>
              <div className="flex-1 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sig.confidence * 100}%` }} />
              </div>
              <span className="text-gray-900 text-xs font-bold">{Math.round(sig.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-10 mb-16">
          {[
            { icon: <Bot size={22} color="#10b981" />, label: '5 Agents' },
            { icon: <Radio size={22} color="#10b981" />, label: 'Real-time Intelligence' },
            { icon: <GitBranch size={22} color="#10b981" />, label: 'Full Traceability' },
            { icon: <ShieldCheck size={22} color="#10b981" />, label: 'Zero Hallucination Policy' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2">
              {s.icon}
              <span className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            { icon: <Zap size={26} color="#10b981" />, title: 'Truly Autonomous', body: 'No manual querying. Vigil agents work continuously and surface what matters.' },
            { icon: <Eye size={26} color="#10b981" />, title: 'Full Transparency', body: 'Every insight shows its trail: which signal, what source, and why it matters.' },
            { icon: <Target size={26} color="#10b981" />, title: 'Action-Ready Output', body: 'You get ranked recommendations with confidence scores and projected outcomes.' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <div className="bg-white py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 max-w-2xl mx-auto">
          Your next competitive threat is already in the market. Vigil makes sure you see it first.
        </h2>
        <button
          onClick={() => navigate('/onboard')}
          className="bg-emerald-500 text-[#ffffff] px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Start Intelligence Scan
        </button>
      </div>
    </div>
  );
}
