// "Journey" mode: a full-screen, playable walk through Mayank's career.
// This module is lazy-loaded from App; the three.js scene is a further lazy chunk.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgentChat from "../components/AgentChat";
import { CHAPTERS, FINALE_INDEX } from "./chapters";
import { ChapterPanel, Finale, Joystick, Legend, Tracker } from "./Hud";
import { hotspots, input, keyAction } from "./store";
import Story2D from "./Story2D";

const JourneyScene = lazy(() => import("./JourneyScene"));

const STORAGE = "journey-progress-v1";

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
  const [ready, setReady] = useState(false);
  const visitedRef = useRef(visited);
  visitedRef.current = visited;
  const autopilotRef = useRef(autopilot);
  autopilotRef.current = autopilot;
  const rootRef = useRef();

  useEffect(() => saveProgress(visited, revealed), [visited, revealed]);

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
  }, []);

  const jump = useCallback((index) => {
    setFinaleOpen(false);
    setIntro(false);
    setTeleport({ index, at: Date.now() });
    if (!reducedMotion) setCinematic({ index, at: Date.now() });
  }, [reducedMotion]);

  const ask = useCallback((agent, text) => {
    setAutopilot(false);
    setChat({ agent, pending: { agent, text, at: Date.now() } });
  }, []);

  const onZone = useCallback(
    (i) => {
      setZone(i);
      setNear(null);
      if (i == null) return;
      setCollapsed(false);
      if (!visitedRef.current.has(i)) {
        setVisited((v) => new Set(v).add(i));
        if (!reducedMotion && !autopilotRef.current) setCinematic({ index: i, at: Date.now() });
      }
      if (i === FINALE_INDEX) setTimeout(() => setFinaleOpen(true), autopilotRef.current ? 2500 : 1600);
    },
    [reducedMotion]
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
  stateRef.current = { near, chat, finaleOpen, intro };
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
      if (s.finaleOpen) return;
      const act = keyAction(e.code);
      if (act) {
        if (e.target.tagName === "BUTTON" && (e.code === "Space" || e.code === "Enter")) return;
        e.preventDefault();
        input.keys.add(act);
        if (s.intro && ["f", "b", "l", "r"].includes(act)) setIntro(false);
        return;
      }
      if (e.code === "KeyE" && s.near) {
        e.preventDefault();
        reveal(s.near);
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
        <Tracker visited={visited} zone={zone} onJump={jump} />
        <div className="flex items-center gap-2">
          <button className={`journey-btn ${autopilot ? "journey-btn--on" : ""}`} onClick={startTour} aria-pressed={autopilot}>
            {autopilot ? "❚❚ Pause" : "▶"}<span className="ml-1 hidden sm:inline">{autopilot ? "tour" : "Guided tour"}</span><span className="ml-1 sm:hidden">{autopilot ? "" : "Tour"}</span>
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
          reduced={reducedMotion}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((c) => !c)}
        />
      )}

      {zone == null && !intro && !finaleOpen && (
        <div className="journey-hint" aria-live="polite">
          {(() => {
            const next = CHAPTERS.findIndex((_, i) => !visited.has(i));
            return next === -1 ? "Every chapter visited. Head to the end of the road for the finale." : `Follow the road. Next: ${next + 1}. ${CHAPTERS[next].short}`;
          })()}
        </div>
      )}

      {near && !finaleOpen && (
        <button className="journey-prompt" onClick={() => reveal(near)}>
          {touch ? "Tap to inspect" : <><kbd>E</kbd> Inspect</>}: <strong>{nearLabel}</strong>
          {nearDone && <span className="ml-1 text-emerald-300">(seen)</span>}
        </button>
      )}

      {intro && (
        <div className="journey-intro">
          <p className="eyebrow">The Journey</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Walk through 7+ years in ten chapters</h2>
          <p className="mt-3 text-slate-300">
            Follow the road from university to today. Each station tells one chapter: walk into it, inspect the glowing ◆ objects, and ask the agent standing there anything.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => setIntro(false)} autoFocus>
              Start walking
            </button>
            <button className="btn-ghost" onClick={startTour}>
              ▶ Take the guided tour
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-400">{touch ? "Use the joystick to walk and drag to look around." : "WASD or arrow keys to walk, drag to look, E to inspect, G for the tour."}</p>
        </div>
      )}

      <Legend touch={touch} />
      {touch && <Joystick />}
      {chatDock}

      {finaleOpen && (
        <Finale
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
