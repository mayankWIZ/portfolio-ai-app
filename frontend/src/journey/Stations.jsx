import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import Humanoid, { OUTFITS, animateIdle, humanoidParts } from "../components/Humanoid";
import * as THREE from "three";
import { AGENT_BY_KEY } from "../data/agents";
import { CHAPTERS } from "./chapters";
import { DIORAMAS } from "./Dioramas";
import { B, Panel, StationCtx } from "./kit";
import { ROAD_WIDTH, STATIONS, runtime } from "./world";

const VIEW_DIST = 110;

function Signpost({ station }) {
  const c = station.chapter;
  const agent = AGENT_BY_KEY[c.agent];
  const side = station.side || 1;
  const x = station.anchor.x + side * (ROAD_WIDTH / 2 + 0.9);
  const z = station.anchor.z + 13; // before the stop, and behind the cinematic camera
  return (
    <group position={[x, 0, z]} rotation={[0, side * 0.35, 0]}>
      <B p={[0, 1.1, 0]} s={[0.14, 2.2, 0.14]} c="#78350f" r={0.9} />
      <Panel
        p={[0, 2.2, 0.08]}
        size={[2.4, 1.05]}
        lines={[c.short.toUpperCase(), `Chapter ${station.index + 1} · ${c.period}`]}
        opts={{ w: 640, h: 280, bg: "#1c1917", fg: "#fafaf9", accent: agent.color, size: 78 }}
        glow={0.55}
      />
    </group>
  );
}


function StationAgent({ agentKey, position, active, onAsk, question }) {
  const agent = AGENT_BY_KEY[agentKey];
  const g = useRef();
  const body = useRef();
  const parts = useRef({});
  const seed = useMemo(() => Math.random() * 6, []);
  const waveAmt = useRef(0);
  useEffect(() => {
    parts.current = humanoidParts(body.current);
  }, []);
  useFrame(({ clock }) => {
    const o = g.current;
    if (!o) return;
    const t = clock.elapsedTime;
    const dx = runtime.player.x - position.x;
    const dz = runtime.player.z - position.z;
    const dist = Math.hypot(dx, dz);
    // Turn the body slowly toward the visitor; the head tracks faster.
    const yaw = Math.atan2(dx, dz);
    const d = THREE.MathUtils.euclideanModulo(yaw - o.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    o.rotation.y += d * (dist < 16 ? 0.05 : 0.01);
    // Wave when you walk up; "talk" while their chapter is open.
    const waving = dist < 9 && (t + seed) % 7 < 2.4;
    waveAmt.current = THREE.MathUtils.lerp(waveAmt.current, waving ? 1 : 0, 0.08);
    animateIdle(parts.current, t, { seed, wave: waveAmt.current, talk: active ? 1 : 0, lookYaw: d });
  });
  return (
    <group ref={g} position={position}>
      <Humanoid ref={body} outfit={OUTFITS[agentKey]} />
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.56, 40]} />
        <meshStandardMaterial color={agent.color} emissive={agent.color} emissiveIntensity={active ? 2.2 : 0.7} toneMapped={false} />
      </mesh>
      {/* A 3D billboard rather than drei <Html>: Html roots throw when unmounted with the journey. */}
      <Billboard position={[0, 2.25, 0]}>
        <group
          onClick={(e) => {
            if (e.delta > 8) return;
            e.stopPropagation();
            onAsk(agentKey, question);
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <Panel
            size={active ? [1.7, 0.5] : [1.1, 0.32]}
            lines={active ? [`Ask ${agent.name}`, agent.role] : [agent.name]}
            opts={{ w: 512, h: 150, bg: "#020617", accent: agent.color, size: 62 }}
            glow={1}
            back={false}
          />
        </group>
      </Billboard>
    </group>
  );
}

function Station({ station, ctx }) {
  const group = useRef();
  const Diorama = DIORAMAS[station.chapter.kind];
  useFrame(() => {
    if (group.current) group.current.visible = runtime.player.distanceTo(station.center) < VIEW_DIST;
  });
  const c = station.chapter;
  return (
    <StationCtx.Provider value={ctx}>
      <group ref={group}>
        <group position={station.center} rotation={[0, station.rotY, 0]}>
          <Diorama />
        </group>
        {station.side !== 0 && <Signpost station={station} />}
        <StationAgent agentKey={c.agent} position={station.agentPos} active={ctx.active} onAsk={ctx.onAsk} question={c.question} />
        {c.agent2 && (
          <StationAgent
            agentKey={c.agent2}
            position={station.agentPos.clone().add(new THREE.Vector3(0, 0, -2.4))}
            active={ctx.active}
            onAsk={ctx.onAsk}
            question={c.question2}
          />
        )}
      </group>
    </StationCtx.Provider>
  );
}

export default function Stations({ active, toggles, revealed, near, quality, onInspect, onAsk }) {
  return STATIONS.map((s) => (
    <Station
      key={s.index}
      station={s}
      ctx={{
        index: s.index,
        color: AGENT_BY_KEY[CHAPTERS[s.index].agent].color,
        active: active === s.index,
        toggle: !!toggles[s.chapter.id],
        revealed,
        near,
        quality,
        onInspect,
        onAsk,
      }}
    />
  ));
}
