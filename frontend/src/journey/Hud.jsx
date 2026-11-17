// DOM overlays for the Journey: chapter panel, tracker, legend, joystick, finale summary.
import { useEffect, useRef, useState } from "react";
import { AGENT_BY_KEY } from "../data/agents";
import profile from "../data/profile.json";
import { CHAPTERS, FINALE_INDEX, parseMetric } from "./chapters";
import { hotspotKey, input } from "./store";

/* ------------------------------------------------------------------ small pieces */

export function CountUp({ value, reduced }) {
  const parsed = parseMetric(value);
  const [shown, setShown] = useState(reduced || !parsed ? value : `${parsed.prefix}0${parsed.suffix}`);
  useEffect(() => {
    if (reduced || !parsed) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / 1300);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(`${parsed.prefix}${(parsed.n * e).toFixed(parsed.decimals)}${parsed.suffix}`);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);
  return <span className="tabular-nums">{shown}</span>;
}

function Typewriter({ text, reduced }) {
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(Math.min(i, text.length));
      if (i >= text.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [text, reduced]);
  return (
    <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
      <span aria-hidden="true">{text.slice(0, n)}</span>
      <span className="sr-only">{text}</span>
      {n < text.length && <span className="journey-caret" aria-hidden="true" />}
    </p>
  );
}

function AskAgent({ agentKey, question, onAsk }) {
  const a = AGENT_BY_KEY[agentKey];
  return (
    <button className="ask" style={{ "--accent": a.color }} onClick={() => onAsk(agentKey, question)}>
      <span className="ask__dot" />
      Ask {a.name}: “{question}”
    </button>
  );
}

/* ------------------------------------------------------------------ chapter panel */

