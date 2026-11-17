// The Journey without WebGL or motion: the same chapters as a scrolling timeline story.
import { AGENT_BY_KEY } from "../data/agents";
import profile from "../data/profile.json";
import { CHAPTERS, FINALE_INDEX } from "./chapters";

export default function Story2D({ onAsk, onTry3D, reason }) {
  return (
    <div className="journey-story">
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-24 sm:px-8">
        <p className="eyebrow">The journey · {CHAPTERS.length} chapters</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">From campus to AI governance</h1>
        <p className="mt-3 text-slate-300">{profile.headline}</p>
        {onTry3D && (
          <p className="mt-4 text-sm text-slate-400">
            {reason}{" "}
            <button className="text-sky-300 underline underline-offset-2 hover:text-white" onClick={onTry3D}>
              Open the 3D version
            </button>
          </p>
        )}
        <ol className="timeline mt-12">
          {CHAPTERS.slice(0, FINALE_INDEX).map((c, i) => {
            const agent = AGENT_BY_KEY[c.agent];
            return (
              <li key={c.id} id={`story-${c.id}`} className="timeline__item">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: agent.color }}>
                  Chapter {i + 1} · {c.period}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{c.title}</h2>
                <p className="text-sm text-slate-400">{c.role}</p>
                <p className="mt-3 text-slate-300">{c.narration}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {c.metrics.map((m) => (
                    <div key={m.label} className="journey-metric">
                      <div className="text-lg font-semibold text-white">{m.value}</div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</div>
                    </div>
                  ))}
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {c.inspect.map((item) => (
                    <li key={item.label} className="flex gap-2">
                      <span className="tick">▸</span>
                      <span>
                        <strong className="text-white">{item.label}:</strong> {item.text}{" "}
                        {item.link && (
                          <a className="text-sky-300 hover:underline" href={item.link} target="_blank" rel="noreferrer">
                            Code ↗
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {c.tech.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.tech.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    [c.agent, c.question],
                    [c.agent2, c.question2],
                  ]
                    .filter(([a]) => a)
                    .map(([a, q]) => (
                      <button key={a} className="ask" style={{ "--accent": AGENT_BY_KEY[a].color }} onClick={() => onAsk(a, q)}>
                        <span className="ask__dot" />
                        Ask {AGENT_BY_KEY[a].name}: “{q}”
                      </button>
                    ))}
                </div>
              </li>
            );
          })}
        </ol>
        <section className="card mt-16">
          <p className="eyebrow">Finale</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{profile.title}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {profile.metrics.map((m) => (
              <div key={m.label} className="journey-metric">
                <div className="text-xl font-semibold text-white">{m.value}</div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn-primary" href={`mailto:${profile.contact.email}`}>
              Email Mayank
            </a>
            <a className="btn-ghost" href={profile.contact.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <a className="btn-ghost" href={profile.contact.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
