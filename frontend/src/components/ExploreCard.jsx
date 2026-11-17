// Hero entry point for the 3D career walk: an inviting button plus a tiny controls primer,
// so visitors know it's playable (and how) before they click.
import { useMemo } from "react";

export function Key({ children, wide }) {
  return <kbd className={`keycap ${wide ? "keycap--wide" : ""}`}>{children}</kbd>;
}

export default function ExploreCard({ onOpen }) {
  const touch = useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);
  return (
    <div className="explore-card">
      <button id="journey-cta" className="explore-card__btn" onClick={onOpen}>
        <span className="explore-card__icon" aria-hidden="true">
          🎮
        </span>
        <span className="text-left">
          <span className="block text-base font-semibold leading-tight">Explore my career in 3D</span>
          <span className="block text-xs font-medium opacity-75">Walk it like a game · 10 stops<span className="hidden sm:inline"> · 2017 → today</span></span>
        </span>
        <span className="ml-auto text-lg" aria-hidden="true">
          →
        </span>
      </button>
      <ul className="explore-card__how" aria-label="How to play">
        {touch ? (
          <>
            <li>
              <span className="explore-card__glyph" aria-hidden="true">◎</span> Joystick to walk
            </li>
            <li>
              <span className="explore-card__glyph" aria-hidden="true">☝</span> Drag to look
            </li>
            <li>
              <span className="explore-card__glyph" aria-hidden="true">◆</span> Tap to discover
            </li>
          </>
        ) : (
          <>
            <li>
              <Key>W</Key>
              <Key>A</Key>
              <Key>S</Key>
              <Key>D</Key> walk
            </li>
            <li>
              <span className="explore-card__glyph" aria-hidden="true">🖱</span> drag to look
            </li>
            <li>
              <Key>E</Key> discover
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
