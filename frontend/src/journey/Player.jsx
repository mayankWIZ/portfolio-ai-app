// The visitor: a third-person character, its controller (keyboard, joystick, autopilot),
// collisions, chapter-zone and hotspot detection, and the follow / cinematic camera.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Humanoid, { OUTFITS, humanoidParts } from "../components/Humanoid";
import { CHAPTERS, FINALE_INDEX } from "./chapters";
import { hotspotKey, hotspots, input, moveVector, pickups } from "./store";
import { COLLIDER_LIST, END_Z, START_Z, STATIONS, ZONE_RADIUS, progressAt, roadX, runtime } from "./world";

// Calm, easy-to-follow speeds (world units per second).
const WALK = 4;
const RUN = 7.5;
const AUTO = 5;
// Camera orbit: radians per dragged pixel. Touch screens are smaller, so a little more per pixel.
// Physics tuning: how quickly you reach top speed, how fast you stop, and the jump arc (~1.3 m high).
const ACCEL = 9;
const FRICTION = 12;
const AIR_ACCEL = 2.5;
const GRAVITY = 24;
const JUMP_V = 8;
const DRAG_MOUSE = 0.0024;
const DRAG_TOUCH = 0.0038;
const REACH = 3.4;

const damp = (k, dt) => 1 - Math.exp(-k * dt);
const angleDelta = (a, b) => THREE.MathUtils.euclideanModulo(b - a + Math.PI, Math.PI * 2) - Math.PI;

