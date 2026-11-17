import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
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

const _look = new THREE.Vector3();

function StationAgent({ agentKey, position, active, onAsk, question }) {
  const agent = AGENT_BY_KEY[agentKey];
  const g = useRef();
  const phase = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    const o = g.current;
    if (!o) return;
    const t = clock.elapsedTime + phase;
    o.children[0].position.y = Math.abs(Math.sin(t * (active ? 3 : 1.4))) * (active ? 0.12 : 0.04);
    _look.set(runtime.player.x, 0, runtime.player.z);
    const yaw = Math.atan2(_look.x - position.x, _look.z - position.z);
    const d = THREE.MathUtils.euclideanModulo(yaw - o.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    o.rotation.y += d * 0.08;
  });
  return (
    <group ref={g} position={position}>
      <group>
        <mesh position={[0, 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.26, 0.5, 6, 16]} />
          <meshStandardMaterial color={agent.color} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.23, 24, 16]} />
          <meshStandardMaterial color="#f1d3b8" roughness={0.6} />
        </mesh>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, 1.24, 0.2]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.52, 32]} />
        <meshStandardMaterial color={agent.color} emissive={agent.color} emissiveIntensity={active ? 2 : 0.6} toneMapped={false} />
      </mesh>
      {/* A 3D billboard rather than drei <Html>: Html roots throw when unmounted with the journey. */}
      <Billboard position={[0, 2.05, 0]} visible={active}>
        <group
          onClick={(e) => {
            if (!active || e.delta > 8) return;
            e.stopPropagation();
            onAsk(agentKey, question);
          }}
          onPointerOver={() => active && (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <Panel size={[1.7, 0.5]} lines={[`Ask ${agent.name}`, agent.role]} opts={{ w: 512, h: 150, bg: "#020617", accent: agent.color, size: 62 }} glow={1} back={false} />
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
