import Link from 'next/link';
import Aurora from '@/components/AuroraBackground';
import SoftAurora from '@/components/SoftAurora';
import GradientText from '@/components/GradientText';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import BlurText from '@/components/BlurText';

const capabilities = [
  {
    colorClass: 'cap-blue',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    label: 'Web Search',
    description: 'Real-time answers sourced from the live web via Tavily. Always current, never stale.',
    tag: 'tavily · 16 sources',
  },
  {
    colorClass: 'cap-green',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    label: 'Code Execution',
    description: 'Runs Python in a live Jupyter sandbox. Debug, compute, analyse — with real output.',
    tag: 'jupyter · sandboxed',
  },
  {
    colorClass: 'cap-pink',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    label: 'Image Generation',
    description: 'Turns any prompt into a high-fidelity image using Flux Dev via ModelsLab.',
    tag: 'flux dev · modelslab',
  },
  {
    colorClass: 'cap-amber',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    label: 'Satellite Tracking',
    description: 'Live orbital positions and TLE data for any satellite in low-earth orbit via N2YO.',
    tag: 'n2yo · live TLE',
  },
];

const steps = [
  { n: '01', title: 'You ask anything', body: 'Type your question, drop a file, or describe what you need. No prompt engineering required.' },
  { n: '02', title: 'The agent thinks', body: 'Gemini 2.5 Pro orchestrated by LangGraph reasons over your request and selects the right tools.' },
  { n: '03', title: 'Streaming answer', body: 'Results stream back in real time — text, code, images, data — all in one continuous response.' },
];

