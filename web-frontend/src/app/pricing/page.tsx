'use client';

import { useState } from 'react';
import Link from 'next/link';
import Aurora from '@/components/AuroraBackground';
import GradientText from '@/components/GradientText';
import BlurText from '@/components/BlurText';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

const plans = [
  {
    id: 'free',
    name: 'Free',
    desc: 'Explore the agent at no cost.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Get started',
    ctaHref: '/chat',
    popular: false,
    colorClass: 'plan-green',
    features: [
      { label: '20 messages / day', included: true },
      { label: 'Web search (Tavily)', included: true },
      { label: 'Basic code execution', included: true },
      { label: 'Image generation', included: false },
      { label: 'Satellite tracking', included: false },
      { label: 'Conversation history', included: false },
      { label: 'Priority processing', included: false },
      { label: 'Community support', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'Full power for individuals.',
    monthlyPrice: 19,
    yearlyPrice: 15,
    cta: 'Start free trial',
    ctaHref: '/chat',
    popular: true,
    colorClass: 'plan-blue',
    features: [
      { label: 'Unlimited messages', included: true },
      { label: 'Web search (Tavily)', included: true },
      { label: 'Advanced code execution', included: true },
      { label: 'Image generation (50 / day)', included: true },
      { label: 'Satellite tracking', included: true },
      { label: 'History (30 days)', included: true },
      { label: 'Priority processing', included: true },
      { label: 'Email support', included: true },
    ],
  },
  {
    id: 'operator',
    name: 'Operator',
    desc: 'For teams and builders.',
    monthlyPrice: 49,
    yearlyPrice: 39,
    cta: 'Contact sales',
    ctaHref: 'mailto:MathVov.91@outlook.fr',
    popular: false,
    colorClass: 'plan-pink',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'API access + webhooks', included: true },
      { label: 'Unlimited image generation', included: true },
      { label: 'History (90 days)', included: true },
      { label: 'Custom system prompt', included: true },
      { label: 'Team seats (up to 10)', included: true },
      { label: 'SLA guarantee', included: true },
      { label: 'Dedicated support', included: true },
    ],
  },
];

const comparison = [
  {
    category: 'Usage',
    rows: [
      { label: 'Messages per day', free: '20', pro: 'Unlimited', operator: 'Unlimited' },
      { label: 'Concurrent sessions', free: '1', pro: '3', operator: '10' },
      { label: 'File uploads', free: '5 MB', pro: '30 MB', operator: '100 MB' },
    ],
  },
  {
    category: 'Tools',
    rows: [
      { label: 'Web search', free: true, pro: true, operator: true },
      { label: 'Code execution', free: 'Basic', pro: 'Advanced', operator: 'Advanced' },
      { label: 'Image generation', free: false, pro: '50 / day', operator: 'Unlimited' },
      { label: 'Satellite tracking', free: false, pro: true, operator: true },
    ],
  },
  {
    category: 'History & Data',
    rows: [
      { label: 'Conversation history', free: false, pro: '30 days', operator: '90 days' },
      { label: 'Custom system prompt', free: false, pro: false, operator: true },
      { label: 'API access', free: false, pro: false, operator: true },
    ],
  },
  {
    category: 'Support',
    rows: [
      { label: 'Community forum', free: true, pro: true, operator: true },
      { label: 'Email support', free: false, pro: true, operator: true },
      { label: 'SLA guarantee', free: false, pro: false, operator: true },
      { label: 'Dedicated account manager', free: false, pro: false, operator: true },
    ],
  },
];

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — no lock-in, ever. Cancel from your account settings and your plan downgrades to Free at the end of the billing period. You keep full access until then.',
  },
  {
    q: 'What happens when I hit the Free tier message limit?',
    a: "You'll receive a notification when you reach 20 messages for the day. The limit resets at midnight UTC. Upgrade to Pro for unlimited messages.",
  },
  {
    q: 'Is the yearly discount applied immediately?',
    a: 'Yes. When you choose yearly billing, the discounted rate is charged upfront for 12 months. You save 20% compared to monthly billing.',
  },
  {
    q: 'How does the Operator API access work?',
    a: 'Operator subscribers get a REST API key that mirrors the chat interface — same LangGraph pipeline, same tools, just programmatic. Webhooks let you push events to your own infrastructure.',
  },
  {
    q: 'Do team seats share a message quota?',
    a: 'Each seat on the Operator plan has its own unlimited quota. Seats are managed from a central dashboard and can be reassigned at any time.',
  },
];

