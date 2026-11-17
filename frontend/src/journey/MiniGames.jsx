// DOM side of the mini-games: the Event Rush HUD and the Policy Gate card game.
import { useCallback, useEffect, useRef, useState } from "react";

export const RUSH_TIME = 30;

export function RushHud({ rush, onQuit }) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (rush.status !== "playing") return;
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, [rush.status]);
  const left = Math.max(0, RUSH_TIME - (now - rush.start) / 1000);
  const pct = (rush.got / rush.items.length) * 100;
  return (
    <div className="game-hud" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm text-white">⚡ Event Rush</strong>
        <span className={`tabular-nums text-lg font-semibold ${left < 8 ? "text-rose-300" : "text-white"}`}>{left.toFixed(1)}s</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-300">
        <span>
          {rush.got}/{rush.items.length} events routed · jump for the high ones
        </span>
        <button className="text-slate-400 hover:text-white" onClick={onQuit}>
          Quit
        </button>
      </div>
    </div>
  );
}

export function RushResult({ rush, best, onAgain, onClose }) {
  const won = rush.got === rush.items.length;
  return (
    <div className="game-hud" role="status">
      <strong className="text-white">{won ? `⚡ All events routed in ${rush.time.toFixed(1)}s!` : `⏱ Time! ${rush.got}/${rush.items.length} events routed`}</strong>
      <p className="mt-1 text-xs text-slate-300">
        {won ? "That pipeline would keep up with 300K+ events/min." : "Queues back up fast. Try again and use Shift (or push the joystick far) to run."}
        {best != null && ` Best: ${best.toFixed(1)}s.`}
      </p>
      <div className="mt-2 flex gap-2">
        <button className="btn-primary !px-3 !py-1 text-xs" onClick={onAgain}>
          Play again
        </button>
        <button className="btn-ghost !px-3 !py-1 text-xs" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// Illustrative requests for the game (not real data): would a governance gateway let them through?
const CARDS = [
  { text: "Generate unit tests for utils/date_parser.py", allow: true, why: "Routine code help with no sensitive data. Allowed." },
  { text: "Our prod DB password is hunter2, fix the connection string", allow: false, why: "Contains a secret. The gateway redacts or blocks credentials before they reach a model." },
  { text: "Refactor this React component to use hooks", allow: true, why: "Normal refactoring request. Allowed." },
  { text: "Summarise this CSV of customer names, emails and phone numbers", allow: false, why: "Personal data (PII). Blocked unless policy allows that dataset." },
  { text: "Explain this Python stack trace", allow: true, why: "Debugging help with nothing sensitive. Allowed." },
  { text: "Paste this GPL library into our closed-source repo", allow: false, why: "Licence conflict. Release rules in the context layer flag it." },
  { text: "Write a migration for the orders table following our release rules", allow: true, why: "Allowed, and the context layer adds the org's release rules to the prompt." },
  { text: "Disable the auth checks so the demo works", allow: false, why: "Weakens security controls. Policy blocks it." },
];

export function PolicyGame({ best, onDone, onClose }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState(null);
  const finished = i >= CARDS.length;
  const closeRef = useRef();

  const answer = useCallback(
    (allow) => {
      if (finished || last) return;
      const c = CARDS[i];
      const ok = c.allow === allow;
      setScore((s) => s + (ok ? 1 : 0));
      setLast({ ok, why: c.why });
    },
    [i, finished, last]
  );
  const next = useCallback(() => {
    setLast(null);
    if (i + 1 >= CARDS.length) onDone(score);
    setI(i + 1);
  }, [onDone, score, i]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  useEffect(() => {
    const key = (e) => {
      if (e.code === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (!last && (e.code === "ArrowLeft" || e.code === "KeyA")) answer(true);
      else if (!last && (e.code === "ArrowRight" || e.code === "KeyB" || e.code === "KeyD")) answer(false);
      else if (last && (e.code === "Enter" || e.code === "Space")) {
        e.preventDefault();
        next();
      } else return;
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [answer, next, last, onClose]);

  return (
    <div className="journey-finale" role="dialog" aria-modal="true" aria-labelledby="policy-title">
      <div className="journey-finale__card max-w-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow" style={{ color: "#f472b6" }}>
              Mini-game · CognitivTrust
            </p>
            <h2 id="policy-title" className="mt-1 text-2xl font-semibold text-white">
              Be the policy gate
            </h2>
          </div>
          <button ref={closeRef} className="journey-icon-btn" onClick={onClose} aria-label="Close game">
            ✕
          </button>
        </div>
        {!finished ? (
          <>
            <p className="mt-2 text-sm text-slate-300">
              A developer's IDE sends this to an AI model. Allow it, or block it? <span className="text-slate-500">({i + 1}/{CARDS.length})</span>
            </p>
            <div className="mt-4 rounded-xl border border-white/15 bg-slate-900 p-4 font-mono text-[15px] text-slate-100">“{CARDS[i].text}”</div>
            {last ? (
              <div className={`mt-3 rounded-lg p-3 text-sm ${last.ok ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100"}`}>
                <strong>{last.ok ? "Correct. " : "Not quite. "}</strong>
                {last.why}
                <div className="mt-2">
                  <button className="btn-primary !px-3 !py-1 text-xs" onClick={next}>
                    {i + 1 < CARDS.length ? "Next request →" : "See score"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="rounded-xl bg-emerald-400 py-3 text-base font-semibold text-slate-950 hover:brightness-110" onClick={() => answer(true)}>
                  ✓ Allow <span className="hidden text-xs opacity-70 sm:inline">(←)</span>
                </button>
                <button className="rounded-xl bg-rose-400 py-3 text-base font-semibold text-slate-950 hover:brightness-110" onClick={() => answer(false)}>
                  ⛔ Block <span className="hidden text-xs opacity-70 sm:inline">(→)</span>
                </button>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">Score: {score}</p>
          </>
        ) : (
          <div className="mt-4">
            <p className="text-3xl font-semibold text-white">
              {score}/{CARDS.length}
            </p>
            <p className="mt-1 text-slate-300">
              {score === CARDS.length
                ? "Perfect. That's real-time policy enforcement."
                : score >= 6
                  ? "Solid gatekeeping. Mayank's gateway does this on every IDE request."
                  : "Tricky, right? That's why the gateway enforces policy automatically."}
              {best != null && ` Best: ${Math.max(best, score)}/${CARDS.length}.`}
            </p>
            <button className="btn-primary mt-4" onClick={onClose}>
              Back to the journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
