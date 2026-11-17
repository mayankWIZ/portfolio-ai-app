// "Journey" mode: a full-screen, playable walk through Mayank's career.
// This module is lazy-loaded from App; the three.js scene is a further lazy chunk.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgentChat from "../components/AgentChat";
import { CHAPTERS, FINALE_INDEX } from "./chapters";
import { Coach, HowTo } from "./Guidance";
import { ChapterPanel, Finale, Joystick, Legend, Tracker } from "./Hud";
import { PolicyGame, RUSH_TIME, RushHud, RushResult } from "./MiniGames";
import { COMMITS, rushTargets } from "./world";
import { hotspots, input, keyAction } from "./store";
import Story2D from "./Story2D";

const JourneyScene = lazy(() => import("./JourneyScene"));

const STORAGE = "journey-progress-v1";
const COACH_KEY = "journey-coach-v1";
const GAMES_KEY = "journey-games-v1";

function loadGames() {
  try {
    const g = JSON.parse(localStorage.getItem(GAMES_KEY) || "{}");
    return { commits: new Set(g.commits || []), rushBest: g.rushBest ?? null, policyBest: g.policyBest ?? null };
  } catch {
    return { commits: new Set(), rushBest: null, policyBest: null };
  }
}

function coachStart() {
  try {
    return localStorage.getItem(COACH_KEY) === "done" ? "done" : "move";
  } catch {
    return "move";
  }
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    return { visited: new Set(raw.visited || []), revealed: new Set(raw.revealed || []) };
  } catch {
    return { visited: new Set(), revealed: new Set() };
  }
}

function saveProgress(visited, revealed) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({ visited: [...visited], revealed: [...revealed] }));
  } catch {
    /* storage unavailable: progress lives for this visit only */
  }
}

const isTyping = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