export function ChapterPanel({ index, revealed, lastRevealed, toggles, onToggle, onReveal, onAsk, onJump, onPlay, best, reduced, collapsed, onCollapse }) {
  const c = CHAPTERS[index];
  const agent = AGENT_BY_KEY[c.agent];
  const found = c.inspect.filter((_, i) => revealed.has(hotspotKey(index, i))).length;
  const root = useRef();
  useEffect(() => {
    root.current?.querySelector(".journey-find--new")?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [lastRevealed, reduced]);
  return (
    <section ref={root} className={`journey-panel ${collapsed ? "journey-panel--collapsed" : ""}`} style={{ "--accent": agent.color }} aria-live="polite" aria-label={`Chapter ${index + 1}: ${c.title}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow" style={{ color: agent.color }}>
            Chapter {index + 1} / {CHAPTERS.length} · {c.period}
          </p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight text-white">{c.title}</h2>
          <p className="text-sm text-slate-400">{c.role}</p>
          {collapsed && (
            <button className="mt-1 text-xs font-medium text-sky-300" onClick={onCollapse}>
              Read the chapter · {found}/{c.inspect.length} found ▾
            </button>
          )}
        </div>
        <button className="journey-icon-btn md:hidden" onClick={onCollapse} aria-expanded={!collapsed} aria-label={collapsed ? "Expand chapter" : "Collapse chapter"}>
          {collapsed ? "▾" : "▴"}
        </button>
      </div>
      {!collapsed && (
        <div className="journey-panel__body">
          <Typewriter key={c.id} text={c.narration} reduced={reduced} />

          {c.metrics.length > 0 && index !== FINALE_INDEX && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {c.metrics.map((m) => (
                <div key={m.label} className="journey-metric">
                  <div className="text-xl font-semibold text-white">
                    <CountUp key={`${c.id}${m.value}`} value={m.value} reduced={reduced} />
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>
          )}

          {c.toggle && (
            <label className="journey-toggle mt-4">
              <input type="checkbox" checked={!!toggles[c.id]} onChange={(e) => onToggle(c.id, e.target.checked)} />
              <span className="journey-toggle__track" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-white">{c.toggle.label}</span>
                <span className="block text-xs text-slate-400">{toggles[c.id] ? c.toggle.on : c.toggle.off}</span>
              </span>
            </label>
          )}

          {c.game && (
            <div className="journey-gamecard mt-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">🎮 Mini-game</p>
                <p className="text-sm font-medium text-white">{c.game === "rush" ? "Event Rush: route 15 events in 30 s" : "Be the policy gate: allow or block 8 AI requests"}</p>
                <p className="text-xs text-slate-400">
                  {c.game === "rush"
                    ? best?.rush != null
                      ? `Best: ${best.rush.toFixed(1)}s`
                      : "Run and jump to grab the glowing packets."
                    : best?.policy != null
                      ? `Best: ${best.policy}/8`
                      : "Decide like the governance gateway would."}
                </p>
              </div>
              <button className="btn-primary shrink-0 !px-3 !py-1.5 text-xs" onClick={() => onPlay(c.game)}>
                Play
              </button>
            </div>
          )}

          {c.inspect.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Discoveries {found}/{c.inspect.length}
              </p>
              <ul className="mt-2 space-y-2">
                {c.inspect.map((item, i) => {
                  const key = hotspotKey(index, i);
                  const open = revealed.has(key);
                  return (
                    <li key={key} className={`journey-find ${open ? "journey-find--open" : ""} ${lastRevealed === key ? "journey-find--new" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">
                          <span aria-hidden="true">{open ? "◆ " : "◇ "}</span>
                          {item.label}
                        </span>
                        {!open && (
                          <button className="text-xs text-slate-300 underline-offset-2 hover:text-white hover:underline" onClick={() => onReveal(key)}>
                            Reveal
                          </button>
                        )}
                      </div>
                      {open && (
                        <p className="mt-1 text-sm text-slate-300">
                          {item.text}{" "}
                          {item.link && (
                            <a className="text-sky-300 underline-offset-2 hover:underline" href={item.link} target="_blank" rel="noreferrer">
                              Code ↗
                            </a>
                          )}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              {found < c.inspect.length && <p className="mt-2 text-xs text-slate-500">Walk up to a glowing ◆ and press E (or tap it) to inspect.</p>}
            </div>
          )}

          {c.tech.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.tech.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <AskAgent agentKey={c.agent} question={c.question} onAsk={onAsk} />
            {c.agent2 && <AskAgent agentKey={c.agent2} question={c.question2} onAsk={onAsk} />}
          </div>
          <div className="mt-4 flex gap-2">
            {index > 0 && (
              <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => onJump(index - 1)}>
                ← {CHAPTERS[index - 1].short}
              </button>
            )}
            {index < FINALE_INDEX && (
              <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => onJump(index + 1)}>
                Next: {CHAPTERS[index + 1].short} →
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ tracker */

export function Tracker({ visited, zone, onJump }) {
  return (
    <nav className="journey-tracker" aria-label="Chapters">
      <ol className="flex items-center gap-1">
        {CHAPTERS.map((c, i) => {
          const done = visited.has(i);
          const here = zone === i;
          return (
            <li key={c.id} className="flex items-center">
              {i > 0 && <span className={`journey-tracker__line ${visited.has(i - 1) && done ? "journey-tracker__line--on" : ""}`} aria-hidden="true" />}
              <button
                className={`journey-dot ${done ? "journey-dot--done" : ""} ${here ? "journey-dot--here" : ""}`}
                style={{ "--accent": AGENT_BY_KEY[c.agent].color }}
                onClick={() => onJump(i)}
                aria-label={`Chapter ${i + 1}: ${c.short}${done ? " (visited)" : " (not visited)"}${here ? ", you are here" : ""}`}
                aria-current={here ? "step" : undefined}
                title={`${i + 1}. ${c.short} · ${c.period}`}
              >
                {done ? "✓" : i + 1}
              </button>
            </li>
          );
        })}
      </ol>
      <span className="ml-3 hidden whitespace-nowrap text-xs text-slate-400 lg:inline">
        {visited.size}/{CHAPTERS.length} visited
      </span>
    </nav>
  );
}

/* ------------------------------------------------------------------ legend */

export function Legend({ touch, defaultOpen = !touch }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="journey-legend">
      <button className="journey-legend__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? "Hide controls" : "Controls"}
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {touch ? (
            <>
              <dt>Joystick</dt>
              <dd>walk (push far to run)</dd>
              <dt>Drag</dt>
              <dd>look around</dd>
              <dt>Tap ◆</dt>
              <dd>inspect an object</dd>
            </>
          ) : (
            <>
              <dt><kbd>W A S D</kbd> / <kbd>↑←↓→</kbd></dt>
              <dd>walk</dd>
              <dt><kbd>Shift</kbd></dt>
              <dd>run</dd>
              <dt>Drag · <kbd>Z</kbd> <kbd>X</kbd></dt>
              <dd>orbit camera</dd>
              <dt>Scroll</dt>
              <dd>zoom</dd>
              <dt><kbd>E</kbd> / click ◆</dt>
              <dd>inspect</dd>
              <dt><kbd>1</kbd>–<kbd>0</kbd></dt>
              <dd>jump to chapter</dd>
              <dt><kbd>G</kbd></dt>
              <dd>guided tour</dd>
              <dt><kbd>Esc</kbd></dt>
              <dd>close / exit</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ joystick */

export function Joystick() {
  const base = useRef();
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(null);
  const update = (e) => {
    const r = base.current.getBoundingClientRect();
    const R = r.width / 2;
    let dx = e.clientX - (r.left + R);
    let dy = e.clientY - (r.top + R);
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx = (dx / len) * R;
      dy = (dy / len) * R;
    }
    setKnob({ x: dx, y: dy });
    input.joy.x = dx / R;
    input.joy.y = -dy / R;
  };
  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    input.joy.x = 0;
    input.joy.y = 0;
  };
  useEffect(() => end, []);
  return (
    <div
      ref={base}
      className="journey-joystick"
      role="application"
      aria-label="Movement joystick"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* synthetic or already-released pointer */
        }
        update(e);
      }}
      onPointerMove={(e) => active.current === e.pointerId && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="journey-joystick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ finale */

export function Finale({ games, visited, revealed, onJump, onClose, onAsk, onRestart, onExit }) {
  const missing = CHAPTERS.map((c, i) => [c, i]).filter(([, i]) => !visited.has(i) && i !== FINALE_INDEX);
  const totalFinds = CHAPTERS.reduce((n, c) => n + c.inspect.length, 0);
  const closeRef = useRef();
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div className="journey-finale" role="dialog" aria-modal="true" aria-labelledby="finale-title">
      <div className="journey-finale__card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">The journey so far · {visited.size}/{CHAPTERS.length} chapters · {revealed.size}/{totalFinds} discoveries</p>
            <h2 id="finale-title" className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {profile.name}
            </h2>
            <p className="mt-1 text-slate-300">{profile.title}</p>
          </div>
          <button ref={closeRef} className="journey-icon-btn" onClick={onClose} aria-label="Close summary and keep exploring">
            ✕
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {profile.metrics.map((m) => (
            <div key={m.label} className="journey-metric">
              <div className="text-2xl font-semibold text-white">
                <CountUp value={m.value} />
              </div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</div>
            </div>
          ))}
        </div>

        {games && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="journey-chip">✦ Commits {games.commits}/{games.totalCommits}</span>
            <span className="journey-chip">⚡ Event Rush {games.rushBest != null ? `${games.rushBest.toFixed(1)}s` : "not played"}</span>
            <span className="journey-chip">⛔ Policy gate {games.policyBest != null ? `${games.policyBest}/8` : "not played"}</span>
          </div>
        )}

        {missing.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
            <p className="text-sm font-medium text-amber-100">You skipped {missing.length} chapter{missing.length > 1 ? "s" : ""}. Jump back so you've seen everything:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {missing.map(([c, i]) => (
                <button key={c.id} className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => onJump(i)}>
                  {i + 1}. {c.short} →
                </button>
              ))}
            </div>
          </div>
        )}

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-slate-400">Timeline</h3>
        <ol className="mt-3 space-y-2">
          {CHAPTERS.slice(0, FINALE_INDEX).map((c, i) => (
            <li key={c.id} className="flex items-baseline gap-3 text-sm">
              <span className={`w-5 shrink-0 text-center ${visited.has(i) ? "text-emerald-400" : "text-slate-600"}`} aria-label={visited.has(i) ? "visited" : "not visited"}>
                {visited.has(i) ? "✓" : "○"}
              </span>
              <button className="text-left text-slate-200 hover:text-white hover:underline" onClick={() => onJump(i)}>
                <strong className="text-white">{c.title}</strong> <span className="text-slate-400">· {c.role} · {c.period}</span>
              </button>
            </li>
          ))}
        </ol>

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
          <button className="ask" style={{ "--accent": AGENT_BY_KEY.career.color }} onClick={() => onAsk("career", "Why should we hire him?")}>
            <span className="ask__dot" />
            Ask Theo: why hire him?
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-4 text-sm">
          <button className="text-slate-400 hover:text-white" onClick={onRestart}>
            ↺ Walk it again from the start
          </button>
          <button className="text-slate-400 hover:text-white" onClick={onExit}>
            ← Back to the portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
