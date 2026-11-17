import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AGENTS } from "../data/agents";

/* ------------------------------------------------------------------ building pieces */

function Windows({ cols, rows, width, height, z, color, lit = 0.6, seed = 1 }) {
  // A grid of emissive panes on one face; a deterministic subset is "lit".
  const panes = useMemo(() => {
    const out = [];
    let s = seed;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        s = (s * 9301 + 49297) % 233280;
        out.push({
          x: -width / 2 + (width / cols) * (c + 0.5),
          y: (height / rows) * (r + 0.5),
          on: s / 233280 < lit,
        });
      }
    return out;
  }, [cols, rows, width, height, lit, seed]);
  return panes.map((p, i) => (
    <mesh key={i} position={[p.x, p.y, z]}>
      <planeGeometry args={[(width / cols) * 0.55, (height / rows) * 0.5]} />
      <meshStandardMaterial
        color={p.on ? color : "#1e293b"}
        emissive={p.on ? color : "#000"}
        emissiveIntensity={p.on ? 1.4 : 0}
        toneMapped={false}
      />
    </mesh>
  ));
}

function TownHall({ color, hot }) {
  return (
    <group>
      <RoundedBox args={[4.2, 0.4, 3.2]} radius={0.08} position={[0, 0.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#cbd5e1" />
      </RoundedBox>
      <mesh position={[0, 1.6, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 2.4, 2.4]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
        <mesh key={x} position={[x, 1.6, 1.15]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 2.4, 12]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      <mesh position={[0, 3.05, 0.4]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.8, 0.7, 4]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 3.6, -0.2]} castShadow>
        <sphereGeometry args={[0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hot ? 0.9 : 0.35} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.75, -0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0.22, 5.05, -0.2]}>
        <boxGeometry args={[0.42, 0.26, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CareerHQ({ color, hot }) {
  return (
    <group>
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 6.4, 2.4]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.6} roughness={0.25} />
      </mesh>
      <group position={[0, 0.3, 1.21]}>
        <Windows cols={4} rows={10} width={2.2} height={6} z={0} color={color} lit={hot ? 0.85 : 0.55} seed={3} />
      </group>
      <group position={[1.21, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Windows cols={4} rows={10} width={2.2} height={6} z={0} color={color} lit={0.5} seed={7} />
      </group>
      <mesh position={[0, 6.6, 0]} castShadow>
        <boxGeometry args={[1.6, 0.4, 1.6]} />
        <meshStandardMaterial color="#312e81" />
      </mesh>
      <mesh position={[0, 7.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0, 7.95, 0]}>
        <sphereGeometry args={[0.09]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[1.9, 1.4, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.8, 2]} />
        <meshStandardMaterial color="#27245e" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

function EngineeringLab({ color, hot }) {
  const dish = useRef();
  useFrame((_, dt) => {
    if (dish.current) dish.current.rotation.y += dt * (hot ? 1.2 : 0.4);
  });
  return (
    <group>
      <RoundedBox args={[4, 2.2, 2.8]} radius={0.12} position={[0, 1.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 1.15, 1.41]}>
        <planeGeometry args={[3.4, 0.9]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hot ? 1.3 : 0.6} toneMapped={false} />
      </mesh>
      {[-1.3, -0.45, 0.45, 1.3].map((x, i) => (
        <group key={x} position={[x, 2.2, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.6, 0.7, 1.6]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {[0, 1, 2].map((r) => (
            <mesh key={r} position={[0, 0.15 + r * 0.2, 0.81]}>
              <planeGeometry args={[0.45, 0.06]} />
              <meshStandardMaterial
                color={(i + r) % 2 ? color : "#22d3ee"}
                emissive={(i + r) % 2 ? color : "#22d3ee"}
                emissiveIntensity={1.5}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}
      <group ref={dish} position={[1.3, 3.3, -0.6]}>
        <mesh rotation={[-Math.PI / 3, 0, 0]} castShadow>
          <sphereGeometry args={[0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#cbd5e1" side={THREE.DoubleSide} metalness={0.5} />
        </mesh>
      </group>
      <mesh position={[1.3, 2.9, -0.6]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

function ServicesStudio({ color, hot }) {
  return (
    <group>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 2.6, 2.6]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <mesh position={[0, 3.05, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.01, 2.6, 1, 4, 1]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {[-1.25, -0.75, -0.25, 0.25, 0.75, 1.25].map((x, i) => (
        <mesh key={x} position={[x, 1.95, 1.55]} rotation={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.04, 0.8]} />
          <meshStandardMaterial color={i % 2 ? "#ffffff" : color} />
        </mesh>
      ))}
      <mesh position={[0, 0.9, 1.31]}>
        <planeGeometry args={[2.6, 1.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hot ? 1.1 : 0.45} toneMapped={false} />
      </mesh>
      <mesh position={[-1.95, 0.6, 1.2]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
    </group>
  );
}

function ResearchTower({ color, hot }) {
  const ring = useRef();
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.6;
  });
  return (
    <group>
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.25, 5.2, 24]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {[1.2, 2.4, 3.6].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[1.12 - y * 0.04, 0.05, 8, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hot ? 1.4 : 0.6} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 5.2, 0]} castShadow>
        <sphereGeometry args={[1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.35, 5.75, 0.5]} rotation={[-0.8, 0, -0.3]}>
        <cylinderGeometry args={[0.12, 0.16, 1.1, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} />
      </mesh>
      <group ref={ring} position={[0, 5.5, 0]} rotation={[Math.PI / 2.3, 0, 0]}>
        <mesh>
          <torusGeometry args={[1.6, 0.025, 8, 64]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[1.6, 0, 0]}>
          <sphereGeometry args={[0.12]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

const BUILDINGS = {
  welcome: TownHall,
  career: CareerHQ,
  project: EngineeringLab,
  client: ServicesStudio,
  research: ResearchTower,
};

/* ------------------------------------------------------------------ agents */

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler(0, 0, 0, "YXZ");

function Avatar({ agent, hot, active, onSelect, onHover, registerAnchor }) {
  const group = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock, camera }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime + phase;
    g.position.y = 0.05 + Math.abs(Math.sin(t * (hot ? 4 : 1.6))) * (hot ? 0.18 : 0.06);
    // Turn to face the camera (in the parent's frame), along the shortest arc.
    g.getWorldPosition(_v);
    const worldYaw = Math.atan2(camera.position.x - _v.x, camera.position.z - _v.z);
    const parentYaw = g.parent ? _e.setFromQuaternion(g.parent.getWorldQuaternion(_q)).y : 0;
    const delta = THREE.MathUtils.euclideanModulo(worldYaw - parentYaw - g.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    g.rotation.y += delta * 0.08;
    const s = THREE.MathUtils.lerp(g.scale.x, hot || active ? 1.25 : 1, 0.15);
    g.scale.setScalar(s);
  });
  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.key);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(agent.key);
      }}
      onPointerOut={() => onHover(null)}
    >
      <mesh position={[0, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.45, 6, 16]} />
        <meshStandardMaterial color={agent.color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.2, 24, 16]} />
        <meshStandardMaterial color="#fde4cf" roughness={0.6} />
      </mesh>
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 1.11, 0.18]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.45, 32]} />
        <meshStandardMaterial color={agent.color} emissive={agent.color} emissiveIntensity={hot || active ? 2 : 0.6} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <group position={[0, 1.65, 0]} ref={(o) => registerAnchor(agent.key, o)} />
    </group>
  );
}

function Plot({ agent, hot, active, onSelect, onHover, registerAnchor }) {
  const Building = BUILDINGS[agent.key];
  const [x, , z] = agent.position;
  // Every building faces the plaza; its agent stands at the door, between building and plaza.
  const facing = Math.atan2(-x, -z) || 0;
  const isCenter = x === 0 && z === 0;
  return (
    <group position={agent.position} rotation={[0, isCenter ? 0 : facing, 0]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect(agent.key);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(agent.key);
        }}
        onPointerOut={() => onHover(null)}
        position={isCenter ? [0, 0, -1.2] : [0, 0, 0]}
      >
        <Building color={agent.color} hot={hot || active} />
      </group>
      <group position={isCenter ? [0, 0, 1.6] : [0, 0, 2.2]}>
        <Avatar agent={agent} hot={hot} active={active} onSelect={onSelect} onHover={onHover} registerAnchor={registerAnchor} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ scenery */

function Ground() {
  const roads = AGENTS.filter((a) => a.position[0] || a.position[2]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial color="#14532d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[3.6, 64]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.4, 3.6, 64]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {roads.map((a) => {
        const [x, , z] = a.position;
        const len = Math.hypot(x, z);
        return (
          <mesh
            key={a.key}
            position={[x / 2, 0.015, z / 2]}
            rotation={[-Math.PI / 2, 0, Math.atan2(x, z)]}
            receiveShadow
          >
            <planeGeometry args={[1.3, len]} />
            <meshStandardMaterial color="#334155" roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

function Trees() {
  const trees = useMemo(() => {
    const out = [];
    let s = 42;
    const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    while (out.length < 46) {
      const r = 9 + rand() * 11;
      const a = rand() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (AGENTS.some((ag) => Math.hypot(ag.position[0] - x, ag.position[2] - z) < 4)) continue;
      out.push({ x, z, h: 0.8 + rand() * 1.2, tone: rand() });
    }
    return out;
  }, []);
  return trees.map((t, i) => (
    <group key={i} position={[t.x, 0, t.z]}>
      <mesh position={[0, t.h * 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, t.h * 0.7]} />
        <meshStandardMaterial color="#713f12" />
      </mesh>
      <mesh position={[0, t.h * 0.95, 0]} castShadow>
        <coneGeometry args={[0.55 * t.h, 1.4 * t.h, 7]} />
        <meshStandardMaterial color={t.tone > 0.5 ? "#166534" : "#15803d"} flatShading />
      </mesh>
    </group>
  ));
}

function Lamps() {
  const lamps = useMemo(
    () => Array.from({ length: 10 }, (_, i) => [Math.cos((i / 10) * Math.PI * 2) * 4.3, Math.sin((i / 10) * Math.PI * 2) * 4.3]),
    []
  );
  return lamps.map(([x, z], i) => (
    <group key={i} position={[x, 0, z]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  ));
}

/* ------------------------------------------------------------------ camera */

const UP = new THREE.Vector3(0, 1, 0);
const HOME = { pos: new THREE.Vector3(0, 13, 19), look: new THREE.Vector3(0, 1.5, 0) };

function CameraRig({ selected, controls }) {
  const { camera } = useThree();
  const flying = useRef(false);
  const goal = useMemo(() => {
    const agent = AGENTS.find((a) => a.key === selected);
    if (!agent) return HOME;
    const p = new THREE.Vector3(...agent.position);
    const tall = agent.key === "career" || agent.key === "research";
    const look = p.clone().add(new THREE.Vector3(0, tall ? 3 : 2, 0));
    const pos = p.lengthSq()
      ? // Approach from the plaza side, angled ~35° so the Town Hall dome stays out of the sightline.
        p.clone().add(p.clone().negate().setY(0).normalize().applyAxisAngle(UP, 0.6).multiplyScalar(tall ? 13 : 8.5)).add(new THREE.Vector3(0, tall ? 8 : 5, 0))
      : new THREE.Vector3(3.5, 5, 10);
    // Aim a little to the building's right so it sits in the left half, clear of the chat panel.
    const forward = look.clone().sub(pos).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
    return { pos, look: look.clone().setY(tall ? 3.2 : 1.6).add(right.multiplyScalar(tall ? 3.2 : 2.2)) };
  }, [selected]);

  useEffect(() => {
    flying.current = true;
  }, [goal]);

  useFrame(() => {
    if (!flying.current || !controls.current) return;
    camera.position.lerp(goal.pos, 0.06);
    controls.current.target.lerp(goal.look, 0.08);
    controls.current.update();
    if (camera.position.distanceTo(goal.pos) < 0.05) flying.current = false;
  });
  return null;
}

/* ------------------------------------------------------------------ labels */

// Labels are plain DOM buttons over the canvas, moved every frame to their 3D anchors.
// (drei <Html> mounts a React root per label; under React 19 one of them could be lost.)
function LabelProjector({ anchors, labels }) {
  const { camera, size } = useThree();
  useFrame(() => {
    for (const key of Object.keys(labels.current)) {
      const el = labels.current[key];
      const anchor = anchors.current[key];
      if (!el || !anchor) continue;
      anchor.getWorldPosition(_v);
      const dist = camera.position.distanceTo(_v);
      _v.project(camera);
      const hidden = _v.z > 1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2;
      el.style.opacity = hidden ? "0" : "1";
      el.style.pointerEvents = hidden ? "none" : "auto";
      const x = ((_v.x + 1) / 2) * size.width;
      const y = ((1 - _v.y) / 2) * size.height;
      const scale = THREE.MathUtils.clamp(14 / dist, 0.7, 1.35);
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      el.style.zIndex = String(1000 - Math.round(dist * 10));
    }
  });
  return null;
}

/* ------------------------------------------------------------------ scene */

export default function Town3D({ selected, onSelect, paused = false }) {
  const [hovered, setHovered] = useState(null);
  const controls = useRef();
  const anchors = useRef({});
  const labels = useRef({});
  const registerAnchor = useCallback((key, obj) => {
    if (obj) anchors.current[key] = obj;
    else delete anchors.current[key];
  }, []);
  return (
    <div className="relative isolate h-full w-full overflow-hidden">
    <Canvas
      frameloop={paused ? "never" : "always"}
      shadows
      dpr={[1, 1.75]}
      camera={{ position: HOME.pos.toArray(), fov: 42, near: 0.1, far: 200 }}
      onPointerMissed={() => onSelect(null)}
      style={{ cursor: hovered ? "pointer" : "grab" }}
    >
      <color attach="background" args={["#0b1120"]} />
      <fog attach="fog" args={["#0b1120", 26, 52]} />
      <hemisphereLight args={["#c7d2fe", "#14532d", 0.55]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[0, 6, 0]} intensity={18} distance={18} color="#93c5fd" />

      <Ground />
      <Trees />
      <Lamps />
      {AGENTS.map((agent) => (
        <Plot
          key={agent.key}
          agent={agent}
          hot={hovered === agent.key}
          active={selected === agent.key}
          onSelect={onSelect}
          onHover={setHovered}
          registerAnchor={registerAnchor}
        />
      ))}
      <ContactShadows position={[0, 0.03, 0]} opacity={0.35} scale={40} blur={2.5} far={8} />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        minDistance={6}
        maxDistance={34}
        maxPolarAngle={Math.PI / 2.25}
        autoRotate={!selected && !hovered}
        autoRotateSpeed={0.35}
        target={HOME.look.toArray()}
      />
      <CameraRig selected={selected} controls={controls} />
      <LabelProjector anchors={anchors} labels={labels} />
    </Canvas>
    <div className="pointer-events-none absolute inset-0">
      {AGENTS.map((agent) => (
        <button
          key={agent.key}
          ref={(el) => {
            if (el) labels.current[agent.key] = el;
            else delete labels.current[agent.key];
          }}
          onClick={() => onSelect(agent.key)}
          onMouseEnter={() => setHovered(agent.key)}
          onMouseLeave={() => setHovered(null)}
          className={`town-label absolute left-0 top-0 opacity-0 ${hovered === agent.key || selected === agent.key ? "town-label--hot" : ""}`}
          style={{ "--accent": agent.color, transitionProperty: "border-color, box-shadow" }}
          aria-label={`Talk to ${agent.name}, ${agent.role} in the ${agent.building}`}
        >
          <span className="town-label__dot" />
          <strong>{agent.name}</strong>
          <span className="town-label__role">{agent.building}</span>
        </button>
      ))}
    </div>
    </div>
  );
}