function Character({ body }) {
  return (
    <group ref={body}>
      <Humanoid outfit={OUTFITS.player} />
      {/* soft blob shadow helps grounding when real shadows are off */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

function nearestZone(p) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = Math.hypot(p.x - s.anchor.x, p.z - s.anchor.z);
    const r = s.side === 0 ? ZONE_RADIUS + 6 : ZONE_RADIUS;
    const dc = Math.hypot(p.x - s.center.x, p.z - s.center.z);
    const dd = Math.min(d, dc);
    if ((d < r || dc < 9) && dd < bestD) {
      best = s.index;
      bestD = dd;
    }
  }
  return best;
}

export default function Player({ teleport, autopilot, cinematic, revealed, viewShift, guide, onZone, onNear, onAutoReveal, onAutopilotEnd, onUserInput, onMoved, onPickup }) {
  const { camera, gl, size } = useThree();
  const body = useRef();
  const parts = useRef({});
  const st = useRef({
    pos: runtime.player.clone(),
    heading: Math.PI,
    speed: 0,
    phase: 0,
    yaw: 0,
    pitch: 0.38,
    dist: window.innerWidth < 768 ? 9.5 : 7.5, // phones have no scroll-zoom; start a little wider
    look: new THREE.Vector3(),
    lastDrag: -1e9,
    zone: undefined,
    near: undefined,
    cine: null,
    ap: { target: null, dwell: 0, nextReveal: 0 },
    off: 0,
    dragYaw: 0,
    dragPitch: 0,
    vel: new THREE.Vector3(),
    y: 0,
    vy: 0,
    land: 0,
    lastGround: 0,
    jumpBuffer: 0,
    jumpWas: false,
  });
  const props = useRef({});
  props.current = { onPickup, onMoved, viewShift, size, autopilot, revealed, onZone, onNear, onAutoReveal, onAutopilotEnd, onUserInput };

  // Name lookup for the animated parts.
  useEffect(() => {
    parts.current = humanoidParts(body.current);
    st.current.look.copy(st.current.pos).add(new THREE.Vector3(0, 1.3, 0));
    camera.position.set(st.current.pos.x, 4.5, st.current.pos.z + 8);
  }, [camera]);

  // Orbit by dragging (mouse or a finger on the canvas); zoom with the wheel.
  useEffect(() => {
    const el = gl.domElement;
    let drag = null;
    const down = (e) => {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const move = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      const s = st.current;
      // Queue the rotation; the frame loop eases it in so the view glides instead of snapping.
      const k = e.pointerType === "touch" ? DRAG_TOUCH : DRAG_MOUSE;
      s.dragYaw -= dx * k;
      s.dragPitch += dy * k * 0.7;
      s.lastDrag = performance.now();
      s.cine = null;
    };
    const up = (e) => {
      if (drag && drag.id === e.pointerId) drag = null;
    };
    const wheel = (e) => {
      e.preventDefault();
      st.current.dist = THREE.MathUtils.clamp(st.current.dist + e.deltaY * 0.004, 3.5, 16);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  // Skip-to-chapter.
  useEffect(() => {
    if (!teleport) return;
    const s = st.current;
    const station = STATIONS[teleport.index];
    s.pos.copy(station.anchor);
    if (station.side === 0) s.pos.z += 4;
    // Face the diorama, camera on the far side of the road.
    s.heading = station.side === 0 ? Math.PI : Math.atan2(station.side, 0);
    s.yaw = station.side === 0 ? 0 : Math.atan2(-station.side, 0.6);
    s.dragYaw = s.dragPitch = 0;
    s.vel.set(0, 0, 0);
    s.y = s.vy = 0;
    s.ap.target = teleport.index;
    s.ap.dwell = 0;
    camera.position.copy(s.pos).add(new THREE.Vector3(Math.sin(s.yaw) * 7, 4, Math.cos(s.yaw) * 7));
    s.look.copy(s.pos).add(new THREE.Vector3(0, 1.3, 0));
  }, [teleport, camera]);

  useEffect(() => {
    if (!cinematic) return;
    st.current.cine = { shot: STATIONS[cinematic.index].shot, until: performance.now() + 3200 };
  }, [cinematic]);

  useEffect(() => {
    if (autopilot) {
      const s = st.current;
      // Resume from the chapter we're at (or the next one ahead on the road).
      const z = s.pos.z;
      const idx = STATIONS.findIndex((x) => x.anchor.z < z + 3);
      s.ap = { target: idx === -1 ? FINALE_INDEX : idx, dwell: 0, nextReveal: 0 };
    }
  }, [autopilot]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = st.current;
    const P = props.current;
    const now = performance.now();

    /* ---------------- input → desired velocity */
    const mv = moveVector();
    const manual = Math.abs(mv.x) + Math.abs(mv.y) > 0.05;
    if (manual) {
      input.lastUser = now;
      if (!s.moved) {
        s.moved = true;
        P.onMoved?.();
      }
      s.cine = null;
      if (P.autopilot) P.onUserInput?.();
    }
    if (input.keys.has("camL")) s.yaw += dt * 1.1;
    if (input.keys.has("camR")) s.yaw -= dt * 1.1;
    // Ease queued drag rotation in over a few frames.
    if (s.dragYaw || s.dragPitch) {
      const f = damp(9, dt);
      const dy = s.dragYaw * f;
      const dp = s.dragPitch * f;
      s.yaw += dy;
      s.pitch = THREE.MathUtils.clamp(s.pitch + dp, 0.05, 1.2);
      s.dragYaw -= dy;
      s.dragPitch -= dp;
      if (Math.abs(s.dragYaw) < 1e-4) s.dragYaw = 0;
      if (Math.abs(s.dragPitch) < 1e-4) s.dragPitch = 0;
    }

    let vx = 0;
    let vz = 0;
    let targetSpeed = 0;
    if (manual) {
      const fx = -Math.sin(s.yaw);
      const fz = -Math.cos(s.yaw);
      const rx = Math.cos(s.yaw);
      const rz = -Math.sin(s.yaw);
      vx = fx * mv.y + rx * mv.x;
      vz = fz * mv.y + rz * mv.x;
      const len = Math.hypot(vx, vz) || 1;
      vx /= len;
      vz /= len;
      targetSpeed = (mv.run ? RUN : WALK) * Math.min(1, Math.hypot(mv.x, mv.y));
    } else if (P.autopilot && s.ap.target != null) {
      const station = STATIONS[s.ap.target];
      const dest = station.side === 0 ? station.anchor.clone().setZ(station.anchor.z + 4) : station.anchor;
      const dx = dest.x - s.pos.x;
      const dz = dest.z - s.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.8) {
        // Follow the road: aim a few metres ahead along it, or straight at the stop when close.
        let ax = dest.x;
        let az = dest.z;
        if (d > 6 && dest.z < s.pos.z) {
          az = Math.max(dest.z, s.pos.z - 5);
          ax = roadX(az);
        }
        const l = Math.hypot(ax - s.pos.x, az - s.pos.z) || 1;
        vx = (ax - s.pos.x) / l;
        vz = (az - s.pos.z) / l;
        targetSpeed = Math.min(AUTO, d * 2);
        s.ap.dwell = 0;
      } else {
        // Dwell: reveal this station's objects one by one, then move on.
        s.ap.dwell += dt;
        const chapter = CHAPTERS[s.ap.target];
        const keys = chapter.inspect.map((_, i) => hotspotKey(s.ap.target, i));
        const pending = keys.filter((k) => !P.revealed.has(k));
        if (pending.length && s.ap.dwell > 1.6 && now > s.ap.nextReveal) {
          P.onAutoReveal?.(pending[0]);
          s.ap.nextReveal = now + 1500;
        }
        const hold = 3.5 + chapter.inspect.length * 1.5;
        if (s.ap.target === FINALE_INDEX && s.ap.dwell > 1.5) {
          s.ap.target = null;
          P.onAutopilotEnd?.();
        } else if (s.ap.dwell > hold && !pending.length) {
          s.ap.target = Math.min(FINALE_INDEX, s.ap.target + 1);
          s.ap.dwell = 0;
        }
      }
    }

    /* ---------------- physics: momentum, friction, jump, gravity */
    const grounded = s.y <= 0.0001;
    if (grounded) s.lastGround = now;
    // Accelerate toward the wanted velocity; brake harder than you speed up (snappy but never twitchy).
    const wantX = vx * targetSpeed;
    const wantZ = vz * targetSpeed;
    const accel = targetSpeed > 0.01 ? (grounded ? ACCEL : AIR_ACCEL) : grounded ? FRICTION : AIR_ACCEL * 0.5;
    const f = damp(accel, dt);
    s.vel.x += (wantX - s.vel.x) * f;
    s.vel.z += (wantZ - s.vel.z) * f;
    s.speed = Math.hypot(s.vel.x, s.vel.z);
    if (s.speed > 0.35) s.heading += angleDelta(s.heading, Math.atan2(s.vel.x, s.vel.z)) * damp(grounded ? 10 : 4, dt);

    // Jump: buffered press + coyote time, so it forgives slightly early or late taps.
    const jumpHeld = input.keys.has("jump");
    if (jumpHeld && !s.jumpWas) s.jumpBuffer = now;
    s.jumpWas = jumpHeld;
    if (now - s.jumpBuffer < 140 && now - s.lastGround < 120 && s.vy <= 0) {
      s.vy = JUMP_V;
      s.jumpBuffer = 0;
      s.lastGround = 0;
      s.cine = null;
      if (!s.moved) {
        s.moved = true;
        P.onMoved?.();
      }
    }
    // Shorter hop when the button is released early (variable jump height).
    const g = s.vy > 0 && !jumpHeld ? GRAVITY * 1.8 : GRAVITY;
    s.vy -= g * dt;
    s.y += s.vy * dt;
    if (s.y <= 0) {
      if (s.vy < -4) s.land = 1; // landing squash
      s.y = 0;
      s.vy = 0;
    }
    s.land = Math.max(0, s.land - dt * 5);

    s.pos.x += s.vel.x * dt;
    s.pos.z += s.vel.z * dt;

    /* ---------------- collisions & bounds */
    for (const c of COLLIDER_LIST) {
      const dx = s.pos.x - c.x;
      const dz = s.pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + 0.35;
      if (d < min && d > 1e-4) {
        const nx = dx / d;
        const nz = dz / d;
        s.pos.x = c.x + nx * min;
        s.pos.z = c.z + nz * min;
        // Slide along the obstacle: drop only the part of the velocity pushing into it.
        const into = s.vel.x * nx + s.vel.z * nz;
        if (into < 0) {
          s.vel.x -= into * nx;
          s.vel.z -= into * nz;
        }
      }
    }
    s.pos.z = THREE.MathUtils.clamp(s.pos.z, END_Z - 24, START_Z + 14);
    const rx = roadX(s.pos.z);
    s.pos.x = THREE.MathUtils.clamp(s.pos.x, rx - 32, rx + 32);

    runtime.player.copy(s.pos);
    runtime.progress = progressAt(s.pos.z);

    /* ---------------- pickups (collectibles, mini-game targets) */
    for (const [id, p] of pickups) {
      const dx = p.x - s.pos.x;
      const dy = p.y - (s.y + 0.95);
      const dz = p.z - s.pos.z;
      if (dx * dx + dz * dz < 1.1 && Math.abs(dy) < 1.15) {
        pickups.delete(id);
        P.onPickup?.(id);
      }
    }

    /* ---------------- character pose */
    const b = body.current;
    if (b) {
      b.position.set(s.pos.x, s.y, s.pos.z);
      b.rotation.y = s.heading;
      // Squash on landing, stretch while rising.
      const sq = s.land * 0.18;
      const st2 = s.vy > 0 ? Math.min(0.1, s.vy * 0.012) : 0;
      b.scale.set(1 + sq * 0.6, 1 - sq + st2, 1 + sq * 0.6);
      const k = parts.current;
      const moving = s.speed / RUN;
      s.phase += dt * (4 + s.speed * 1.3) * (s.speed > 0.2 ? 1 : 0);
      const swing = Math.sin(s.phase) * Math.min(0.9, moving * 1.3 + 0.1) * (s.speed > 0.2 ? 1 : 0);
      if (k.legL) {
        k.legL.rotation.x = swing;
        k.legR.rotation.x = -swing;
        // knees bend on the back-swing, elbows stay softly bent
        k.shinL.rotation.x = Math.max(0, -Math.sin(s.phase - 0.6)) * 0.9 * Math.min(1, moving * 2);
        k.shinR.rotation.x = Math.max(0, Math.sin(s.phase - 0.6)) * 0.9 * Math.min(1, moving * 2);
        k.armL.rotation.x = -swing * 0.8;
        k.armR.rotation.x = swing * 0.8;
        k.armL.rotation.z = -0.08;
        k.armR.rotation.z = 0.08;
        k.foreL.rotation.x = -0.3 - moving * 0.6;
        k.foreR.rotation.x = -0.3 - moving * 0.6;
        k.eyes.scale.y = (now / 1000) % 3.4 < 0.12 ? 0.1 : 1;
        k.hips.position.y = 0.95 + Math.abs(Math.cos(s.phase)) * 0.06 * Math.min(1, moving * 2) + (s.speed < 0.2 ? Math.sin(now / 600) * 0.008 : 0);
        k.torso.rotation.x = moving * 0.18;
        if (s.y > 0.02) {
          // Airborne pose: knees up, arms out.
          k.legL.rotation.x = -0.7;
          k.shinL.rotation.x = 1.1;
          k.legR.rotation.x = 0.25;
          k.shinR.rotation.x = 0.4;
          k.armL.rotation.z = -1.1;
          k.armR.rotation.z = 1.1;
        }
        k.head.rotation.y = s.speed < 0.2 ? Math.sin(now / 1800) * 0.3 : 0;
      }
    }

    /* ---------------- zones & hotspots */
    const zone = nearestZone(s.pos);
    if (zone !== s.zone) {
      s.zone = zone;
      P.onZone?.(zone);
    }
    let near = null;
    let nearD = REACH;
    if (zone != null) {
      for (const [key, h] of hotspots) {
        if (h.chapter !== zone) continue;
        const d = Math.hypot(h.pos.x - s.pos.x, h.pos.z - s.pos.z);
        if (d < nearD) {
          nearD = d;
          near = key;
        }
      }
    }
    if (near !== s.near) {
      s.near = near;
      P.onNear?.(near);
    }

    /* ---------------- camera */
    const dwelling = P.autopilot && s.ap.target != null && s.ap.dwell > 0.3;
    if (s.cine && now > s.cine.until) s.cine = null;
    const shot = s.cine?.shot || (dwelling ? STATIONS[s.ap.target].shot : null);
    if (shot) {
      camera.position.lerp(shot.pos, damp(2.2, dt));
      s.look.lerp(shot.look, damp(2.6, dt));
      // Keep the orbit yaw in sync so control resumes from roughly this angle.
      s.yaw = Math.atan2(camera.position.x - s.pos.x, camera.position.z - s.pos.z);
    } else {
      const autoAlign = s.speed > 0.5 && now - s.lastDrag > 2500 && (P.autopilot || Math.abs(mv.y) >= Math.abs(mv.x) * 0.9);
      if (autoAlign && mv.y >= -0.1) s.yaw += angleDelta(s.yaw, s.heading + Math.PI) * damp(0.9, dt);
      const cp = Math.cos(s.pitch);
      const desired = new THREE.Vector3(
        s.pos.x + Math.sin(s.yaw) * cp * s.dist,
        s.y * 0.5 + 1.4 + Math.sin(s.pitch) * s.dist,
        s.pos.z + Math.cos(s.yaw) * cp * s.dist
      );
      camera.position.lerp(desired, damp(5, dt));
      s.look.lerp(new THREE.Vector3(s.pos.x, 1.35 + s.y * 0.6, s.pos.z), damp(7, dt));
    }
    if (camera.position.y < 0.6) camera.position.y = 0.6;
    camera.lookAt(s.look);

    // With the chapter panel open on the left, slide the projection centre right so the scene stays in view.
    const W = P.size.width;
    const target = P.viewShift && W >= 768 ? Math.min(230, W * 0.17) : 0;
    s.off = THREE.MathUtils.lerp(s.off, target, damp(4, dt));
    if (s.off > 0.5) camera.setViewOffset(W, P.size.height, -s.off, 0, W, P.size.height);
    else if (camera.view?.enabled) camera.clearViewOffset();
  });

  return (
    <>
      <Character body={body} />
      <Guide target={guide} />
    </>
  );
}

/** A gold arrow at the visitor's feet and a light beam at the next stop. */
const _dir = new THREE.Vector3();
function Guide({ target }) {
  const arrow = useRef();
  const beam = useRef();
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.55);
    s.lineTo(0.38, 0.05);
    s.lineTo(0.14, 0.05);
    s.lineTo(0.14, -0.4);
    s.lineTo(-0.14, -0.4);
    s.lineTo(-0.14, 0.05);
    s.lineTo(-0.38, 0.05);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  useFrame(({ clock }) => {
    const a = arrow.current;
    const b = beam.current;
    if (!a || !b) return;
    if (target == null) {
      a.visible = b.visible = false;
      return;
    }
    const st = STATIONS[target];
    const goal = st.anchor;
    _dir.set(goal.x - runtime.player.x, 0, goal.z - runtime.player.z);
    const d = _dir.length();
    const t = clock.elapsedTime;
    // Point along the road when far (it curves), straight at the stop when close.
    if (d > 14 && goal.z < runtime.player.z - 4) {
      const z = runtime.player.z - 8;
      _dir.set(roadX(z) - runtime.player.x, 0, z - runtime.player.z);
    }
    a.visible = d > ZONE_RADIUS - 2;
    const yaw = Math.atan2(_dir.x, _dir.z);
    const off = 1.5 + Math.sin(t * 4) * 0.15;
    a.position.set(runtime.player.x + Math.sin(yaw) * off, 0.06, runtime.player.z + Math.cos(yaw) * off);
    a.rotation.set(-Math.PI / 2, 0, 0);
    a.rotateZ(yaw + Math.PI);
    b.visible = d > 6;
    b.position.set(goal.x, 12, goal.z);
    b.material.opacity = 0.18 + Math.sin(t * 2) * 0.06;
  });
  return (
    <>
      <mesh ref={arrow} geometry={shape} renderOrder={2}>
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.95} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={beam}>
        <cylinderGeometry args={[0.5, 1.4, 24, 20, 1, true]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}