function CellValue({ val }: { val: boolean | string }) {
  if (val === true) return (
    <span className="cell-check">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
  if (val === false) return <span className="cell-dash">—</span>;
  return <span className="cell-text">{val}</span>;
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .afu  { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) both; }
        .d1   { animation-delay: 0.08s; }
        .d2   { animation-delay: 0.20s; }
        .d3   { animation-delay: 0.34s; }
        .d4   { animation-delay: 0.48s; }
        .d5   { animation-delay: 0.62s; }
        .d6   { animation-delay: 0.76s; }

        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        /* ── Plan colour themes ── */
        .plan-green { --p-accent:#7cff67; --p-glow:rgba(124,255,103,.10); --p-border:rgba(124,255,103,.18); }
        .plan-blue  { --p-accent:#3A29FF; --p-glow:rgba(58,41,255,.14); --p-border:rgba(58,41,255,.40); }
        .plan-pink  { --p-accent:#FF94B4; --p-glow:rgba(255,148,180,.12); --p-border:rgba(255,148,180,.22); }

        /* ── Pricing card ── */
        .price-card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.07);
          transition: border-color .3s ease, transform .3s ease, background .3s ease;
          position: relative;
          overflow: hidden;
        }
        .price-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% 0%, var(--p-glow, transparent), transparent 70%);
          opacity: 0;
          transition: opacity .4s ease;
          pointer-events: none;
        }
        .price-card:hover { transform: translateY(-3px); background: rgba(255,255,255,.04); }
        .price-card:hover::before { opacity: 1; }

        .price-card.popular {
          border-color: var(--p-border);
          background: rgba(58,41,255,0.06);
          box-shadow: 0 0 0 1px rgba(58,41,255,.20), 0 0 60px rgba(58,41,255,.08), inset 0 1px 0 rgba(255,255,255,.06);
        }
        .price-card.popular::before { opacity: 1; }

        /* ── Popular badge ── */
        .popular-badge {
          background: linear-gradient(90deg, #3A29FF, #9c40ff);
          color: white;
          font-size: 10px;
          font-family: var(--font-geist-mono);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 12px;
          border-radius: 999px;
        }

        /* ── Plan accent ── */
        .plan-dot { background: var(--p-accent); }
        .plan-price-accent { color: var(--p-accent); }

        /* ── CTA button variants ── */
        .btn-outline {
          display: block;
          width: 100%;
          padding: 11px 0;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          transition: border-color .25s ease, color .25s ease, background .25s ease;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.3); color: white; background: rgba(255,255,255,0.04); }

        .btn-primary {
          display: block;
          width: 100%;
          padding: 11px 0;
          border-radius: 999px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #3A29FF, #6c52ff);
          transition: opacity .25s ease, transform .25s ease;
          box-shadow: 0 4px 24px rgba(58,41,255,.35);
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ── Billing toggle ── */
        .toggle-track {
          width: 36px; height: 20px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          position: relative;
          cursor: pointer;
          transition: background .25s ease;
          flex-shrink: 0;
        }
        .toggle-track.on { background: rgba(58,41,255,.7); border-color: rgba(58,41,255,.5); }
        .toggle-thumb {
          position: absolute;
          top: 2px; left: 2px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: white;
          transition: transform .25s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 1px 4px rgba(0,0,0,.4);
        }
        .toggle-track.on .toggle-thumb { transform: translateX(16px); }

        /* ── Comparison table ── */
        .comp-table { width: 100%; border-collapse: collapse; }
        .comp-table th, .comp-table td {
          padding: 13px 20px;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 13px;
        }
        .comp-table th { font-weight: 600; color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 0.06em; background: rgba(255,255,255,0.02); }
        .comp-table td:not(:first-child) { text-align: center; }
        .comp-table th:not(:first-child) { text-align: center; }
        .comp-table tr:last-child td { border-bottom: none; }
        .comp-table .cat-row td {
          font-size: 10px;
          font-family: var(--font-geist-mono);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding-top: 28px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .comp-th-feature { width: 40%; }
        .comp-th-pro { color: #a78bfa; }
        .comp-th-op  { color: #FF94B4; }

        .cell-check { color: #7cff67; display: inline-flex; align-items: center; justify-content: center; }
        .cell-dash  { color: rgba(255,255,255,0.15); }
        .cell-text  { color: rgba(255,255,255,0.65); }

        /* ── Vignette ── */
        .hero-vignette { background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #07070d 100%); }
        .cta-vignette  { background: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, #07070d 100%); }

        /* ── FAQ accordion ── */
        .faq-item {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: border-color .2s ease;
        }
        .faq-item:last-child { border-bottom: none; }
        .faq-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 0;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          color: white;
          font-size: 15px;
          font-weight: 500;
          gap: 16px;
        }
        .faq-icon {
          width: 20px; height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.4);
          transition: border-color .2s ease, color .2s ease, transform .3s ease;
        }
        .faq-btn[aria-expanded="true"] .faq-icon { border-color: rgba(58,41,255,.5); color: #3A29FF; transform: rotate(45deg); }
        .faq-answer {
          overflow: hidden;
          max-height: 0;
          transition: max-height .4s cubic-bezier(.16,1,.3,1), padding .3s ease;
        }
        .faq-answer.open { max-height: 200px; }
        .faq-answer p { padding-bottom: 22px; color: rgba(255,255,255,0.4); font-size: 14px; line-height: 1.75; }

        /* ── Savings tag ── */
        .savings-tag {
          font-size: 10px;
          font-family: var(--font-geist-mono);
          color: #7cff67;
          border: 1px solid rgba(124,255,103,.25);
          background: rgba(124,255,103,.07);
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.05em;
        }
      `}</style>

      <main className="min-h-screen bg-[#07070d] text-white overflow-x-hidden">

        {/* ── NAV ── */}
        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/[0.06] backdrop-blur-xl bg-[#07070d]/70">
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4]" />
              <span className="text-sm font-semibold tracking-widest text-white/80 uppercase">Universal</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors font-mono tracking-wide">Home</Link>
              <Link href="/pricing" className="text-xs text-white font-mono tracking-wide">Pricing</Link>
            </div>
          </div>
          <HoverBorderGradient containerClassName="rounded-full" as="div" className="bg-[#07070d] text-white">
            <Link href="/chat" className="px-5 py-1.5 text-sm font-medium">Open Chat →</Link>
          </HoverBorderGradient>
        </nav>

        {/* ── HERO ── */}
        <section className="relative min-h-[55vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
          <div className="absolute inset-0 z-0">
            <Aurora colorStops={['#3A29FF', '#9c40ff', '#FF94B4']} blend={0.28} amplitude={0.5} speed={0.18} />
          </div>
          <div className="hero-vignette absolute inset-0 z-[1] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
            <div className="afu d1 mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs text-gray-400 backdrop-blur-sm font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7cff67] animate-pulse" />
              No credit card required to start
            </div>

            <div className="afu d2 leading-none tracking-[-0.04em]">
              <div className="flex items-baseline justify-center gap-4 flex-wrap">
                <GradientText
                  className="text-[clamp(48px,9vw,96px)] font-bold !mx-0 !max-w-none !rounded-none leading-none"
                  colors={['#ffffff', '#a78bfa', '#FF94B4', '#ffaa40', '#ffffff']}
                  animationSpeed={9}
                >
                  Simple
                </GradientText>
                <h1 className="text-[clamp(48px,9vw,96px)] font-bold text-white leading-none">
                  pricing.
                </h1>
              </div>
            </div>

            <p className="afu d3 mt-6 max-w-md text-gray-500 text-base leading-relaxed">
              One agent, three tiers. Start free, scale when you&apos;re ready — no hidden fees, no usage surprises.
            </p>

            {/* ── Billing toggle ── */}
            <div className="afu d4 mt-10 flex items-center gap-4">
              <span className={`text-sm transition-colors ${!yearly ? 'text-white' : 'text-gray-600'}`}>Monthly</span>
              <button
                type="button"
                onClick={() => setYearly(v => !v)}
                className={`toggle-track ${yearly ? 'on' : ''}`}
                aria-label="Toggle billing period"
              >
                <div className="toggle-thumb" />
              </button>
              <span className={`text-sm transition-colors flex items-center gap-2 ${yearly ? 'text-white' : 'text-gray-600'}`}>
                Yearly
                <span className="savings-tag">save 20%</span>
              </span>
            </div>
          </div>
        </section>

        {/* ── PRICING CARDS ── */}
        <section className="relative py-4 pb-28 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan, i) => (
                <div
                  key={plan.id}
                  className={`afu price-card rounded-2xl p-8 flex flex-col ${plan.colorClass} ${plan.popular ? 'popular' : ''}`}
                  style={{ animationDelay: `${0.1 + i * 0.12}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="plan-dot w-2 h-2 rounded-full" />
                      <span className="text-sm font-semibold text-white/90">{plan.name}</span>
                    </div>
                    {plan.popular && <span className="popular-badge">Most popular</span>}
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-white">
                        ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-sm text-gray-600 font-mono">/mo</span>
                    </div>
                    {plan.monthlyPrice > 0 && (
                      <p className="text-xs text-gray-700 mt-1 font-mono">
                        {yearly ? `Billed $${plan.yearlyPrice * 12}/yr` : 'Billed monthly'}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mb-8">{plan.desc}</p>

                  {/* CTA */}
                  {plan.popular ? (
                    <Link href={plan.ctaHref} className="btn-primary mb-8">{plan.cta}</Link>
                  ) : (
                    <Link href={plan.ctaHref} className="btn-outline mb-8">{plan.cta}</Link>
                  )}

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-3">
                        {f.included ? (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0" style={{ color: 'var(--p-accent)' }}>
                            <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-white/10">
                            <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                        <span className={`text-xs leading-relaxed ${f.included ? 'text-gray-400' : 'text-gray-700'}`}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE COMPARISON ── */}
        <section className="py-24 px-6 grid-bg relative">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07070d] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07070d] to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10">
            <BlurText
              text="Compare"
              className="text-xs font-mono text-[#FF94B4] tracking-[0.25em] uppercase mb-5 block"
              animateBy="letters"
              delay={60}
            />
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-14 max-w-md leading-tight">
              Every feature, side by side.
            </h2>

            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[rgba(255,255,255,0.015)]">
              <table className="comp-table">
                <thead>
                  <tr>
                    <th className="text-left comp-th-feature" aria-label="Feature">Feature</th>
                    <th>Free</th>
                    <th className="comp-th-pro">Pro</th>
                    <th className="comp-th-op">Operator</th>
                  </tr>
                </thead>
                  {comparison.map((group) => (
                    <tbody key={group.category}>
                      <tr className="cat-row">
                        <td colSpan={4}>{group.category}</td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label}>
                          <td className="text-gray-500">{row.label}</td>
                          <td><CellValue val={row.free} /></td>
                          <td><CellValue val={row.pro} /></td>
                          <td><CellValue val={row.operator} /></td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-28 px-6">
          <div className="max-w-2xl mx-auto">
            <BlurText
              text="FAQ"
              className="text-xs font-mono text-[#ffaa40] tracking-[0.25em] uppercase mb-5 block"
              animateBy="letters"
              delay={60}
            />
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-14 leading-tight">
              Questions, answered.
            </h2>

            <div className="border-t border-white/[0.06]">
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button
                    type="button"
                    className="faq-btn"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-icon">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <div className={`faq-answer ${openFaq === i ? 'open' : ''}`}>
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative py-48 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-55">
            <Aurora colorStops={['#3A29FF', '#FF94B4', '#3A29FF']} blend={0.28} amplitude={0.5} speed={0.18} />
          </div>
          <div className="cta-vignette absolute inset-0 z-[1] pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto">
            <GradientText
              className="text-5xl md:text-6xl font-bold tracking-[-0.04em] !mx-0 !max-w-none !rounded-none"
              colors={['#ffffff', '#9c40ff', '#FF94B4', '#ffffff']}
              animationSpeed={7}
            >
              Ready to start?
            </GradientText>
            <p className="mt-5 text-gray-600 text-lg font-light">Free forever. Upgrade when you need more.</p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <HoverBorderGradient containerClassName="rounded-full" as="div" className="bg-[#07070d] text-white">
                <Link href="/chat" className="px-8 py-3.5 text-sm font-semibold">Launch the agent →</Link>
              </HoverBorderGradient>
              <a href="mailto:MathVov.91@outlook.fr" className="px-7 py-3 text-sm font-medium text-gray-500 hover:text-white transition-colors">
                Talk to sales ↗
              </a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.05] px-8 py-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4]" />
            <span className="text-xs text-gray-700 font-semibold tracking-widest uppercase">Universal</span>
          </div>
          <p className="text-xs text-gray-800 font-mono">Gemini · LangGraph · Next.js</p>
        </footer>

      </main>
    </>
  );
}