export default function Journey({ webgl, reducedMotion, onExit }) {
  const touch = useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);
  const [mode, setMode] = useState(webgl && !reducedMotion ? "3d" : "2d");
  const [quality, setQuality] = useState(() => (touch || (navigator.hardwareConcurrency || 8) <= 4 ? "low" : "high"));
  const initial = useMemo(loadProgress, []);
  const [visited, setVisited] = useState(initial.visited);
  const [revealed, setRevealed] = useState(initial.revealed);
  const [lastRevealed, setLastRevealed] = useState(null);
  const [zone, setZone] = useState(null);
  const [near, setNear] = useState(null);
  const [toggles, setToggles] = useState({});
  const [autopilot, setAutopilot] = useState(false);
  const [teleport, setTeleport] = useState(null);
  const [cinematic, setCinematic] = useState(null);
  const [chat, setChat] = useState(null);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [intro, setIntro] = useState(true);
  const [coach, setCoachState] = useState(coachStart);
  const coachRef = useRef(coach);
  coachRef.current = coach;
  const setCoach = useCallback((step) => {
    setCoachState(step);
    if (step === "done") {
      try {
        localStorage.setItem(COACH_KEY, "done");
      } catch {
        /* ignore */
      }
    }
  }, []);
  const [ready, setReady] = useState(false);
  const initialGames = useMemo(loadGames, []);
  const [commits, setCommits] = useState(initialGames.commits);
  const [best, setBest] = useState({ rush: initialGames.rushBest, policy: initialGames.policyBest });
  const [rush, setRush] = useState({ status: "idle", items: [], taken: new Set(), got: 0, start: 0, time: 0 });
  const [policyOpen, setPolicyOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const visitedRef = useRef(visited);
  visitedRef.current = visited;
  const autopilotRef = useRef(autopilot);
  autopilotRef.current = autopilot;
  const rootRef = useRef();
  const zoneRef = useRef(null);

  useEffect(() => saveProgress(visited, revealed), [visited, revealed]);
  useEffect(() => {
    try {
      localStorage.setItem(GAMES_KEY, JSON.stringify({ commits: [...commits], rushBest: best.rush, policyBest: best.policy }));
    } catch {
      /* ignore */
    }
  }, [commits, best]);

  /* ---------------------------------------------------------------- mini-games */

  const flash = useCallback((text) => {
    setToast({ text, at: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  const startRush = useCallback(() => {
    const crest = CHAPTERS.findIndex((c) => c.game === "rush");
    setAutopilot(false);
    setCollapsed(true);
    setRush({ status: "playing", items: rushTargets(crest), taken: new Set(), got: 0, start: performance.now(), time: 0 });
  }, []);

  const onPickup = useCallback(
    (id) => {
      if (id.startsWith("c")) {
        setCommits((c) => {
          const n = new Set(c).add(id);
          flash(n.size === COMMITS.length ? `✦ All ${COMMITS.length} commits collected!` : `+1 commit ✦ ${n.size}/${COMMITS.length}`);
          return n;
        });
      } else if (id.startsWith("r")) {
        setRush((r) => {
          if (r.status !== "playing" || r.taken.has(id)) return r;
          const taken = new Set(r.taken).add(id);
          const got = taken.size;
          if (got === r.items.length) {
            const time = (performance.now() - r.start) / 1000;
            setBest((b) => ({ ...b, rush: b.rush == null ? time : Math.min(b.rush, time) }));
            return { ...r, taken, got, status: "done", time };
          }
          return { ...r, taken, got };
        });
      }
    },
    [flash]
  );

  useEffect(() => {
    if (rush.status !== "playing") return;
    const left = RUSH_TIME * 1000 - (performance.now() - rush.start);
    const id = setTimeout(() => setRush((r) => (r.status === "playing" ? { ...r, status: "done", time: RUSH_TIME } : r)), Math.max(0, left));
    return () => clearTimeout(id);
  }, [rush.status, rush.start]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      input.keys.clear();
    };
  }, []);

  /* ---------------------------------------------------------------- actions */

  const reveal = useCallback((key) => {
    setRevealed((r) => (r.has(key) ? r : new Set(r).add(key)));
    setLastRevealed(key);
    setCollapsed(false);
    if (coachRef.current === "inspect") setCoach("ask");
  }, [setCoach]);

  const jump = useCallback((index) => {
    setFinaleOpen(false);
    setIntro(false);
    setTeleport({ index, at: Date.now() });
    if (!reducedMotion) setCinematic({ index, at: Date.now() });
  }, [reducedMotion]);

  const ask = useCallback((agent, text) => {
    setAutopilot(false);
    if (coachRef.current !== "done") setCoach("done");
    setChat({ agent, pending: { agent, text, at: Date.now() } });
  }, []);

  const onZone = useCallback(
    (i) => {
      setZone(i);
      setNear(null);
      if (i == null) return;
      // Phones: start with just the chapter title so the scene (and its ◆) stays visible.
      setCollapsed(window.innerWidth < 768);
      if (coachRef.current === "move" || coachRef.current === "follow") setCoach("inspect");
      else if (coachRef.current === "ask" && i !== zoneRef.current) setCoach("done");
      zoneRef.current = i;
      if (!visitedRef.current.has(i)) {
        setVisited((v) => new Set(v).add(i));
        if (!reducedMotion && !autopilotRef.current) setCinematic({ index: i, at: Date.now() });
      }
      if (i === FINALE_INDEX) setTimeout(() => setFinaleOpen(true), autopilotRef.current ? 2500 : 1600);
    },
    [reducedMotion, setCoach]
  );

  const restart = useCallback(() => {
    setVisited(new Set());
    setRevealed(new Set());
    setToggles({});
    jump(0);
  }, [jump]);

  const startTour = useCallback(() => {
    setIntro(false);
    setFinaleOpen(false);
    setAutopilot((a) => !a);
  }, []);

  /* ---------------------------------------------------------------- keyboard */

  const stateRef = useRef();
  stateRef.current = { near, chat, finaleOpen, intro, policyOpen };
  useEffect(() => {
    if (mode !== "3d") return;
    const down = (e) => {
      if (isTyping(e.target)) return;
      const s = stateRef.current;
      if (e.code === "Escape") {
        if (s.chat) setChat(null);
        else if (s.finaleOpen) setFinaleOpen(false);
        else onExit();
        return;
      }
      if (s.finaleOpen || s.policyOpen) return;
      const act = keyAction(e.code);
      if (act) {
        if (e.target.tagName === "BUTTON" && e.code === "Enter") return;
        // Space always means jump in the world; drop focus from a clicked HUD button so it doesn't re-press it.
        if (e.code === "Space" && e.target.tagName === "BUTTON") e.target.blur();
        e.preventDefault();
        input.keys.add(act);
        if (s.intro && ["f", "b", "l", "r"].includes(act)) setIntro(false);
        return;
      }
      if (e.code === "KeyE" && s.near) {
        e.preventDefault();
        reveal(s.near);
      } else if (e.key === "?" || (e.code === "Slash" && e.shiftKey)) {
        setIntro(true);
      } else if (e.code === "KeyG") {
        startTour();
      } else if (/^Digit[0-9]$/.test(e.code) && !e.metaKey && !e.ctrlKey) {
        const n = Number(e.code.slice(5));
        jump(n === 0 ? 9 : n - 1);
      }
    };
    const up = (e) => {
      const act = keyAction(e.code);
      if (act) input.keys.delete(act);
    };
    const blur = () => input.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [mode, onExit, reveal, jump, startTour]);

  const firstUnvisited = CHAPTERS.findIndex((_, i) => !visited.has(i));
  const guideIndex = firstUnvisited === -1 ? FINALE_INDEX : firstUnvisited;
  const nearLabel = near ? hotspots.get(near)?.label : null;
  const nearDone = near ? revealed.has(near) : false;

  /* ---------------------------------------------------------------- render */

  const chatDock = chat && (
    <div className="journey-chat">
      <AgentChat
        key={chat.agent}
        agentKey={chat.agent}
        onSwitch={(k) => setChat({ agent: k, pending: null })}
        onClose={() => setChat(null)}
        pendingQuestion={chat.pending}
        onPendingConsumed={() => setChat((c) => (c ? { ...c, pending: null } : c))}
      />
    </div>
  );

  if (mode === "2d") {
    return (
      <div ref={rootRef} tabIndex={-1} className="journey-root outline-none" role="dialog" aria-modal="true" aria-label="Career journey">
        <div className="journey-topbar">
          <span className="font-semibold text-white">The Journey</span>
          <button className="btn-ghost !py-1.5" onClick={onExit}>
            ✕ Exit
          </button>
        </div>
        <Story2D
          onAsk={ask}
          onTry3D={webgl ? () => setMode("3d") : null}
          reason={
            reducedMotion
              ? "Showing the still version because your system asks for reduced motion."
              : webgl
                ? "You're reading the story version."
                : "Your browser doesn't support WebGL, so here's the story version."
          }
        />
        {chatDock}
      </div>
    );
  }

  return (
    <div ref={rootRef} tabIndex={-1} className="journey-root outline-none" role="dialog" aria-modal="true" aria-label="Career journey, an interactive 3D walk">
      <div className="absolute inset-0">
        <Suspense fallback={<div className="grid h-full place-items-center text-slate-400">Building the world…</div>}>
          <JourneyScene
            quality={quality}
            onReady={() => setTimeout(() => setReady(true), 150)}
            onPerfDrop={() => setQuality("low")}
            stations={{ active: zone, toggles, revealed, near, onInspect: reveal, onAsk: ask }}
            games={{ commits, rushItems: rush.status === "playing" ? rush.items : [], rushTaken: rush.taken }}
            player={{
              teleport,
              autopilot,
              cinematic,
              revealed,
              viewShift: zone != null && zone !== FINALE_INDEX && !intro && !collapsed,
              onZone,
              onNear: setNear,
              onAutoReveal: reveal,
              onAutopilotEnd: () => setAutopilot(false),
              onUserInput: () => setAutopilot(false),
              onPickup,
              onMoved: () => coachRef.current === "move" && setCoach("follow"),
              guide: autopilot || intro ? null : guideIndex,
            }}
          />
        </Suspense>
      </div>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-slate-950 text-slate-400" role="status">
          Building the world…
        </div>
      )}

      {/* top bar */}
      <div className="journey-topbar">
        <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <Tracker visited={visited} zone={zone} onJump={jump} />
          <span className="journey-chip" title="Gold commits collected along the road (jump for the high ones)" aria-label={`${commits.size} of ${COMMITS.length} commits collected`}>
            <span className="text-amber-300">✦</span> {commits.size}/{COMMITS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className={`journey-btn ${autopilot ? "journey-btn--on" : ""}`} onClick={startTour} aria-pressed={autopilot}>
            {autopilot ? "❚❚ Pause" : "▶"}<span className="ml-1 hidden sm:inline">{autopilot ? "tour" : "Guided tour"}</span><span className="ml-1 sm:hidden">{autopilot ? "" : "Tour"}</span>
          </button>
          <button className="journey-btn" onClick={() => setIntro(true)} aria-label="How to explore (controls)" title="How to explore">
            ?
          </button>
          <button className="journey-btn hidden sm:inline-flex" onClick={() => setFinaleOpen(true)}>
            Summary
          </button>
          <button className="journey-btn hidden md:inline-flex" onClick={() => setMode("2d")} title="Read the same story as a scrolling timeline">
            Story view
          </button>
          <button
            className="journey-btn"
            onClick={() => setQuality((q) => (q === "high" ? "low" : "high"))}
            aria-label={`Graphics quality: ${quality}. Switch to ${quality === "high" ? "low" : "high"}`}
            title="Graphics quality"
          >
            {quality === "high" ? "HQ" : "LQ"}
          </button>
          <button className="journey-btn" onClick={onExit} aria-label="Exit the journey">
            ✕<span className="ml-1 hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {zone != null && zone !== FINALE_INDEX && !intro && (
        <ChapterPanel
          index={zone}
          revealed={revealed}
          lastRevealed={lastRevealed}
          toggles={toggles}
          onToggle={(id, v) => setToggles((t) => ({ ...t, [id]: v }))}
          onReveal={reveal}
          onAsk={ask}
          onJump={jump}
          onPlay={(g) => (g === "rush" ? startRush() : (setAutopilot(false), setPolicyOpen(true)))}
          best={best}
          reduced={reducedMotion}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((c) => !c)}
        />
      )}

      {!intro && !finaleOpen && !autopilot && !chat && coach !== "done" && (
        <Coach step={coach} touch={touch} next={guideIndex} zone={zone} onDismiss={() => setCoach("done")} />
      )}

      {zone == null && !intro && !finaleOpen && (coach === "done" || autopilot) && (
        <div className="journey-hint" aria-live="polite">
          {(() => {
            const next = CHAPTERS.findIndex((_, i) => !visited.has(i));
            return next === -1 ? "Every stop visited. Follow the arrow to the finale." : `Follow the gold arrow ➜ Next stop ${next + 1}: ${CHAPTERS[next].short}`;
          })()}
        </div>
      )}

      {near && !finaleOpen && touch && (
        <button className="journey-inspect-btn" onClick={() => reveal(near)} aria-label={`Inspect ${nearLabel}`}>
          ◆<br />
          {nearDone ? "Seen" : "Inspect"}
        </button>
      )}
      {near && !finaleOpen && (
        <button className="journey-prompt" onClick={() => reveal(near)}>
          {touch ? "Tap to inspect" : <><kbd>E</kbd> Inspect</>}: <strong>{nearLabel}</strong>
          {nearDone && <span className="ml-1 text-emerald-300">(seen)</span>}
        </button>
      )}

      {intro && (
        <HowTo
          touch={touch}
          returning={ready && visited.size > 0}
          onStart={() => setIntro(false)}
          onTour={() => {
            setIntro(false);
            setAutopilot(true);
          }}
        />
      )}

      {rush.status === "playing" && <RushHud rush={rush} onQuit={() => setRush((r) => ({ ...r, status: "idle", items: [] }))} />}
      {rush.status === "done" && (
        <RushResult rush={rush} best={best.rush} onAgain={startRush} onClose={() => setRush((r) => ({ ...r, status: "idle", items: [] }))} />
      )}
      {toast && (
        <div key={toast.at} className="journey-toast" role="status">
          {toast.text}
        </div>
      )}
      {touch && (
        <button
          className="journey-jump-btn"
          aria-label="Jump"
          onPointerDown={() => input.keys.add("jump")}
          onPointerUp={() => input.keys.delete("jump")}
          onPointerCancel={() => input.keys.delete("jump")}
          onPointerLeave={() => input.keys.delete("jump")}
        >
          ⤒<span className="block text-[10px]">Jump</span>
        </button>
      )}
      {policyOpen && (
        <PolicyGame
          best={best.policy}
          onDone={(score) => setBest((b) => ({ ...b, policy: Math.max(b.policy ?? 0, score) }))}
          onClose={() => setPolicyOpen(false)}
        />
      )}

      <Legend touch={touch} defaultOpen={!touch && coach === "done"} />
      {touch && <Joystick />}
      {chatDock}

      {finaleOpen && (
        <Finale
          games={{ commits: commits.size, totalCommits: COMMITS.length, rushBest: best.rush, policyBest: best.policy }}
          visited={visited}
          revealed={revealed}
          onJump={jump}
          onClose={() => setFinaleOpen(false)}
          onAsk={(a, q) => {
            setFinaleOpen(false);
            ask(a, q);
          }}
          onRestart={restart}
          onExit={onExit}
        />
      )}
    </div>
  );
}