export default function Home() {
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

        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        /* ── Capability colour themes (CSS custom properties) ── */
        .cap-blue  { --cap-accent:#3A29FF; --cap-glow:rgba(58,41,255,.12); --cap-border:rgba(58,41,255,.18); --cap-tag-border:rgba(58,41,255,.30); }
        .cap-green { --cap-accent:#7cff67; --cap-glow:rgba(124,255,103,.10); --cap-border:rgba(124,255,103,.16); --cap-tag-border:rgba(124,255,103,.26); }
        .cap-pink  { --cap-accent:#FF94B4; --cap-glow:rgba(255,148,180,.12); --cap-border:rgba(255,148,180,.20); --cap-tag-border:rgba(255,148,180,.32); }
        .cap-amber { --cap-accent:#ffaa40; --cap-glow:rgba(255,170,64,.10); --cap-border:rgba(255,170,64,.16); --cap-tag-border:rgba(255,170,64,.26); }

        .cap-icon { background:var(--cap-glow); border:1px solid var(--cap-border); color:var(--cap-accent); }
        .cap-tag  { color:var(--cap-accent); border-color:var(--cap-tag-border); background:var(--cap-glow); }
        .cap-line { background:linear-gradient(to right, var(--cap-accent), transparent); }

        /* ── Card ── */
        .card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background .3s ease, border-color .3s ease, transform .3s ease;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 40% at 50% 0%, var(--cap-glow, transparent), transparent 70%);
          opacity: 0;
          transition: opacity .4s ease;
          pointer-events: none;
        }
        .card:hover { background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.13); transform:translateY(-3px); }
        .card:hover::before { opacity:1; }

        .underline-grow { display:block; height:1px; width:0; transition:width .5s cubic-bezier(.16,1,.3,1); }
        .card:hover .underline-grow { width:100%; }

        /* ── Chat preview window ── */
        .chat-win {
          background: rgba(10,10,20,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }

        /* ── Tool status pills ── */
        .badge-pill {
          display:inline-flex; align-items:center; gap:6px;
          padding:4px 10px;
          border-radius:999px;
          font-size:11px;
          font-family:var(--font-geist-mono);
          border:1px solid;
        }
        .pill-amber { color:#ffaa40; border-color:rgba(255,170,64,.25); background:rgba(255,170,64,.07); }
        .pill-green { color:#7cff67; border-color:rgba(124,255,103,.25); background:rgba(124,255,103,.07); }

        /* ── Vignette overlays ── */
        .hero-vignette { background:radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #07070d 100%); }
        .cta-vignette  { background:radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, #07070d 100%); }
        .soft-aurora-hero { position:absolute; inset:0; top:20%; bottom:20%; }
      `}</style>

      <main className="min-h-screen bg-[#07070d] text-white overflow-x-hidden">

        {/* ── NAV ─────────────────────────────────────────────── */}
        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/[0.06] backdrop-blur-xl bg-[#07070d]/70">
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4]" />
              <span className="text-sm font-semibold tracking-widest text-white/80 uppercase">Universal</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-xs text-white font-mono tracking-wide">Home</Link>
              <Link href="/pricing" className="text-xs text-gray-500 hover:text-white transition-colors font-mono tracking-wide">Pricing</Link>
            </div>
          </div>
          <HoverBorderGradient containerClassName="rounded-full" as="div" className="bg-[#07070d] text-white">
            <Link href="/chat" className="px-5 py-1.5 text-sm font-medium">Open Chat →</Link>
          </HoverBorderGradient>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
          <div className="absolute inset-0 z-0">
            <Aurora colorStops={['#3A29FF', '#9c40ff', '#FF94B4']} blend={0.32} amplitude={0.65} speed={0.22} />
          </div>
          <div className="soft-aurora-hero z-[1] pointer-events-none opacity-60">
            <SoftAurora
              speed={0.6}
              scale={1.5}
              brightness={1}
              color1="#f7f7f7"
              color2="#e100ff"
              noiseFrequency={2.5}
              noiseAmplitude={1}
              bandHeight={0.5}
              bandSpread={1}
              octaveDecay={0.1}
              layerOffset={0}
              colorSpeed={1}
              enableMouseInteraction
              mouseInfluence={0.25}
            />
          </div>
          <div className="hero-vignette absolute inset-0 z-[2] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto">
            <div className="afu d1 mb-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs text-gray-400 backdrop-blur-sm font-mono">
              SiliconFlow · LangChain · multi-agents
            </div>

            <div className="afu d2 leading-none tracking-[-0.045em]">
              <GradientText
                className="text-[clamp(56px,10.5vw,128px)] font-bold !mx-0 !max-w-none !rounded-none leading-none"
                colors={['#ffffff', '#a78bfa', '#FF94B4', '#ffaa40', '#ffffff']}
                animationSpeed={9}
              >
                Intelligence
              </GradientText>
              <h1 className="text-[clamp(56px,10.5vw,128px)] font-bold text-white leading-none mt-[-0.05em]">
                Unleashed.
              </h1>
            </div>

            <div className="afu d3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-10 text-lg text-gray-400">
              <span>Ask me to</span>
              <ContainerTextFlip
                interval={2400}
                textClassName="text-white text-lg font-semibold"
                className="px-3 py-1 bg-white/[0.07] border border-white/[0.12] rounded-lg shadow-none"
                words={['search the web', 'run Python code', 'generate images', 'track satellites', 'analyse files', 'explain anything']}
              />
            </div>

            <p className="afu d4 mt-6 max-w-lg text-gray-500 text-base leading-relaxed">
              A universal AI agent with real-time web access, live code execution,
              image synthesis and orbital tracking — all in one conversation.
            </p>

            <div className="afu d5 flex flex-wrap items-center justify-center gap-4 mt-10">
              <HoverBorderGradient containerClassName="rounded-full" as="div" className="bg-[#07070d] text-white">
                <Link href="/chat" className="px-7 py-3 text-sm font-semibold">Start chatting →</Link>
              </HoverBorderGradient>
              <a href="#capabilities" className="px-7 py-3 text-sm font-medium text-gray-500 hover:text-white transition-colors">
                See capabilities ↓
              </a>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-25">
            <div className="w-px h-14 bg-gradient-to-b from-transparent to-white/70" />
          </div>
        </section>

        {/* ── CAPABILITIES ─────────────────────────────────────── */}
        <section id="capabilities" className="relative py-32 px-6 grid-bg">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07070d] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07070d] to-transparent pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <BlurText
              text="Capabilities"
              className="text-xs font-mono text-[#3A29FF] tracking-[0.25em] uppercase mb-5 block"
              animateBy="letters"
              delay={60}
            />
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-16 max-w-md leading-tight">
              Everything you need, in one agent.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((cap) => (
                <div key={cap.label} className={`card rounded-2xl p-8 group cursor-default ${cap.colorClass}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="cap-icon w-10 h-10 rounded-xl flex items-center justify-center">
                      {cap.icon}
                    </div>
                    <span className="badge-pill cap-tag text-[10px] opacity-50 group-hover:opacity-80 transition-opacity">
                      {cap.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-white/90 group-hover:text-white transition-colors">
                    {cap.label}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-500 transition-colors">
                    {cap.description}
                  </p>
                  <span className="cap-line underline-grow mt-6" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CHAT PREVIEW ─────────────────────────────────────── */}
        <section className="py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-mono text-[#FF94B4] tracking-[0.2em] uppercase mb-4 text-center">Preview</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-14 text-center leading-tight">
              See it in action.
            </h2>

            <div className="chat-win rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <span className="ml-3 text-xs text-gray-700 font-mono">universal-agent · new conversation</span>
              </div>

              <div className="p-8 space-y-7">
                <div className="flex justify-end">
                  <div className="max-w-xs px-4 py-3 rounded-2xl rounded-tr-sm bg-[#3A29FF]/70 text-sm text-white leading-relaxed">
                    Where is the ISS right now? And write a Python script to plot its trajectory.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="badge-pill pill-amber">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa40] animate-pulse" />
                    satellite_tracker · fetching TLE…
                  </span>
                  <span className="badge-pill pill-green">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7cff67] animate-pulse" />
                    code_interpreter · running…
                  </span>
                </div>

                <div className="flex gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4] flex-shrink-0 mt-0.5" />
                  <div className="space-y-3 max-w-lg">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      The ISS is currently at{' '}
                      <code className="text-[#ffaa40] font-mono text-xs bg-[#ffaa40]/10 px-1.5 py-0.5 rounded">51.6°N, 142.3°E</code>
                      , altitude{' '}
                      <code className="text-[#ffaa40] font-mono text-xs bg-[#ffaa40]/10 px-1.5 py-0.5 rounded">408 km</code>
                      , speed{' '}
                      <code className="text-[#ffaa40] font-mono text-xs bg-[#ffaa40]/10 px-1.5 py-0.5 rounded">27,600 km/h</code>.
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Here&apos;s a Python script using{' '}
                      <code className="text-[#7cff67] font-mono text-xs bg-[#7cff67]/10 px-1 py-0.5 rounded">skyfield</code>{' '}
                      and{' '}
                      <code className="text-[#7cff67] font-mono text-xs bg-[#7cff67]/10 px-1 py-0.5 rounded">matplotlib</code>{' '}
                      to plot the 90-minute trajectory:
                    </p>
                    <div className="rounded-xl bg-[#0d1117] border border-white/[0.07] p-4 font-mono text-xs text-gray-400 leading-6">
                      <span className="text-[#7cff67]">from</span>{' '}
                      <span className="text-gray-300">skyfield.api</span>{' '}
                      <span className="text-[#7cff67]">import</span>{' '}
                      <span className="text-gray-300">load, EarthSatellite</span>
                      <br />
                      <span className="text-[#7cff67]">import</span>{' '}
                      <span className="text-gray-300">matplotlib.pyplot</span>{' '}
                      <span className="text-[#7cff67]">as</span>{' '}
                      <span className="text-gray-300">plt</span>
                      <br />
                      <span className="text-gray-600"># Fetch TLE, propagate 90 min, project on map…</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section className="py-28 px-6 grid-bg relative">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07070d] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07070d] to-transparent pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <p className="text-xs font-mono text-[#7cff67] tracking-[0.2em] uppercase mb-5">How it works</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-16 max-w-md leading-tight">
              From prompt to answer in seconds.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
              {steps.map((step) => (
                <div key={step.n} className="bg-[#07070d] p-10 group hover:bg-white/[0.025] transition-colors">
                  <span className="font-mono text-5xl font-bold text-white/[0.06] group-hover:text-white/10 transition-colors block mb-8">
                    {step.n}
                  </span>
                  <h3 className="text-lg font-semibold mb-3 text-white/90">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────── */}
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
            <p className="mt-5 text-gray-600 text-lg font-light">One agent. Infinite possibilities.</p>
            <div className="mt-10">
              <HoverBorderGradient containerClassName="rounded-full mx-auto" as="div" className="bg-[#07070d] text-white">
                <Link href="/chat" className="px-8 py-3.5 text-sm font-semibold">Launch the agent →</Link>
              </HoverBorderGradient>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.05] px-8 py-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#3A29FF] to-[#FF94B4]" />
            <span className="text-xs text-gray-700 font-semibold tracking-widest uppercase">Universal</span>
          </div>
          <p className="text-xs text-gray-800 font-mono">A solo project {"<3"}</p>
        </footer>

      </main>
    </>
  );
}
