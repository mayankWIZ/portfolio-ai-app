// Plain mutable state shared between the DOM HUD and the 3D scene, read every frame.
// React state would re-render the canvas on every key press; these are just refs.

export const input = {
  keys: new Set(),
  joy: { x: 0, y: 0 }, // on-screen joystick, -1..1 (y up = forward)
  orbit: 0, // keyboard camera orbit (-1, 0, 1)
  lastUser: 0, // performance.now() of the last manual input (cancels autopilot)
};

/** Inspectable objects registered by the dioramas: key "chapter:index" → { chapter, index, label, pos } */
export const hotspots = new Map();

export const hotspotKey = (chapter, index) => `${chapter}:${index}`;

const MOVE_KEYS = {
  KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r",
  ShiftLeft: "run", ShiftRight: "run", KeyZ: "camL", KeyX: "camR",
};

export function keyAction(code) {
  return MOVE_KEYS[code];
}

export function moveVector() {
  const k = input.keys;
  let x = (k.has("r") ? 1 : 0) - (k.has("l") ? 1 : 0);
  let y = (k.has("f") ? 1 : 0) - (k.has("b") ? 1 : 0);
  x += input.joy.x;
  y += input.joy.y;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y, run: k.has("run") || Math.hypot(input.joy.x, input.joy.y) > 0.92 };
}
