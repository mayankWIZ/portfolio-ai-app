import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import AgentChat from "./components/AgentChat";
import { AGENTS, AGENT_BY_KEY } from "./data/agents";
import profile from "./data/profile.json";
import { warmUp } from "./lib/api";

const Town3D = lazy(() => import("./components/Town3D"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

const NAV = [
  ["town", "Town"],
  ["experience", "Experience"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["services", "Services"],
  ["contact", "Contact"],
];

// Old routes (/career, /projects, …) land on the matching section.
const LEGACY = { "/career": "experience", "/projects": "projects", "/services": "services", "/research": "town", "/contact": "contact" };

function Section({ id, eyebrow, title, children, action }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AskButton({ agent, text, onAsk, children }) {
  const a = AGENT_BY_KEY[agent];
  return (
    <button className="ask" style={{ "--accent": a.color }} onClick={() => onAsk(agent, text)}>
      <span className="ask__dot" />
      {children || `Ask ${a.name}`}
    </button>
  );
}

function AgentCards({ selected, onSelect }) {
  return (
    <div className="grid h-full grid-cols-1 content-center gap-3 p-6 sm:grid-cols-2">
      {AGENTS.map((a) => (
        <button
          key={a.key}
          onClick={() => onSelect(a.key)}
          className={`agent-card ${selected === a.key ? "agent-card--on" : ""}`}
          style={{ "--accent": a.color }}
        >
          <span className="agent-card__avatar">{a.name[0]}</span>
          <span className="text-left">
            <strong className="block text-white">{a.name} · {a.building}</strong>
            <span className="text-sm text-slate-400">{a.blurb}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const webgl = useMemo(hasWebGL, []);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    warmUp();
    const target = LEGACY[window.location.pathname];
    if (target) {
      window.history.replaceState(null, "", `/#${target}`);
      setTimeout(() => document.getElementById(target)?.scrollIntoView(), 50);
    }
  }, []);

  const select = useCallback((key) => {
    setSelected(key);
    if (key) setChatOpen(true);
  }, []);

  const askAgent = useCallback((agent, text) => {
    setSelected(agent);
    setChatOpen(true);
    setPending({ agent, text, at: Date.now() });
    document.getElementById("town")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const activeAgent = selected || "welcome";
  const current = profile.experience[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      {/* ------------------------------------------------ nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#town" className="flex items-center gap-2.5 font-semibold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 text-sm font-bold text-slate-950">MR</span>
            <span className="hidden sm:inline">{profile.name}</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <button className="btn-primary" onClick={() => select(selected || "welcome")}>
            Talk to the agents
          </button>
        </div>
      </header>

      {/* ------------------------------------------------ hero: the town */}
      <section id="town" className="relative h-[100svh] min-h-[640px] overflow-hidden pt-16">
        <div className="absolute inset-0 top-16">
          {webgl && !reducedMotion ? (
            <Suspense fallback={<div className="grid h-full place-items-center text-slate-500">Building the town…</div>}>
              <Town3D selected={selected} onSelect={select} />
            </Suspense>
          ) : (
            <AgentCards selected={selected} onSelect={select} />
          )}
        </div>
        <div className="hero-fade pointer-events-none absolute inset-x-0 bottom-0 h-40" />
        <div className="hero-scrim pointer-events-none absolute inset-y-0 left-0 w-full max-w-3xl" />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-5 pb-10 pt-8 sm:px-8">
          <div className={`max-w-xl transition-opacity duration-500 ${chatOpen ? "opacity-0 lg:opacity-100" : ""}`}>
            <p className="eyebrow pointer-events-auto">
              <span className="pulse" /> {current.role.split("·")[0].trim()} · {current.company}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">{profile.name}</h1>
            <p className="mt-4 max-w-lg text-lg text-slate-300">{profile.headline}</p>
            <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => select("welcome")}>Meet the agents</button>
              <button className="btn-ghost" onClick={() => select("career")}>Check job fit</button>
              <a className="btn-ghost" href="#experience">View experience</a>
            </div>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">
            Drag to look around · click a building or agent to chat · {AGENTS.length} agents, one CV, zero LLMs
          </p>
        </div>

        {chatOpen && (
          <div className="chat-dock">
            <AgentChat
              key={activeAgent}
              agentKey={activeAgent}
              onSwitch={(k) => setSelected(k)}
              onClose={() => {
                setChatOpen(false);
                setSelected(null);
              }}
              pendingQuestion={pending}
              onPendingConsumed={() => setPending(null)}
            />
          </div>
        )}
      </section>

      {/* ------------------------------------------------ metrics */}
      <section className="border-y border-white/5 bg-slate-900/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
          {profile.metrics.map((m) => (
            <div key={m.label} className="px-2 py-8 text-center">
              <div className="text-3xl font-semibold tracking-tight text-white">{m.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ about */}
      <Section id="about" eyebrow="About" title="Platform engineer, now leading AI governance">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <p className="text-lg leading-relaxed text-slate-300">{profile.summary}</p>
          <div className="card">
            <p className="text-sm text-slate-400">Currently</p>
            <p className="mt-1 font-semibold text-white">{current.role}</p>
            <p className="text-slate-400">{current.company} · {current.period}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {current.highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex gap-2"><span className="tick">▸</span>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ experience */}
      <Section id="experience" eyebrow="Career HQ · Theo" title="Experience" action={<AskButton agent="career" text="Summarise his experience" onAsk={askAgent} />}>
        <ol className="timeline">
          {profile.experience.map((job) => (
            <li key={job.company} className="timeline__item">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {job.role} <span className="text-slate-400">· {job.company}</span>
                </h3>
                <span className="text-sm tabular-nums text-slate-500">{job.period}</span>
              </div>
              <p className="mt-1 text-slate-400">{job.summary}</p>
              <ul className="mt-3 grid gap-1.5 text-sm md:grid-cols-2">
                {job.highlights.slice(0, 4).map((h) => (
                  <li key={h} className="flex gap-2"><span className="tick">▸</span>{h}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {job.tech.map((t) => <span key={t} className="tag">{t}</span>)}
                <AskButton agent="career" text={`Tell me about his time at ${job.company}`} onAsk={askAgent}>More from Theo</AskButton>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------ skills */}
      <Section id="skills" eyebrow="Toolkit" title="Skills" action={<AskButton agent="career" text="Why should we hire him?" onAsk={askAgent}>Why hire Mayank?</AskButton>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(profile.skills).map(([group, items]) => (
            <div key={group} className="card">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{group}</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {items.map((s) => <span key={s} className="tag tag--bright">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------ projects */}
      <Section id="projects" eyebrow="Engineering Lab · Nova" title="Projects & systems" action={<AskButton agent="project" text="List his projects" onAsk={askAgent} />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profile.projects.map((p) => (
            <article key={p.id} className="card flex flex-col">
              <h3 className="font-semibold text-white">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-400">{p.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tech.slice(0, 5).map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <AskButton agent="project" text={`Tell me about ${p.name}`} onAsk={askAgent}>Ask Nova</AskButton>
                {p.github && (
                  <a className="text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline" href={p.github} target="_blank" rel="noreferrer">
                    Code ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------ services & research */}
      <Section id="services" eyebrow="Services Studio · Max" title="How I can help" action={<AskButton agent="client" text="How does an engagement work?" onAsk={askAgent} />}>
        <div className="grid gap-4 md:grid-cols-2">
          {profile.services.map((s) => (
            <div key={s.name} className="card">
              <h3 className="font-semibold text-white">{s.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="card mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-white">Research Tower · current interests</h3>
            <AskButton agent="research" text="What are his research interests?" onAsk={askAgent} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.research_interests.map((r) => <span key={r} className="tag">{r}</span>)}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ education */}
      <Section id="education" eyebrow="Foundations" title="Education & certifications">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            {profile.education.map((e) => (
              <div key={e.school} className="border-b border-white/5 py-3 first:pt-0 last:border-0 last:pb-0">
                <p className="font-medium text-white">{e.degree}</p>
                <p className="text-sm text-slate-400">{e.school} · {e.period}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <ul className="space-y-3">
              {profile.certifications.map((c) => (
                <li key={c} className="flex gap-2"><span className="tick">✓</span>{c}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-slate-400">Languages: {profile.languages.join(", ")}</p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ contact */}
      <Section id="contact" eyebrow="Contact" title="Let's build something reliable">
        <div className="card flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl text-slate-300">
            Hiring for platform, backend or AI infrastructure leadership, or need help scaling a system? The fastest route is email.
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="btn-primary" href={`mailto:${profile.contact.email}`}>Email Mayank</a>
            <a className="btn-ghost" href={profile.contact.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a className="btn-ghost" href={profile.contact.github} target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
      </Section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {profile.name} · Agents powered by{" "}
        <a className="underline-offset-4 hover:text-white hover:underline" href="https://github.com/mayankWIZ/pybot" target="_blank" rel="noreferrer">
          PyBot
        </a>
        , a rule-based chatbot in plain Python
      </footer>
    </div>
  );
}
