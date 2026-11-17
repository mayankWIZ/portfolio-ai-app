// Onboarding for the Journey: a how-to-play card and step-by-step coach tips.
import { useEffect, useRef } from "react";
import { Key } from "../components/ExploreCard";
import { AGENT_BY_KEY } from "../data/agents";
import { CHAPTERS } from "./chapters";

function Wasd() {
  return (
    <span className="wasd" aria-hidden="true">
      <span />
      <Key>W</Key>
      <span />
      <Key>A</Key>
      <Key>S</Key>
      <Key>D</Key>
    </span>
  );
}

function Step({ visual, title, children }) {
  return (
    <li className="howto__step">
      <span className="howto__visual">{visual}</span>
      <span>
        <strong className="block text-sm text-white">{title}</strong>
        <span className="text-[13px] leading-snug text-slate-300">{children}</span>
      </span>
    </li>
  );
}

export function HowTo({ touch, onStart, onTour, returning }) {
  const startRef = useRef();
  useEffect(() => startRef.current?.focus({ preventScroll: true }), []);
  return (
    <div className="howto" role="dialog" aria-modal="true" aria-labelledby="howto-title">
      <p className="eyebrow">How to explore</p>
      <h2 id="howto-title" className="mt-1 text-xl font-semibold leading-tight text-white sm:mt-2 sm:text-3xl">
        Walk through Mayank's career, one stop at a time
      </h2>
      <p className="mt-2 hidden text-sm text-slate-300 sm:block sm:text-base">
        One road, {CHAPTERS.length} stops, 2017 → today. Walk up to a stop to open its chapter, then keep following the road to the finale.
      </p>
      <ul className="howto__grid">
        {touch ? (
          <>
            <Step visual={<span className="text-2xl">◎</span>} title="Walk">
              Joystick, bottom-left. Push far to run, tap ⤒ to jump.
            </Step>
            <Step visual={<span className="text-2xl">☝</span>} title="Look around">
              Drag anywhere with one finger.
            </Step>
          </>
        ) : (
          <>
            <Step visual={<Wasd />} title="Walk">
              <Key>W</Key> <Key>A</Key> <Key>S</Key> <Key>D</Key> or arrows. <Key wide>Shift</Key> run, <Key wide>Space</Key> jump.
            </Step>
            <Step visual={<span className="text-2xl">🖱</span>} title="Look around">
              Drag with the mouse (or <Key>Z</Key> <Key>X</Key>). Scroll to zoom.
            </Step>
          </>
        )}
        <Step visual={<span className="text-2xl text-amber-300">➜</span>} title="Follow the gold arrow">
          {touch ? "It points to the next stop. Dots up top jump anywhere." : "The arrow at your feet and the light beam point to the next stop. The numbered dots at the top jump anywhere."}
        </Step>
        <Step visual={<span className="text-2xl text-sky-300">◆</span>} title="Discover & ask">
          {touch ? (
            "Tap a glowing ◆ to reveal a highlight, then ask the agent."
          ) : (
            <>
              Walk up and press <Key>E</Key>, or click a glowing ◆ to reveal a highlight. Each stop has an agent you can ask.
            </>
          )}
        </Step>
      </ul>
      <p className="mt-3 rounded-lg bg-amber-300/10 px-3 py-2 text-xs text-amber-100 sm:text-sm">
        🎮 Grab the gold <strong>✦ commits</strong> along the road (jump for the high ones), and play the mini-games at <strong>Crest Data</strong> and <strong>CognitivTrust</strong>.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        <button className="btn-primary justify-center !py-2.5" onClick={onStart} ref={startRef}>
          {returning ? "Back to exploring" : "Start exploring"}
        </button>
        <button className="btn-ghost justify-center !py-2.5" onClick={onTour}>
          ▶ Watch the guided tour instead
        </button>
      </div>
      {!touch && (
        <p className="mt-4 text-xs text-slate-400">
          Shortcuts: <Key>1</Key>–<Key>0</Key> jump to a stop · <Key>G</Key> guided tour · <Key>?</Key> this guide · <Key wide>Esc</Key> exit
        </p>
      )}
    </div>
  );
}

/** One tip at a time, advancing as the visitor learns each action. */
export function Coach({ step, touch, next, zone, onDismiss }) {
  let body = null;
  if (step === "move")
    body = touch ? (
      <>Drag the <strong>joystick</strong> (bottom-left) to start walking.</>
    ) : (
      <>
        Press <Key>W</Key> or <Key>↑</Key> to start walking. Drag the mouse to look around.
      </>
    );
  else if (step === "follow")
    body = (
      <>
        Follow the <strong className="text-amber-300">gold arrow ➜</strong> to stop {next + 1}: <strong>{CHAPTERS[next].short}</strong>.
      </>
    );
  else if (step === "inspect")
    body = touch ? (
      <>You're at a stop. Walk to a glowing <strong>◆</strong> and tap it to reveal a highlight.</>
    ) : (
      <>
        You're at a stop. Walk to a glowing <strong>◆</strong> and press <Key>E</Key> (or click it).
      </>
    );
  else if (step === "ask" && zone != null)
    body = (
      <>
        Nice! Ask <strong>{AGENT_BY_KEY[CHAPTERS[zone].agent].name}</strong> anything from the panel, or keep walking to the next stop.
      </>
    );
  if (!body) return null;
  const n = { move: 1, follow: 2, inspect: 3, ask: 4 }[step];
  return (
    <div className="coach" role="status" aria-live="polite">
      <span className="coach__step" aria-label={`Tip ${n} of 4`}>
        {n}
      </span>
      <span className="flex-1 leading-snug">{body}</span>
      <button className="shrink-0 text-xs text-slate-400 hover:text-white" onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}
