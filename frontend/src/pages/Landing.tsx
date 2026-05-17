import { ArrowRight, Check, Coffee, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const previewCards = [
  {
    label: 'The Signal',
    body: 'Brand Y revised pricing on their hero SKU by 12% ahead of seasonal launch. Margin pressure incoming for Q3.',
    rotate: 'lg:-rotate-6 lg:translate-y-10',
  },
  {
    label: 'Threat Detected',
    body: "Two direct competitors filed trademarks in your category this quarter. You haven't.",
    rotate: 'lg:-rotate-2 lg:translate-y-2',
    danger: true,
  },
  {
    label: 'The Play',
    body: "Adjust your Q3 positioning copy to counter Brand Y's new premium value framing before their campaign lands.",
    rotate: 'lg:rotate-3 lg:translate-y-5',
  },
  {
    label: 'Confidence Score',
    score: '87 / 100',
    body: 'High-confidence move with source-backed trail.',
    rotate: 'lg:rotate-6 lg:translate-y-12',
  },
];

const steps = [
  {
    number: '01',
    title: 'Define Your Market',
    body: "Tell Vigil who you're watching: competitors, keywords, product categories. One form. Thirty seconds.",
    className: 'bg-[#375534]',
  },
  {
    number: '02',
    title: 'Agents Go to Work',
    body: 'Five specialized agents scan signals across pricing, positioning, hiring, sentiment, and strategy. They run continuously without you touching anything.',
    className: 'bg-[#375534]',
  },
  {
    number: '03',
    title: 'Read the Brief. Make the Call.',
    body: 'Get a ranked intelligence brief with confidence scores, source trails, and a recommended play, not a wall of raw data.',
    className: 'bg-[#0F2A1D]',
  },
];

const examples = [
  {
    badge: 'SaaS Founder • B2B Pricing',
    signals: [
      'Competitor A launched a free tier targeting your mid-market',
      'Two LinkedIn posts signal new sales motion in your region',
      'G2 review velocity up 40% this month',
      'Key engineer departure visible',
    ],
    call: "They're coming for your mid-market. You have a 6-week window to lock in annual contracts.",
  },
  {
    badge: 'Brand Strategist • Consumer Goods',
    signals: [
      'Brand Y revised hero SKU pricing by 12%',
      'Influencer sentiment shifted to "affordable luxury"',
      'Seasonal Meta ad spend up 3x',
      'No product changelog in 34 days',
    ],
    call: 'The affordable luxury window is closing. Shift your campaign language now.',
  },
  {
    badge: 'Founder • Early-Stage SaaS',
    signals: [
      'Competitor filed 2 trademarks in adjacent category',
      '3 key engineers left in 60 days',
      'Changelog silent for 47 days',
      'Negative review velocity up 18% on G2',
    ],
    call: 'Signs of internal drift. This is your window to accelerate enterprise outreach.',
  },
  {
    badge: 'Head of Growth • Fintech',
    signals: [
      'Competitor ran 3 acquisition campaigns targeting your segment',
      'Their app store rating dropped from 4.6 to 4.1 in 60 days',
      'Two C-suite hires from traditional banking',
      'Pricing page added enterprise tier',
    ],
    call: "They're moving upmarket and losing their core users. Capture the dissatisfied segment now.",
  },
  {
    badge: 'CEO • D2C Health Brand',
    signals: [
      'Competitor partnered with a major retail chain',
      'Their influencer spend shifted from micro to macro creators',
      'New SKU launched at 20% below your anchor price',
      'FDA compliance language added to their site',
    ],
    call: "They're going mainstream. Your premium positioning is your only defensible ground: double down.",
  },
  {
    badge: 'VP Marketing • E-commerce',
    signals: [
      "Competitor's organic traffic up 180% in 90 days",
      '6 new SEO-focused content hires on LinkedIn',
      'Their blog publishing frequency went from 2x to 14x per month',
      'Meta ad spend dropped significantly',
    ],
    call: "They're betting on organic. Your paid advantage is real but temporary. Start the content infrastructure now.",
  },
  {
    badge: 'Founder • B2B Hardware',
    signals: [
      'Competitor announced Series B but delayed shipping',
      'Key manufacturing engineer departures',
      'Customer support response time degraded per G2 reviews',
      'Reseller partnerships going quiet',
    ],
    call: "They're cash-flush but operationally stretched. Your delivery reliability is the wedge. Use it in sales conversations.",
  },
  {
    badge: 'Product Lead • Developer Tools',
    signals: [
      'Competitor deprecated a popular API endpoint with 90-day notice',
      'GitHub issues spiking with migration complaints',
      'Two enterprise customers publicly announced switching',
      'Their Discord went from active to sparse in 30 days',
    ],
    call: 'Their developer trust is breaking. A fast migration guide targeting their customers could convert 10-15% in the next quarter.',
  },
];

const tiers = [
  {
    name: 'Scout',
    price: 'Free',
    tagline: 'Try it once. No account needed.',
    features: ['1 market scan (one-time)', '3 competitors tracked', 'Surface-level signals (pricing + positioning)', '24-hour snapshot, no history'],
    cta: 'Start Free Scan',
  },
  {
    name: 'Operator',
    price: '$19',
    suffix: '/ month',
    tagline: 'For founders keeping a continuous eye on the market.',
    popular: true,
    features: ['10 deep scans / month', 'All 5 agent modules active', 'Source trail + confidence scores on every insight', '30-day signal history', 'Weekly email brief digest'],
    cta: 'Start as Operator',
  },
  {
    name: 'Command',
    price: '$49',
    suffix: '/ month',
    tagline: 'For teams that move on intelligence, not instinct.',
    features: ['Unlimited scans', 'Continuous monitoring (not just on-demand)', 'Custom alert thresholds', 'Slack digest integration (Soon)', 'API access (Soon)', 'Priority scan queue'],
    cta: 'Get Command',
  },
];

function Wave({ flip = false }: { flip?: boolean }) {
  return (
    <svg className={`block h-16 w-full ${flip ? 'rotate-180' : ''}`} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#0F2A1D" d="M0,36L80,44C160,52,320,68,480,60C640,52,800,20,960,16C1120,12,1280,36,1360,48L1440,60L1440,90L1360,90C1280,90,1120,90,960,90C800,90,640,90,480,90C320,90,160,90,80,90L0,90Z" />
    </svg>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center">
      <p className="inline-flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#6B9071]">
        <span className="hidden h-px w-10 bg-[#AEC3B0] sm:block" />
        {children}
        <span className="hidden h-px w-10 bg-[#AEC3B0] sm:block" />
      </p>
    </div>
  );
}

function ExampleCard({ example }: { example: (typeof examples)[number] }) {
  return (
    <article className="flex min-h-[300px] flex-col rounded-2xl border border-[#AEC3B0] bg-[#FFFFFF] p-6 text-left shadow-[0_8px_32px_rgba(15,42,29,0.10)]">
      <span className="inline-flex w-fit rounded-full border border-[#AEC3B0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#6B9071]">
        {example.badge}
      </span>
      <div className="my-5 h-px bg-[#AEC3B0]" />
      <ul className="space-y-3">
        {example.signals.map((signal) => (
          <li key={signal} className="flex gap-2 text-sm leading-5 text-[#0F2A1D]">
            <Check size={15} className="mt-0.5 shrink-0 text-[#375534]" />
            <span>{signal}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 border-l-4 border-[#375534] pl-4 font-display text-lg italic leading-7 text-[#375534]">
        {example.call}
      </p>
    </article>
  );
}

function ExampleCarousel() {
  const [active, setActive] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % examples.length), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const cardPositions = useMemo(() => {
    return examples.map((example, index) => {
      let offset = index - active;
      if (offset > examples.length / 2) offset -= examples.length;
      if (offset < -examples.length / 2) offset += examples.length;
      return { example, index, offset };
    });
  }, [active]);

  function move(direction: number) {
    setActive((value) => (value + direction + examples.length) % examples.length);
  }

  function handlePointerUp(clientX: number) {
    if (dragStart === null) return;
    const distance = clientX - dragStart;
    setDragStart(null);
    if (Math.abs(distance) < 32) return;
    suppressClick.current = true;
    move(distance < 0 ? 1 : -1);
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 120);
  }

  return (
    <div className="mt-16">
      <div
        className="relative mx-auto hidden h-[430px] max-w-6xl touch-pan-y items-center justify-center overflow-hidden lg:flex"
        onPointerDown={(event) => setDragStart(event.clientX)}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
        style={{ perspective: '1200px' }}
      >
        {cardPositions.map(({ example, index, offset }) => {
          const clamped = Math.max(-3, Math.min(3, offset));
          const isCenter = offset === 0;
          const transform = `translateX(${clamped * 230}px) translateY(${Math.abs(clamped) * 26}px) rotate(${clamped * 7}deg) scale(${isCenter ? 1 : 0.9 - Math.abs(clamped) * 0.03})`;
          const opacity = Math.max(0, 1 - Math.abs(clamped) * 0.18);
          return (
            <button
              key={example.badge}
              type="button"
              onClick={() => {
                if (suppressClick.current) return;
                setActive(index);
              }}
              className="absolute w-[390px] cursor-grab text-left transition-all duration-500 active:cursor-grabbing"
              style={{ transform, opacity, zIndex: 20 - Math.abs(clamped), pointerEvents: Math.abs(offset) > 3 ? 'none' : 'auto' }}
              aria-label={`Show ${example.badge}`}
            >
              <ExampleCard example={example} />
            </button>
          );
        })}
      </div>

      <div
        className="relative mx-auto max-w-md lg:hidden"
        onPointerDown={(event) => setDragStart(event.clientX)}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
      >
        <ExampleCard example={examples[active]} />
        <button type="button" onClick={() => !suppressClick.current && move(-1)} className="absolute inset-y-0 left-0 w-1/3" aria-label="Previous example" />
        <button type="button" onClick={() => !suppressClick.current && move(1)} className="absolute inset-y-0 right-0 w-1/3" aria-label="Next example" />
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {examples.map((example, index) => (
          <button
            key={example.badge}
            type="button"
            onClick={() => setActive(index)}
            className={`h-2.5 rounded-full transition-all ${active === index ? 'w-8 bg-[#375534]' : 'w-2.5 bg-[#AEC3B0]'}`}
            aria-label={`Go to example ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const start = () => navigate('/onboarding');
  const [waitlistModal, setWaitlistModal] = useState<string | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#0F2A1D]">
      <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-24px)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full border border-[#AEC3B0] bg-[#FAF7F2]/90 px-4 py-3 shadow-[0_10px_35px_rgba(15,42,29,0.10)] backdrop-blur md:px-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-[#375534]" />
          <span className="text-lg font-bold text-[#0F2A1D]">Vigil</span>
        </button>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#6B9071] md:flex">
          <a href="#how-it-works" className="hover:text-[#0F2A1D]">How it works</a>
          <a href="#examples" className="hover:text-[#0F2A1D]">Examples</a>
          <a href="#pricing" className="hover:text-[#0F2A1D]">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden rounded-full border border-[#AEC3B0] px-4 py-2 text-sm font-semibold text-[#0F2A1D] transition hover:border-[#375534] sm:inline-flex">
            Sign in
          </button>
          <button onClick={start} className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-[#FFFFFF] transition hover:-translate-y-0.5 hover:opacity-90">
            Get Started
          </button>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden px-4 pb-28 pt-36 md:pb-32 md:pt-44">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#AEC3B0] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B9071]">
              <ShieldCheck size={14} className="text-[#375534]" />
              Autonomous agents - no setup required
            </div>
            <h1 className="mx-auto max-w-5xl font-display text-5xl font-bold leading-[0.95] tracking-tight text-[#0F2A1D] md:text-7xl">
              Your Competitors Are Moving.
              <span className="block text-[#375534]">Do You Know Where?</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#6B9071]">
              Point Vigil at your market. Five AI agents go to work immediately: scanning, synthesizing, and briefing you so you never have to monitor anything manually.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={start} className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-base font-semibold text-[#FFFFFF] transition hover:-translate-y-0.5 hover:opacity-90">
                Run My Market Scan <ArrowRight size={18} />
              </button>
              <a href="#examples" className="rounded-full border border-[#375534] px-6 py-3 text-base font-semibold text-[#375534] transition hover:bg-[#FFFFFF]">
                See a Sample Brief
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-[#6B9071]">
              {['No account needed', 'Every insight is sourced', 'Agents start in seconds'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5"><Check size={15} className="text-[#375534]" />{item}</span>
              ))}
            </div>

            <div className="relative mx-auto mt-16 grid max-w-5xl gap-4 lg:h-72 lg:grid-cols-4 lg:gap-0">
              {previewCards.map((card) => (
                <article key={card.label} className={`rounded-3xl border border-[#AEC3B0] bg-[#FFFFFF] p-5 text-left shadow-[0_18px_45px_rgba(15,42,29,0.12)] transition ${card.rotate}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B9071]">{card.label}</span>
                    {card.danger ? <X size={16} className="text-[#375534]" /> : <ShieldCheck size={16} className="text-[#375534]" />}
                  </div>
                  {card.score && <p className="mb-3 font-display text-5xl font-bold text-[#375534]">{card.score}</p>}
                  <p className="text-sm leading-6 text-[#0F2A1D]">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Wave />
        <section className="bg-[#0F2A1D] px-4 py-14 text-center text-[#FFFFFF]">
          <p className="mx-auto max-w-4xl font-display text-3xl font-bold leading-tight md:text-5xl">
            Built for founders tired of hearing about competitor moves after the fact. Real agents. Real sources. No summaries of summaries.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#FFFFFF]/80">
            Five specialized AI agents working continuously so your strategy is never based on last quarter's data.
          </p>
        </section>
        <Wave flip />

        <section id="how-it-works" className="px-4 py-28">
          <div className="mx-auto max-w-6xl">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="mt-5 text-center font-display text-5xl font-bold text-[#0F2A1D] md:text-6xl">Competitive Intelligence in 3 Steps</h2>
            <p className="mx-auto mt-6 max-w-xl text-center text-base leading-7 text-[#6B9071]">No dashboards. No feeds to monitor. No manual research. Just answers.</p>
            <div className="mt-16 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.number} className={`${step.className} min-h-80 rounded-3xl p-8 text-[#FFFFFF] shadow-[0_16px_35px_rgba(15,42,29,0.16)]`}>
                  <p className="font-display text-6xl font-bold text-[#FFFFFF]">{step.number}</p>
                  <h3 className="mt-10 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-[#FFFFFF]/80">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="examples" className="px-4 py-28">
          <div className="mx-auto max-w-6xl">
            <SectionLabel>Examples</SectionLabel>
            <h2 className="mt-5 text-center font-display text-5xl font-bold text-[#0F2A1D] md:text-6xl">Real Signals. Real Briefs.</h2>
            <p className="mx-auto mt-6 max-w-xl text-center text-base leading-7 text-[#6B9071]">Three different markets. Three threats caught early. Zero missed moves.</p>
            <ExampleCarousel />
          </div>
        </section>

        <section className="bg-[#AEC3B0] px-4 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 text-center md:grid-cols-3">
            {[
              ['60s', 'Time to first insight'],
              ['5', 'Specialized agents per scan'],
              ['0', 'Unsourced claims'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-5xl font-bold text-[#0F2A1D]">{value}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-[#375534]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pt-16">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>What a Vigil Brief Looks Like</SectionLabel>
            <div className="mt-12 text-left">
              <article className="rounded-3xl bg-[#375534] p-8 text-[#FFFFFF] shadow-[0_18px_45px_rgba(15,42,29,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFFFFF]/70">Sample Intelligence Brief</p>
                <h3 className="mt-5 font-display text-3xl font-bold">Executive Signal</h3>
                <p className="mt-4 text-sm leading-7 text-[#FFFFFF]/85">
                  Competitor B has repositioned from fast to reliable across all channels in the last 30 days, coinciding with a 22% drop in negative reviews mentioning speed. Their enterprise push is confirmed: 4 new SDR hires in Chicago and NYC.
                </p>
                <div className="mt-6 rounded-2xl border border-[#FFFFFF]/15 bg-[#0F2A1D] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFFFFF]/70">Raw Signal - Vigil Insight</p>
                  <p className="text-sm text-[#FFFFFF]/50 line-through">Competitor B is posting jobs</p>
                  <p className="mt-3 flex gap-2 text-sm leading-6 text-[#FFFFFF]">
                    <Check size={15} className="mt-1 shrink-0 text-[#FFFFFF]" />
                    <span>Competitor B is building an enterprise sales motion targeting FSI vertical. 4 SDR hires in 60 days. Confidence: 91%</span>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <SectionLabel>Simple, usage-based pricing</SectionLabel>
              <h2 className="mt-5 font-display text-5xl font-bold text-[#0F2A1D] md:text-6xl">Pick Your Intelligence Level</h2>
              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[#6B9071]">Free to scan once. Pay when you need agents running continuously.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {tiers.map((tier) => (
                <article key={tier.name} className={`rounded-3xl border p-8 ${tier.popular ? 'border-[#0F2A1D] bg-[#0F2A1D] text-[#FFFFFF]' : 'border-[#AEC3B0] bg-[#FFFFFF] text-[#0F2A1D]'}`}>
                  {tier.popular && <span className="mb-4 inline-flex rounded-full bg-[#FAF7F2] px-3 py-1 text-xs font-bold text-[#0F2A1D]">Most Popular</span>}
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="font-display text-5xl font-bold">{tier.price}</span>
                    {tier.suffix && <span className={`pb-2 text-sm ${tier.popular ? 'text-[#FFFFFF]/75' : 'text-[#6B9071]'}`}>{tier.suffix}</span>}
                  </div>
                  <p className={`mt-3 text-sm leading-6 ${tier.popular ? 'text-[#FFFFFF]/80' : 'text-[#6B9071]'}`}>{tier.tagline}</p>
                  <ul className="mt-8 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className={`flex gap-2 text-sm leading-5 ${tier.popular ? 'text-[#FFFFFF]/85' : 'text-[#0F2A1D]'}`}>
                        <Check size={15} className="mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => tier.name === 'Scout' ? start() : setWaitlistModal(tier.name)} className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${tier.popular ? 'bg-[#FAF7F2] text-[#0F2A1D]' : 'bg-[#111111] text-[#FFFFFF]'}`}>
                    {tier.cta} <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14">
          <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#0F2A1D] px-6 py-24 text-center text-[#FFFFFF] md:px-10">
            <h2 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-tight md:text-7xl">Your next competitive threat is already in the market.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#FFFFFF]/80">Vigil makes sure you see it first. Free scan. No setup. Agents start in seconds.</p>
            <button onClick={start} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-base font-bold text-[#FFFFFF] transition hover:-translate-y-0.5">
              Run My Market Scan <ArrowRight size={18} />
            </button>
            <p className="mt-4 text-sm text-[#FFFFFF]/70">No account. No configuration. No noise.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#AEC3B0] bg-[#FAF7F2] px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-2 text-[#375534]">
            <ShieldCheck size={20} />
            <span className="font-bold">Vigil</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-sm font-medium text-[#6B9071]">
            <a href="#how-it-works" className="hover:text-[#0F2A1D]">How it Works</a>
            <a href="#examples" className="hover:text-[#0F2A1D]">Examples</a>
            <a href="#pricing" className="hover:text-[#0F2A1D]">Pricing</a>
            <a href="#privacy" className="hover:text-[#0F2A1D]">Privacy Policy</a>
            <a href="#feedback" className="hover:text-[#0F2A1D]">Share Feedback</a>
          </div>
          <p className="flex items-center gap-2 text-sm text-[#6B9071]">
            <Coffee size={15} className="text-[#375534]" />
            Built with care and a deep distrust of competitor surprises.
          </p>
        </div>
      </footer>

      {waitlistModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] p-8 text-center shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-2 text-[#375534]">
                <ShieldCheck size={28} />
                <span className="text-xl font-bold text-[#0F2A1D]">Vigil</span>
              </div>
            </div>
            
            {waitlistSuccess ? (
              <div className="py-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#375534]/10">
                  <Check size={24} className="text-[#375534]" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#0F2A1D]">You're on the list &mdash; we'll be in touch.</h3>
                <button 
                  onClick={() => { setWaitlistModal(null); setWaitlistSuccess(false); }}
                  className="mt-8 text-sm font-semibold text-[#6B9071] hover:text-[#0F2A1D]"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl font-bold text-[#0F2A1D]">Get early access to {waitlistModal}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6B9071]">
                  We're launching soon. Join the waitlist and get an extended free trial when we go live.
                </p>
                <form 
                  onSubmit={(e) => { e.preventDefault(); setWaitlistSuccess(true); }}
                  className="mt-6 flex flex-col gap-3"
                >
                  <input 
                    type="email" 
                    required 
                    placeholder="Enter your email" 
                    className="rounded-full border border-[#AEC3B0] bg-transparent px-4 py-3 text-sm text-[#0F2A1D] placeholder-[#6B9071] focus:border-[#375534] focus:outline-none focus:ring-1 focus:ring-[#375534]"
                  />
                  <button 
                    type="submit" 
                    className="rounded-full bg-[#111111] px-4 py-3 text-sm font-semibold text-[#FFFFFF] transition hover:-translate-y-0.5 hover:opacity-90"
                  >
                    Join Waitlist
                  </button>
                </form>
                <button 
                  onClick={() => setWaitlistModal(null)}
                  className="mt-6 text-sm font-semibold text-[#6B9071] hover:text-[#0F2A1D]"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
