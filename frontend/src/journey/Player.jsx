// The visitor: a third-person character, its controller (keyboard, joystick, autopilot),
// collisions, chapter-zone and hotspot detection, and the follow / cinematic camera.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CHAPTERS, FINALE_INDEX } from "./chapters";
import { hotspotKey, hotspots, input, moveVector } from "./store";
import { COLLIDER_LIST, END_Z, START_Z, STATIONS, ZONE_RADIUS, progressAt, roadX, runtime } from "./world";

const WALK = 5.2;
const RUN = 9.5;
const AUTO = 6.5;
const REACH = 3.4;

const damp = (k, dt) => 1 - Math.exp(-k * dt);
const angleDelta = (a, b) => THREE.MathUtils.euclideanModulo(b - a + Math.PI, Math.PI * 2) - Math.PI;

function Character({ body }) {
  // Body parts are addressed by name from the controller for the walk cycle.
  return (
    <group ref={body}>
      <group name="hips" position={[0, 0.95, 0]}>
        <mesh name="torso" position={[0, 0.42, 0]} castShadow>
          <capsuleGeometry args={[0.27, 0.42, 6, 16]} />
          <meshStandardMaterial color="#2563eb" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.5, -0.27]} castShadow>
          <boxGeometry args={[0.38, 0.45, 0.16]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
        <group name="head" position={[0, 1.02, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.21, 24, 18]} />
            <meshStandardMaterial color="#c68a5e" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.07, -0.02]} scale={[1.05, 0.75, 1.05]} castShadow>
            <sphereGeometry args={[0.21, 20, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <meshStandardMaterial color="#111827" roughness={0.9} />
          </mesh>
          {[-0.075, 0.075].map((x) => (
            <mesh key={x} position={[x, 0.01, 0.19]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color="#0b0f19" />
            </mesh>
          ))}
        </group>
        {[-1, 1].map((s) => (
          <group key={s} name={s < 0 ? "armL" : "armR"} position={[s * 0.36, 0.72, 0]}>
            <mesh position={[0, -0.3, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.42, 4, 10]} />
              <meshStandardMaterial color="#2563eb" roughness={0.75} />
            </mesh>
            <mesh position={[0, -0.62, 0]} castShadow>
              <sphereGeometry args={[0.075, 10, 8]} />
              <meshStandardMaterial color="#c68a5e" roughness={0.6} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((s) => (
          <group key={s} name={s < 0 ? "legL" : "legR"} position={[s * 0.13, 0.02, 0]}>
            <mesh position={[0, -0.42, 0]} castShadow>
              <capsuleGeometry args={[0.095, 0.62, 4, 10]} />
              <meshStandardMaterial color="#1e293b" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.88, 0.06]} castShadow>
              <boxGeometry args={[0.17, 0.12, 0.3]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
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

export default function Player({ teleport, autopilot, cinematic, revealed, viewShift, onZone, onNear, onAutoReveal, onAutopilotEnd, onUserInput }) {
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
    dist: 7.5,
    look: new THREE.Vector3(),
    lastDrag: -1e9,
    zone: undefined,
    near: undefined,
    cine: null,
    ap: { target: null, dwell: 0, nextReveal: 0 },
    off: 0,
  });
  const props = useRef({});
  props.current = { viewShift, size, autopilot, revealed, onZone, onNear, onAutoReveal, onAutopilotEnd, onUserInput };

  // Name lookup for the animated parts.
  useEffect(() => {
    const p = {};
    body.current.traverse((o) => o.name && (p[o.name] = o));
    parts.current = p;
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
      s.yaw -= dx * 0.006;
      s.pitch = THREE.MathUtils.clamp(s.pitch + dy * 0.004, 0.05, 1.2);
      s.lastDrag = performance.now();
      s.cine = null;
    };
    const up = (e) => {
      if (drag && drag.id === e.pointerId) drag = null;
    };
    const wheel = (e) => {
      e.preventDefault();
      st.current.dist = THREE.MathUtils.clamp(st.current.dist + e.deltaY * 0.01, 3.5, 16);
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
      s.cine = null;
      if (P.autopilot) P.onUserInput?.();
    }
    if (input.keys.has("camL")) s.yaw += dt * 1.8;
    if (input.keys.has("camR")) s.yaw -= dt * 1.8;

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

    s.speed = THREE.MathUtils.lerp(s.speed, targetSpeed, damp(10, dt));
    if (targetSpeed > 0.01) {
      const h = Math.atan2(vx, vz);
      s.heading += angleDelta(s.heading, h) * damp(12, dt);
    }
    const mvx = Math.sin(s.heading) * s.speed * dt;
    const mvz = Math.cos(s.heading) * s.speed * dt;
    s.pos.x += mvx;
    s.pos.z += mvz;

    /* ---------------- collisions & bounds */
    for (const c of COLLIDER_LIST) {
      const dx = s.pos.x - c.x;
      const dz = s.pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + 0.35;
      if (d < min && d > 1e-4) {
        s.pos.x = c.x + (dx / d) * min;
        s.pos.z = c.z + (dz / d) * min;
      }
    }
    s.pos.z = THREE.MathUtils.clamp(s.pos.z, END_Z - 24, START_Z + 14);
    const rx = roadX(s.pos.z);
    s.pos.x = THREE.MathUtils.clamp(s.pos.x, rx - 32, rx + 32);

    runtime.player.copy(s.pos);
    runtime.progress = progressAt(s.pos.z);

    /* ---------------- character pose */
    const b = body.current;
    if (b) {
      b.position.copy(s.pos);
      b.rotation.y = s.heading;
      const k = parts.current;
      const moving = s.speed / RUN;
      s.phase += dt * (4 + s.speed * 1.3) * (s.speed > 0.2 ? 1 : 0);
      const swing = Math.sin(s.phase) * Math.min(0.9, moving * 1.3 + 0.1) * (s.speed > 0.2 ? 1 : 0);
      if (k.legL) {
        k.legL.rotation.x = swing;
        k.legR.rotation.x = -swing;
        k.armL.rotation.x = -swing * 0.8;
        k.armR.rotation.x = swing * 0.8;
        k.hips.position.y = 0.95 + Math.abs(Math.cos(s.phase)) * 0.06 * Math.min(1, moving * 2) + (s.speed < 0.2 ? Math.sin(now / 600) * 0.008 : 0);
        k.torso.rotation.x = moving * 0.18;
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
      const autoAlign = s.speed > 0.5 && now - s.lastDrag > 1600 && (P.autopilot || Math.abs(mv.y) >= Math.abs(mv.x) * 0.9);
      if (autoAlign && mv.y >= -0.1) s.yaw += angleDelta(s.yaw, s.heading + Math.PI) * damp(1.6, dt);
      const cp = Math.cos(s.pitch);
      const desired = new THREE.Vector3(
        s.pos.x + Math.sin(s.yaw) * cp * s.dist,
        s.pos.y + 1.4 + Math.sin(s.pitch) * s.dist,
        s.pos.z + Math.cos(s.yaw) * cp * s.dist
      );
      camera.position.lerp(desired, damp(7, dt));
      s.look.lerp(new THREE.Vector3(s.pos.x, 1.35, s.pos.z), damp(10, dt));
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

  return <Character body={body} />;
}
