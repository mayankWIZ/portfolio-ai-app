// One procedural diorama per chapter. Local space: +z faces the road, ground at y = 0,
// footprint roughly x ∈ [-7, 7], z ∈ [-7, 5].
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import profile from "../data/profile.json";
import { B, C, Hot, Panel, Tree, useStation } from "./kit";
import { seeded } from "./world";

const tmpObj = new THREE.Object3D();
const tmpCol = new THREE.Color();

/* ================================================================== 1 · campus */

function Campus() {
  const hands = useRef();
  const cap = useRef();
  useFrame(({ clock }, dt) => {
    if (hands.current) hands.current.rotation.z -= dt * 0.8;
    if (cap.current) {
      cap.current.rotation.y = clock.elapsedTime * 0.8;
      cap.current.position.y = 3.2 + Math.sin(clock.elapsedTime * 1.4) * 0.15;
    }
  });
  return (
    <group>
      {/* main hall */}
      <B p={[0, 0.15, -2.6]} s={[10, 0.3, 5.2]} c="#cbbf9f" />
      <B p={[0, 2.1, -3.4]} s={[9, 3.6, 3.6]} c="#d9c7a1" r={0.85} />
      <B p={[0, 4.1, -3.3]} s={[9.6, 0.4, 4.2]} c="#8b3a1e" r={0.8} />
      {[-3.6, -2.2, -0.8, 0.8, 2.2, 3.6].map((x) => (
        <C key={x} p={[x, 2.05, -1.25]} a={[0.18, 0.22, 3.5, 14]} c="#f5f0e6" r={0.5} />
      ))}
      {[0, 1, 2].map((i) => (
        <B key={i} p={[0, 0.1 + i * 0.12, -0.6 + i * -0.25]} s={[4.5 - i * 0.3, 0.12, 0.6]} c="#e7e1d1" />
      ))}
      {[-3, -1.5, 1.5, 3].map((x) => (
        <B key={x} p={[x, 2.4, -1.58]} s={[0.7, 1.1, 0.05]} c="#1e293b" e="#fcd34d" ei={0.35} shadow={false} />
      ))}
      {/* clock tower */}
      <B p={[0, 5.6, -3.6]} s={[1.8, 3.4, 1.8]} c="#d9c7a1" />
      <mesh position={[0, 8, -3.6]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.5, 1.6, 4]} />
        <meshStandardMaterial color="#8b3a1e" roughness={0.8} />
      </mesh>
      <C p={[0, 6.1, -2.68]} a={[0.65, 0.65, 0.05, 32]} rot={[Math.PI / 2, 0, 0]} c="#fffbeb" e="#fef3c7" ei={0.4} />
      <group ref={hands} position={[0, 6.1, -2.62]}>
        <B p={[0, 0.22, 0]} s={[0.05, 0.45, 0.02]} c="#111827" shadow={false} />
      </group>
      <B p={[0.15, 6.1, -2.63]} s={[0.3, 0.05, 0.02]} c="#111827" shadow={false} />
      {/* floating graduation cap */}
      <group ref={cap} position={[0, 3.2, 1.6]}>
        <B p={[0, 0, 0]} s={[1, 0.06, 1]} c="#111827" rot={[0, Math.PI / 4, 0]} />
        <C p={[0, -0.18, 0]} a={[0.32, 0.36, 0.3, 16]} c="#111827" />
        <C p={[0.45, -0.25, 0]} a={[0.02, 0.02, 0.5, 6]} c="#facc15" e="#facc15" ei={0.5} />
      </group>
      {/* diploma pedestal */}
      <group position={[-4.6, 0, 2.2]}>
        <C p={[0, 0.5, 0]} a={[0.35, 0.45, 1, 12]} c="#e7e5e4" />
        <C p={[0, 1.15, 0]} a={[0.12, 0.12, 0.9, 16]} rot={[0, 0, Math.PI / 2]} c="#fefce8" />
        <C p={[0, 1.15, 0]} a={[0.13, 0.13, 0.12, 16]} rot={[0, 0, Math.PI / 2]} c="#b91c1c" />
        <Hot i={0} at={[0, 2, 0]} />
      </group>
      {/* school bell */}
      <group position={[4.8, 0, 2]}>
        <B p={[-0.6, 1.2, 0]} s={[0.15, 2.4, 0.15]} c="#78350f" />
        <B p={[0.6, 1.2, 0]} s={[0.15, 2.4, 0.15]} c="#78350f" />
        <B p={[0, 2.45, 0]} s={[1.5, 0.15, 0.2]} c="#78350f" />
        <C p={[0, 2.05, 0]} a={[0.12, 0.38, 0.6, 16]} c="#d4a017" m={0.85} r={0.3} />
        <Hot i={1} at={[0, 3.1, 0]} />
      </group>
      {/* notice board */}
      <group position={[2.2, 0, 3]}>
        <B p={[-0.9, 0.8, 0]} s={[0.1, 1.6, 0.1]} c="#57534e" />
        <B p={[0.9, 0.8, 0]} s={[0.1, 1.6, 0.1]} c="#57534e" />
        <Panel p={[0, 1.4, 0.03]} size={[2, 1]} lines={["CERTIFIED", "Prompt Design (Google)", "Advanced Python"]} opts={{ bg: "#78350f", accent: "#fde68a" }} />
        <Hot i={2} at={[0, 2.3, 0.2]} />
      </group>
      {/* benches & books */}
      <B p={[-2.2, 0.45, 2.4]} s={[1.6, 0.1, 0.5]} c="#92400e" />
      <B p={[-2.2, 0.2, 2.4]} s={[1.4, 0.4, 0.3]} c="#57534e" />
      {["#2563eb", "#dc2626", "#16a34a", "#f59e0b"].map((col, i) => (
        <B key={col} p={[-2.6 + i * 0.05, 0.56 + i * 0.09, 2.4]} s={[0.5, 0.08, 0.35]} rot={[0, i * 0.2, 0]} c={col} />
      ))}
      <Tree p={[-6, 0, -1]} round s={1.2} />
      <Tree p={[6.2, 0, -1.5]} s={1.3} />
    </group>
  );
}

/* ================================================================== 2 · home office */

function HomeOffice() {
  const steam = useRef();
  const needle = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    steam.current?.children.forEach((s, i) => {
      const k = (t * 0.5 + i / 4) % 1;
      s.position.y = 1.15 + k * 0.7;
      s.scale.setScalar(0.04 + k * 0.08);
      s.material.opacity = 0.5 * (1 - k);
    });
    if (needle.current) needle.current.rotation.z = 0.9 - (Math.sin(t * 1.3) * 0.15 + 0.5) * 1.9;
  });
  const codeLines = ["def deliver(project):", "  ship(on_time=True)", "  return 'happy client'"];
  return (
    <group>
      {/* house */}
      <B p={[-1.5, 1.5, -3]} s={[6, 3, 4.4]} c="#f1f5f9" r={0.8} />
      <B p={[-1.5, 3.1, -3]} s={[6.4, 0.2, 4.8]} c="#334155" />
      <B p={[-1.5, 1.6, -0.79]} s={[3.4, 1.8, 0.05]} c="#0f172a" e="#fde68a" ei={0.45} shadow={false} />
      <B p={[2.2, 1.1, -0.79]} s={[0.9, 2.2, 0.05]} c="#78350f" />
      {/* deck */}
      <B p={[0.8, 0.1, 1.2]} s={[8, 0.2, 4]} c="#a16207" r={0.85} />
      {/* desk + monitor */}
      <group position={[0.8, 0.2, 1.6]}>
        <B p={[0, 0.75, 0]} s={[2.2, 0.08, 0.9]} c="#e7e5e4" />
        {[-1, 1].map((x) => (
          <B key={x} p={[x, 0.37, 0]} s={[0.06, 0.75, 0.8]} c="#334155" />
        ))}
        <B p={[0, 1.4, -0.2]} s={[1.3, 0.8, 0.06]} c="#111827" m={0.5} />
        <Panel p={[0, 1.4, -0.165]} size={[1.2, 0.7]} back={false} glow={1} lines={codeLines} opts={{ bg: "#0b1220", fg: "#86efac", accent: "#7dd3fc", border: false, size: 40 }} />
        <B p={[0, 0.95, -0.2]} s={[0.1, 0.3, 0.1]} c="#334155" />
        <B p={[-0.2, 0.81, 0.2]} s={[0.6, 0.03, 0.2]} c="#1f2937" />
        <C p={[0.75, 0.88, 0.15]} a={[0.07, 0.06, 0.16, 12]} c="#f97316" />
        <group ref={steam} position={[0.75, 0, 0.15]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
            </mesh>
          ))}
        </group>
        {/* chair */}
        <B p={[0, 0.5, 0.8]} s={[0.6, 0.08, 0.6]} c="#1e293b" />
        <B p={[0, 0.9, 1.1]} s={[0.6, 0.7, 0.08]} c="#1e293b" />
        <C p={[0, 0.25, 0.8]} a={[0.04, 0.04, 0.5, 8]} c="#64748b" />
        <Hot i={0} at={[0, 2.25, -0.2]} />
      </group>
      {/* 10+ project boxes */}
      {Array.from({ length: 10 }, (_, i) => (
        <B key={i} p={[3.6 + (i % 3) * 0.55, 0.42 + Math.floor(i / 3) * 0.45, 1.5 + (i % 2) * 0.1]} s={[0.5, 0.42, 0.5]} c={["#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"][i % 5]} r={0.6} />
      ))}
      {/* speed gauge */}
      <group position={[-3.7, 0, 2.2]}>
        <C p={[0, 0.7, 0]} a={[0.06, 0.06, 1.4, 8]} c="#334155" />
        <mesh position={[0, 1.7, 0]} castShadow>
          <torusGeometry args={[0.55, 0.06, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
        </mesh>
        <C p={[0, 1.7, -0.02]} a={[0.55, 0.55, 0.04, 32, 1, false, 0, Math.PI]} rot={[Math.PI / 2, 0, 0]} c="#0f172a" />
        <group ref={needle} position={[0, 1.7, 0.05]}>
          <B p={[0, 0.25, 0]} s={[0.04, 0.5, 0.02]} c="#ef4444" e="#ef4444" ei={0.8} shadow={false} />
        </group>
        <Hot i={1} at={[0, 2.7, 0]} />
      </group>
      {/* whiteboard */}
      <group position={[-5.4, 0, -0.4]} rotation={[0, 0.5, 0]}>
        <B p={[-0.8, 0.8, 0]} s={[0.06, 1.6, 0.06]} c="#94a3b8" m={0.6} />
        <B p={[0.8, 0.8, 0]} s={[0.06, 1.6, 0.06]} c="#94a3b8" m={0.6} />
        <Panel p={[0, 1.45, 0.04]} size={[1.8, 1.1]} lines={["API DESIGN", "scale · mentor · consult"]} opts={{ bg: "#f8fafc", fg: "#0f172a", accent: "#2563eb" }} glow={0.15} />
        <Hot i={2} at={[0, 2.4, 0.2]} />
      </group>
      <Tree p={[5.6, 0, -2.5]} round />
      <C p={[-0.2, 0.45, 2.9]} a={[0.25, 0.2, 0.5, 12]} c="#b45309" />
      <mesh position={[-0.2, 0.95, 2.9]} castShadow>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color="#15803d" flatShading />
      </mesh>
    </group>
  );
}

/* ================================================================== 3 · home-care platform */

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(-0.1, -0.35, -0.6, -0.1, -0.6, 0.2);
  s.bezierCurveTo(-0.6, 0.5, -0.2, 0.6, 0, 0.35);
  s.bezierCurveTo(0.2, 0.6, 0.6, 0.5, 0.6, 0.2);
  s.bezierCurveTo(0.6, -0.1, 0.1, -0.35, 0, -0.5);
  return s;
}

// A coarse grid shaped (loosely) like the contiguous US; ~90% of cells "covered".
const US_ROWS = ["..XXXXXXXXXXX.", ".XXXXXXXXXXXXX", "XXXXXXXXXXXXXX", "XXXXXXXXXXXXX.", ".XXXXXXXXXXXX.", "..XXX.XXXXXX..", ".......XX..XX."];

function HomeCare() {
  const { toggle } = useStation();
  const heart = useRef();
  const arm = useRef();
  const grid = useRef();
  const screen = useRef();
  const heartGeo = useMemo(() => new THREE.ExtrudeGeometry(heartShape(), { depth: 0.15, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }), []);
  const cells = useMemo(() => {
    const r = seeded(13);
    const out = [];
    US_ROWS.forEach((row, z) => [...row].forEach((ch, x) => ch === "X" && out.push({ x: x * 0.42 - 2.7, z: z * 0.42 - 1.3, on: r() < 0.9, ph: r() * 6 })));
    return out;
  }, []);
  useLayoutEffect(() => {
    cells.forEach((c, i) => grid.current.setColorAt(i, tmpCol.set(c.on ? "#2dd4bf" : "#334155")));
    grid.current.instanceColor.needsUpdate = true;
  }, [cells]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (heart.current) heart.current.scale.setScalar(1 + Math.max(0, Math.sin(t * 5)) * 0.12);
    cells.forEach((c, i) => {
      tmpObj.position.set(c.x, 0.15 + (c.on ? 0.12 + Math.sin(t * 2 + c.ph) * 0.08 : 0), c.z);
      tmpObj.scale.set(1, c.on ? 1.6 + Math.sin(t * 2 + c.ph) * 0.6 : 0.5, 1);
      tmpObj.updateMatrix();
      grid.current.setMatrixAt(i, tmpObj.matrix);
    });
    grid.current.instanceMatrix.needsUpdate = true;
    if (arm.current) {
      const a = toggle ? t * 3 : 0;
      arm.current.rotation.y = toggle ? Math.sin(a) * 0.9 : 0.3;
      arm.current.children[1].rotation.z = toggle ? -0.6 + Math.sin(a * 1.7) * 0.4 : -0.9;
    }
    if (screen.current) screen.current.emissiveIntensity = toggle ? 1.2 + Math.sin(t * 8) * 0.3 : 0.15;
  });
  return (
    <group>
      {/* care cottage */}
      <B p={[-3, 1.4, -3]} s={[4.6, 2.8, 3.6]} c="#fef3c7" r={0.85} />
      <mesh position={[-3, 3.5, -3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.5, 1.5, 4]} />
        <meshStandardMaterial color="#9f1239" roughness={0.8} />
      </mesh>
      <B p={[-3, 1, -1.18]} s={[1, 2, 0.05]} c="#7c2d12" />
      {[-4.5, -1.5].map((x) => (
        <B key={x} p={[x, 1.7, -1.18]} s={[0.9, 0.9, 0.05]} c="#0f172a" e="#fde68a" ei={0.4} shadow={false} />
      ))}
      <group ref={heart} position={[-3, 3.1, -1.05]}>
        <mesh geometry={heartGeo} castShadow>
          <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.6} roughness={0.4} />
        </mesh>
      </group>
      {/* patient records server */}
      <group position={[3, 0, -1.5]}>
        <B p={[0, 1.2, 0]} s={[1.3, 2.4, 1.1]} c="#1e293b" m={0.5} r={0.35} />
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <B key={r} p={[0, 0.4 + r * 0.33, 0.56]} s={[1.1, 0.06, 0.02]} c="#0f172a" e={r % 2 ? "#34d399" : "#38bdf8"} ei={1.2} shadow={false} />
        ))}
        <Hot i={0} at={[0, 3, 0.4]} />
      </group>
      {/* coverage map */}
      <group position={[0.2, 0, 2]}>
        <B p={[0, 0.06, 0]} s={[6.4, 0.12, 3.4]} c="#0f172a" r={0.4} />
        <instancedMesh ref={grid} args={[null, null, cells.length]} castShadow>
          <boxGeometry args={[0.34, 0.2, 0.34]} />
          <meshStandardMaterial roughness={0.4} emissive="#0d9488" emissiveIntensity={0.25} />
        </instancedMesh>
        <Hot i={1} at={[0, 1.4, 0]} />
      </group>
      {/* Selenium test robot */}
      <group position={[5.2, 0, 1.6]}>
        <C p={[0, 0.3, 0]} a={[0.5, 0.6, 0.6, 16]} c="#e2e8f0" m={0.6} r={0.3} />
        <group ref={arm} position={[0, 0.6, 0]}>
          <C p={[0, 0.6, 0]} a={[0.12, 0.14, 1.2, 12]} c="#f59e0b" m={0.3} />
          <group position={[0, 1.2, 0]}>
            <C p={[0.45, 0, 0]} a={[0.09, 0.09, 0.9, 12]} rot={[0, 0, Math.PI / 2]} c="#f59e0b" m={0.3} />
            <B p={[0.95, -0.1, 0]} s={[0.18, 0.3, 0.18]} c="#334155" />
          </group>
        </group>
        <B p={[-0.2, 0.55, 1.1]} s={[1, 0.65, 0.06]} rot={[-0.4, 0, 0]} c="#0f172a" />
        <mesh position={[-0.2, 0.56, 1.14]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.9, 0.55]} />
          <meshStandardMaterial ref={screen} color="#052e16" emissive="#22c55e" emissiveIntensity={0.15} toneMapped={false} />
        </mesh>
        <Hot i={2} at={[0, 2.8, 0]} />
      </group>
      <Tree p={[-6.2, 0, 0.5]} round />
      <Tree p={[6, 0, -3.5]} />
    </group>
  );
}

/* ================================================================== 4 · export warehouse */

function Warehouse() {
  const { toggle } = useStation();
  const boxes = useRef();
  const bubbles = useRef();
  const hands = useRef();
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    boxes.current?.children.forEach((b, i) => {
      b.position.x = ((t * 0.9 + i * 1.2) % 7.2) - 3.6;
    });
    bubbles.current?.children.forEach((b, i) => {
      const k = (t * 0.35 + i / 5) % 1;
      b.visible = toggle;
      b.position.set(Math.sin(i * 2 + t) * 0.4, 3.4 + k * 3.5, 0);
      b.scale.setScalar(0.25 + k * 0.15);
    });
    if (hands.current) hands.current.rotation.z -= dt * 2.4;
  });
  return (
    <group>
      {/* warehouse shed */}
      <B p={[-1, 2.2, -3.4]} s={[9, 4.4, 5]} c="#94a3b8" m={0.6} r={0.45} />
      <mesh position={[-1, 4.4, -3.4]} rotation={[0, 0, Math.PI / 2]} scale={[0.6, 1, 1]} castShadow>
        <cylinderGeometry args={[2.6, 2.6, 9.1, 24, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {[-3.5, 1.5].map((x) => (
        <group key={x}>
          <B p={[x, 1.5, -0.88]} s={[2.4, 3, 0.05]} c="#1f2937" e="#fbbf24" ei={0.25} shadow={false} />
          {Array.from({ length: 6 }, (_, i) => (
            <B key={i} p={[x, 2.2 + i * 0.13, -0.85]} s={[2.4, 0.04, 0.03]} c="#cbd5e1" m={0.6} shadow={false} />
          ))}
        </group>
      ))}
      <Panel p={[-1, 3.9, -0.85]} size={[3.2, 0.7]} lines={["EXPORT HUB"]} opts={{ w: 512, h: 112, bg: "#0f172a", accent: "#fbbf24", size: 70 }} />
      {/* conveyor */}
      <group position={[-1, 0, 1.2]}>
        <B p={[0, 0.55, 0]} s={[7.6, 0.12, 1]} c="#1f2937" r={0.4} />
        {[-3.4, -1.1, 1.1, 3.4].map((x) => (
          <B key={x} p={[x, 0.25, 0]} s={[0.12, 0.5, 0.9]} c="#475569" m={0.5} />
        ))}
        <group ref={boxes}>
          {Array.from({ length: 6 }, (_, i) => (
            <B key={i} p={[0, 0.83, 0]} s={[0.55, 0.45, 0.55]} c="#c2884a" r={0.9} />
          ))}
        </group>
      </group>
      {/* containers */}
      <group position={[5.2, 0, -1.6]}>
        {[
          [0, 0.65, 0, "#ea580c"],
          [0, 0.65, 1.5, "#2563eb"],
          [0, 1.95, 0.75, "#16a34a"],
          [0, 0.65, -1.5, "#dc2626"],
        ].map(([x, y, z, col], i) => (
          <B key={i} p={[x, y, z]} s={[3, 1.3, 1.4]} c={col} m={0.4} r={0.5} />
        ))}
        <Hot i={2} at={[0, 3.4, 0.75]} />
      </group>
      {/* scheduler clock */}
      <group position={[-5.4, 0, 2.4]}>
        <C p={[0, 1.3, 0]} a={[0.08, 0.1, 2.6, 8]} c="#334155" m={0.6} />
        <C p={[0, 2.8, 0]} a={[0.6, 0.6, 0.12, 32]} rot={[Math.PI / 2, 0, 0]} c="#f8fafc" e="#fef9c3" ei={0.3} />
        <group ref={hands} position={[0, 2.8, 0.08]}>
          <B p={[0, 0.2, 0]} s={[0.05, 0.42, 0.02]} c="#0f172a" shadow={false} />
        </group>
        <Hot i={0} at={[0, 3.8, 0]} />
      </group>
      {/* message mast */}
      <group position={[2.6, 0, 2.6]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.3, 3.2, 4, 4, true]} />
          <meshStandardMaterial color="#cbd5e1" wireframe />
        </mesh>
        <C p={[0, 3.25, 0]} a={[0.12, 0.12, 0.12, 12]} c="#22c55e" e="#22c55e" ei={1.5} />
        <group ref={bubbles}>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} scale={0.3}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.8} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
        <Hot i={1} at={[0.8, 2.4, 0]} />
      </group>
      {/* delivery truck */}
      <group position={[-5.6, 0, -0.2]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 1.1, -0.6]} s={[1.5, 1.7, 2.6]} c="#f8fafc" />
        <B p={[0, 0.9, 1.2]} s={[1.5, 1.3, 1]} c="#0ea5e9" m={0.3} r={0.4} />
        {[-0.9, 1.1].map((z) => [-0.75, 0.75].map((x) => <C key={`${x}${z}`} p={[x, 0.32, z]} a={[0.32, 0.32, 0.22, 14]} rot={[0, 0, Math.PI / 2]} c="#111827" />))}
      </group>
    </group>
  );
}

/* ================================================================== 5 · data center */

function DataCenter() {
  const { toggle, quality } = useStation();
  const leds = useRef();
  const flow = useRef();
  const N = quality === "low" ? 90 : 220;
  const ledCount = 6 * 2 * 8;
  const seeds = useMemo(() => {
    const r = seeded(21);
    return Array.from({ length: N }, () => [r(), r() - 0.5, r() - 0.5, r()]);
  }, [N]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (leds.current) {
      for (let i = 0; i < ledCount; i++) {
        const on = Math.sin(t * (3 + (i % 7)) + i * 1.7) > 0.2;
        leds.current.setColorAt(i, tmpCol.set(on ? (i % 5 ? "#22d3ee" : "#f59e0b") : "#0f172a"));
      }
      leds.current.instanceColor.needsUpdate = true;
    }
    if (flow.current) {
      const speed = toggle ? 2.6 : 0.9;
      seeds.forEach(([u, dy, dz, w], i) => {
        // path: intake (x=-6.5) → tube → queue tank (x=1) → fan out to 4 workers (x=2.5..5.5)
        const k = (u + t * speed * (0.12 + w * 0.05)) % 1;
        let x;
        let y = 1.3 + dy * 0.35;
        let z = 1.6 + dz * 0.35;
        if (k < 0.7) x = -6.5 + (k / 0.7) * 7.5;
        else {
          const f = (k - 0.7) / 0.3;
          const lane = Math.floor(w * 4);
          x = 1 + f * (2 + lane * 1.1);
          y = 1.3 + f * (0.4 - lane * 0.1);
          z = 1.6 - f * 1.6 * (lane % 2 ? 1 : -0.4);
        }
        tmpObj.position.set(x, y, z);
        tmpObj.scale.setScalar(toggle ? 0.075 : 0.06);
        tmpObj.updateMatrix();
        flow.current.setMatrixAt(i, tmpObj.matrix);
      });
      flow.current.instanceMatrix.needsUpdate = true;
    }
  });
  useLayoutEffect(() => {
    let i = 0;
    for (let row = 0; row < 2; row++)
      for (let k = 0; k < 6; k++)
        for (let l = 0; l < 8; l++) {
          tmpObj.position.set(-4 + k * 1.4, 0.45 + l * 0.25, -3.3 + row * 1.8 + 0.42);
          tmpObj.scale.set(1, 1, 1);
          tmpObj.updateMatrix();
          leds.current.setMatrixAt(i++, tmpObj.matrix);
        }
    leds.current.instanceMatrix.needsUpdate = true;
  }, []);
  const plugColors = useMemo(() => Array.from({ length: 25 }, (_, i) => `hsl(${(i * 37) % 360}, 70%, 55%)`), []);
  return (
    <group>
      {/* hall */}
      <B p={[0, 0.08, -3]} s={[11, 0.16, 5.6]} c="#334155" r={0.4} />
      <B p={[0, 2.6, -5.6]} s={[11, 5.2, 0.4]} c="#0f172a" m={0.5} r={0.4} />
      <B p={[0, 5.3, -3.2]} s={[11.4, 0.3, 5.2]} c="#1e293b" m={0.5} />
      {[-5.4, 5.4].map((x) => (
        <B key={x} p={[x, 2.6, -3]} s={[0.3, 5.2, 5.6]} c="#1e293b" m={0.5} />
      ))}
      {/* racks */}
      {[0, 1].map((row) =>
        Array.from({ length: 6 }, (_, k) => <B key={`${row}${k}`} p={[-4 + k * 1.4, 1.2, -3.3 + row * 1.8]} s={[1, 2.4, 0.8]} c="#111827" m={0.6} r={0.3} />)
      )}
      <instancedMesh ref={leds} args={[null, null, ledCount]}>
        <boxGeometry args={[0.8, 0.04, 0.02]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <Panel p={[0, 4.4, -5.35]} size={[6.4, 1.3]} lines={["300K+ EVENTS / MIN", "1M+ users · 7K+ jobs / day · 25+ plugins"]} opts={{ w: 1024, h: 208, bg: "#020617", accent: "#22d3ee", size: 86 }} glow={1} />
      {/* event pipeline: glass tube, RabbitMQ-style queue tank, Celery workers, Redis cache */}
      <mesh position={[-2.75, 1.3, 1.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.32, 0.32, 7.5, 20, 1, true]} />
        <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.22} roughness={0.05} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <C p={[1.2, 1.1, 1.6]} a={[0.55, 0.55, 2.2, 20]} c="#f97316" m={0.5} r={0.3} />
      {[0, 1, 2, 3].map((l) => (
        <group key={l} position={[3.1 + l * 1.1, 0, 1.6 - 1.6 * (l % 2 ? 1 : -0.4)]}>
          <B p={[0, 0.8, 0]} s={[0.7, 1.6, 0.7]} c="#14532d" m={0.3} r={0.4} />
          <B p={[0, 1.35, 0.36]} s={[0.4, 0.12, 0.02]} c="#052e16" e="#4ade80" ei={toggle ? 2 : 1} shadow={false} />
        </group>
      ))}
      <B p={[-6.6, 1.3, 1.6]} s={[0.6, 1.4, 1.2]} c="#475569" m={0.5} />
      <instancedMesh ref={flow} args={[null, null, N]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={toggle ? "#fde047" : "#67e8f9"} toneMapped={false} />
      </instancedMesh>
      <Hot i={0} at={[-2.5, 2.4, 1.6]} />
      {/* plugin rack */}
      <group position={[-5.6, 0, 3.4]}>
        <B p={[0, 1, 0]} s={[1.8, 2, 0.5]} c="#1e293b" m={0.5} />
        {plugColors.map((col, i) => (
          <B key={i} p={[-0.64 + (i % 5) * 0.32, 0.35 + Math.floor(i / 5) * 0.35, 0.27]} s={[0.24, 0.24, 0.06]} c={col} e={col} ei={0.5} shadow={false} />
        ))}
        <Hot i={1} at={[0, 2.6, 0]} />
      </group>
      {/* cloud stack */}
      <group position={[4.6, 0, 3.6]}>
        {[
          ["AWS", "#f59e0b", -1.1],
          ["GCP", "#3b82f6", 0],
          ["Azure", "#0ea5e9", 1.1],
        ].map(([name, col, x], i) => (
          <group key={name} position={[x, 2.6 + i * 0.25, 0]}>
            <mesh castShadow>
              <icosahedronGeometry args={[0.45, 1]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} flatShading />
            </mesh>
            <Panel p={[0, -0.75, 0]} size={[0.9, 0.35]} lines={[name]} opts={{ w: 256, h: 96, bg: col, fg: "#ffffff", border: false, size: 56 }} back={false} glow={0.8} />
          </group>
        ))}
        <B p={[0, 0.5, 0]} s={[1.2, 1, 0.8]} c="#475569" m={0.4} />
        <Hot i={2} at={[0, 3.9, 0]} />
      </group>
      {/* team table */}
      <group position={[0.6, 0, 3.8]}>
        <C p={[0, 0.75, 0]} a={[0.9, 0.9, 0.08, 24]} c="#e7e5e4" />
        <C p={[0, 0.37, 0]} a={[0.08, 0.15, 0.75, 10]} c="#334155" />
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return <B key={i} p={[Math.cos(a) * 1.25, 0.45, Math.sin(a) * 1.25]} s={[0.45, 0.08, 0.45]} c="#38bdf8" />;
        })}
        <Hot i={3} at={[0, 1.9, 0]} />
      </group>
    </group>
  );
}

/* ================================================================== 6 · AI governance gateway */

function Gateway() {
  const { toggle, quality } = useStation();
  const reqs = useRef();
  const beam = useRef();
  const orb = useRef();
  const docs = useRef();
  const N = quality === "low" ? 40 : 80;
  const seeds = useMemo(() => {
    const r = seeded(8);
    return Array.from({ length: N }, (_, i) => ({ u: r(), lane: i % 3, risky: r() < 0.25, sp: 0.09 + r() * 0.05 }));
  }, [N]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beam.current) beam.current.position.y = 1.6 + Math.sin(t * 2.2) * 1.2;
    if (orb.current) {
      orb.current.rotation.y = t * 0.6;
      orb.current.rotation.x = t * 0.3;
    }
    docs.current?.children.forEach((d, i) => {
      const a = t * 0.5 + (i / 5) * Math.PI * 2;
      d.position.set(-2.4 + Math.cos(a) * 1.1, 3 + Math.sin(a * 2) * 0.2, -1.8 + Math.sin(a) * 0.6);
      d.rotation.y = -a;
    });
    if (reqs.current) {
      seeds.forEach((s, i) => {
        const k = (s.u + t * s.sp) % 1;
        // laptops at x=-5.2 → gate at x=0 → model orb at x=5
        let x = -5 + k * 10;
        const z = 1.6 + (s.lane - 1) * 0.5 * (1 - Math.min(1, Math.abs(x) / 5));
        let y = 1.2 + Math.sin(k * Math.PI) * 0.6;
        let scale = 0.09;
        let col = "#93c5fd";
        if (x > -0.2) {
          if (s.risky && toggle) {
            // blocked at the gate: falls into the bin
            x = -0.2;
            y = Math.max(0.15, 1.6 - (k - 0.48) * 9);
            scale = 0.09 * Math.max(0, 1 - (k - 0.48) * 3);
            col = "#ef4444";
          } else col = s.risky ? "#f59e0b" : "#4ade80";
        }
        tmpObj.position.set(x, y, z);
        tmpObj.scale.setScalar(scale);
        tmpObj.updateMatrix();
        reqs.current.setMatrixAt(i, tmpObj.matrix);
        reqs.current.setColorAt(i, tmpCol.set(col));
      });
      reqs.current.instanceMatrix.needsUpdate = true;
      reqs.current.instanceColor.needsUpdate = true;
    }
  });
  return (
    <group>
      {/* glass HQ */}
      <B p={[0, 0.15, -4.8]} s={[8, 0.3, 4]} c="#e2e8f0" r={0.5} />
      <mesh position={[0, 3.6, -5]} castShadow receiveShadow>
        <boxGeometry args={[6, 6.8, 3]} />
        <meshPhysicalMaterial color="#7dd3fc" metalness={0.9} roughness={0.08} clearcoat={1} envMapIntensity={1.6} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <B key={i} p={[0, 0.8 + i * 0.95, -3.48]} s={[6.05, 0.06, 0.05]} c="#e2e8f0" m={0.8} r={0.2} shadow={false} />
      ))}
      <mesh position={[0, 7.4, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.08, 10, 40]} />
        <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* IDE laptops */}
      {[-0.5, 0, 0.5].map((dz, i) => (
        <group key={i} position={[-5.4, 0, 1.6 + dz * 2]}>
          <B p={[0, 0.45, 0]} s={[0.9, 0.9, 0.6]} c="#334155" />
          <B p={[0, 0.92, 0]} s={[0.6, 0.03, 0.4]} c="#94a3b8" m={0.7} r={0.3} />
          <B p={[0, 1.1, -0.18]} s={[0.6, 0.38, 0.03]} rot={[-0.25, 0, 0]} c="#0f172a" e="#60a5fa" ei={0.9} />
        </group>
      ))}
      {/* policy gate */}
      <group position={[0, 0, 1.6]}>
        {[-1.7, 1.7].map((zz) => (
          <B key={zz} p={[0, 1.6, zz]} s={[0.4, 3.2, 0.4]} c="#e2e8f0" m={0.7} r={0.25} />
        ))}
        <B p={[0, 3.35, 0]} s={[0.5, 0.35, 3.8]} c="#e2e8f0" m={0.7} r={0.25} />
        <B p={[0.26, 3.35, 0]} s={[0.02, 0.2, 3]} c="#831843" e={toggle ? "#ef4444" : "#f59e0b"} ei={1.6} shadow={false} />
        <mesh ref={beam} position={[0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[3, 0.08]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.85} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[3, 3]} />
          <meshBasicMaterial color={toggle ? "#f472b6" : "#fbbf24"} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <C p={[-0.2, 0.25, 2.3]} a={[0.35, 0.3, 0.5, 14]} c="#7f1d1d" />
        <Hot i={0} at={[0, 4.2, 0]} />
      </group>
      <instancedMesh ref={reqs} args={[null, null, N]} frustumCulled={false}>
        <boxGeometry args={[1.4, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {/* model orb */}
      <group position={[5.4, 1.7, 1.6]}>
        <mesh ref={orb}>
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={1.2} wireframe toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.45, 24, 16]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <C p={[0, -1.15, 0]} a={[0.4, 0.55, 0.7, 16]} c="#e2e8f0" m={0.6} r={0.3} />
      </group>
      {/* context library */}
      <group ref={docs}>
        {Array.from({ length: 5 }, (_, i) => (
          <B key={i} s={[0.5, 0.65, 0.03]} c="#f8fafc" e="#e0f2fe" ei={0.3} />
        ))}
      </group>
      <Hot i={1} at={[-2.4, 4, -1.8]} />
      {/* observability wall */}
      <group position={[4.4, 0, -2]} rotation={[0, -0.35, 0]}>
        <B p={[0, 0.9, 0]} s={[0.15, 1.8, 0.15]} c="#334155" />
        <Panel p={[0, 2.1, 0.1]} size={[2.6, 1.4]} lines={["OBSERVABILITY", "▁▃▅▇▅▃▂▄▆█▆▄", "p95 · errors · policy hits"]} opts={{ bg: "#020617", accent: "#f472b6", fg: "#e2e8f0" }} glow={0.9} />
        <Hot i={2} at={[0, 3.2, 0.2]} />
      </group>
      {/* founder's desk */}
      <group position={[-4.6, 0, -1.6]}>
        <B p={[0, 0.75, 0]} s={[1.8, 0.08, 0.9]} c="#78350f" r={0.5} />
        <B p={[0, 0.37, 0]} s={[1.6, 0.74, 0.7]} c="#451a03" />
        {[-0.5, 0.5].map((x) => (
          <B key={x} p={[x, 0.45, 0.9]} s={[0.5, 0.9, 0.5]} c="#1e293b" />
        ))}
        <Hot i={3} at={[0, 1.8, 0]} />
      </group>
    </group>
  );
}

/* ================================================================== 7 · projects gallery */

const SHAPES = [
  <torusKnotGeometry key="k" args={[0.32, 0.11, 80, 12]} />,
  <icosahedronGeometry key="i" args={[0.45, 0]} />,
  <octahedronGeometry key="o" args={[0.45, 0]} />,
  <torusGeometry key="t" args={[0.36, 0.13, 12, 32]} />,
  <dodecahedronGeometry key="d" args={[0.42, 0]} />,
  <boxGeometry key="b" args={[0.55, 0.55, 0.55]} />,
];
const GALLERY_COLORS = ["#38bdf8", "#f472b6", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];

function Gallery() {
  const holos = useRef();
  useFrame(({ clock }) => {
    holos.current?.children.forEach((h, i) => {
      h.rotation.y = clock.elapsedTime * 0.8 + i;
      h.rotation.x = Math.sin(clock.elapsedTime * 0.6 + i) * 0.4;
      h.position.y = 2 + Math.sin(clock.elapsedTime * 1.4 + i) * 0.12;
    });
  });
  const spots = profile.projects.map((_, i) => {
    const a = Math.PI * (0.15 + (i / (profile.projects.length - 1)) * 0.7);
    return [Math.cos(a) * 5.2, -Math.sin(a) * 4.6 + 1.5];
  });
  return (
    <group>
      <C p={[0, 0.1, -1]} a={[6.8, 6.8, 0.2, 48]} c="#1e293b" r={0.3} m={0.3} />
      <B p={[0, 2.2, -5.6]} s={[9, 4.4, 0.4]} c="#f8fafc" r={0.6} />
      <Panel p={[0, 3.6, -5.35]} size={[5, 0.9]} lines={["PROJECTS & SYSTEMS"]} opts={{ w: 1024, h: 180, bg: "#0f172a", accent: "#34d399", size: 96 }} />
      <group ref={holos}>
        {spots.map(([x, z], i) => (
          <mesh key={i} position={[x, 2, z]} castShadow>
            {SHAPES[i % SHAPES.length]}
            <meshStandardMaterial color={GALLERY_COLORS[i]} emissive={GALLERY_COLORS[i]} emissiveIntensity={0.7} metalness={0.5} roughness={0.2} />
          </mesh>
        ))}
      </group>
      {spots.map(([x, z], i) => {
        const p = profile.projects[i];
        const face = Math.atan2(-x, 4 - z);
        return (
          <group key={p.id} position={[x, 0, z]}>
            <C p={[0, 0.65, 0]} a={[0.45, 0.55, 1.1, 20]} c="#e2e8f0" m={0.2} r={0.3} />
            <C p={[0, 1.22, 0]} a={[0.5, 0.5, 0.05, 24]} c={GALLERY_COLORS[i]} e={GALLERY_COLORS[i]} ei={1.2} />
            <Panel p={[Math.sin(face) * 0.62, 0.65, Math.cos(face) * 0.62]} rot={[0, face, 0]} size={[0.95, 0.42]} lines={[p.name.split(" (")[0]]} opts={{ w: 512, h: 224, bg: "#0f172a", accent: GALLERY_COLORS[i], size: 62 }} back={false} />
            <Hot i={i} at={[0, 3, 0]} />
          </group>
        );
      })}
    </group>
  );
}

/* ================================================================== 8 · skill garden */

const SKILL_COLORS = ["#38bdf8", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb923c", "#22d3ee", "#e879f9"];

function SkillGarden() {
  const orbs = useRef();
  const groups = Object.entries(profile.skills);
  useFrame(({ clock }) => {
    orbs.current?.children.forEach((o, i) => {
      const a = clock.elapsedTime * 0.4 + i * 0.7;
      o.position.set(Math.cos(a) * (3 + (i % 3)), 3 + Math.sin(a * 1.3) * 1.2, -1 + Math.sin(a) * 3);
    });
  });
  return (
    <group>
      {groups.map(([name, items], i) => {
        const row = i < 4 ? 0 : 1;
        const x = -5.1 + (i % 4) * 3.4;
        const z = row ? 2 : -2.6;
        const h = 0.6 + items.length * 0.42;
        return (
          <group key={name} position={[x, 0, z]}>
            <C p={[0, 0.15, 0]} a={[0.9, 1, 0.3, 6]} c="#e7e5e4" />
            <mesh position={[0, 0.3 + h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.38, 0.55, h, 6]} />
              <meshPhysicalMaterial color={SKILL_COLORS[i]} emissive={SKILL_COLORS[i]} emissiveIntensity={0.45} roughness={0.15} metalness={0.1} clearcoat={1} transparent opacity={0.92} />
            </mesh>
            <mesh position={[0, 0.5 + h, 0]} castShadow>
              <octahedronGeometry args={[0.38, 0]} />
              <meshStandardMaterial color={SKILL_COLORS[i]} emissive={SKILL_COLORS[i]} emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
            <Panel p={[0, 0.55, 1.05]} size={[1.7, 0.42]} rot={[-0.3, 0, 0]} lines={[name]} opts={{ w: 512, h: 128, bg: "#0f172a", accent: SKILL_COLORS[i], size: 52 }} back={false} />
            <Hot i={i} at={[0, 1.7, 1.1]} />
          </group>
        );
      })}
      <group ref={orbs}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={SKILL_COLORS[i % 8]} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ================================================================== 9 · services studio & observatory */

function Studio() {
  const dome = useRef();
  useFrame((_, dt) => {
    if (dome.current) dome.current.rotation.y += dt * 0.15;
  });
  const colors = ["#fbbf24", "#f472b6", "#34d399", "#38bdf8"];
  return (
    <group>
      {/* studio */}
      <B p={[-3, 1.5, -3.2]} s={[5, 3, 3.6]} c="#fef3c7" r={0.85} />
      <B p={[-3, 3.15, -3.2]} s={[5.4, 0.3, 4]} c="#78350f" />
      <Panel p={[-3, 2.3, -1.35]} size={[3.6, 0.8]} lines={["SERVICES STUDIO"]} opts={{ w: 1024, h: 200, bg: "#78350f", fg: "#fffbeb", accent: "#fbbf24", size: 92 }} />
      {/* kiosks */}
      {profile.services.map((s, i) => {
        const x = -5.4 + i * 2.5;
        return (
          <group key={s.name} position={[x, 0, 1.6]}>
            <B p={[0, 0.55, 0]} s={[1.6, 1.1, 0.8]} c="#f8fafc" />
            {[-0.7, 0.7].map((dx) => (
              <B key={dx} p={[dx, 1.5, -0.3]} s={[0.06, 1.9, 0.06]} c="#64748b" />
            ))}
            <B p={[0, 2.45, 0]} s={[1.9, 0.08, 1.2]} rot={[0.25, 0, 0]} c={colors[i]} />
            <Panel p={[0, 0.65, 0.41]} size={[1.4, 0.5]} lines={[s.name.split(" ")[0] + " " + (s.name.split(" ")[1] || "")]} opts={{ w: 512, h: 180, bg: "#0f172a", accent: colors[i], size: 54 }} back={false} />
            <Hot i={i} at={[0, 3.1, 0]} />
          </group>
        );
      })}
      {/* observatory */}
      <group position={[4, 0, -2.8]}>
        <C p={[0, 1.2, 0]} a={[1.7, 1.8, 2.4, 24]} c="#e2e8f0" r={0.6} />
        <group ref={dome} position={[0, 2.4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[1.75, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
          </mesh>
          <C p={[0.6, 1, 0.9]} a={[0.22, 0.3, 2.2, 16]} rot={[0.9, 0, -0.4]} c="#334155" m={0.6} r={0.3} />
        </group>
        <Hot i={4} at={[0, 5.2, 0.6]} />
      </group>
      <Tree p={[6.6, 0, 1.5]} round />
    </group>
  );
}

/* ================================================================== 10 · finale */

function Finale() {
  const { active, quality } = useStation();
  const rings = useRef();
  const sparks = useRef();
  const N = quality === "low" ? 120 : 260;
  const seeds = useMemo(() => {
    const r = seeded(4);
    return Array.from({ length: N }, () => [r() * Math.PI * 2, r() * 2 - 1, 0.5 + r(), Math.floor(r() * 5), r()]);
  }, [N]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (rings.current) rings.current.rotation.y = t * 0.15;
    const sp = sparks.current;
    if (!sp) return;
    sp.visible = active;
    if (!active) return;
    seeds.forEach(([a, b, s, burst, ph], i) => {
      const period = 3.2;
      const k = ((t + burst * 0.64) % period) / period;
      const center = [Math.cos(burst * 1.3) * 7, 14 + (burst % 3) * 2.5, -4 + Math.sin(burst * 2) * 5];
      const rad = k * 6 * s;
      const elev = Math.asin(b);
      tmpObj.position.set(center[0] + Math.cos(a) * Math.cos(elev) * rad, center[1] + Math.sin(elev) * rad - k * k * 3, center[2] + Math.sin(a) * Math.cos(elev) * rad);
      tmpObj.scale.setScalar(0.09 * (1 - k));
      tmpObj.updateMatrix();
      sp.setMatrixAt(i, tmpObj.matrix);
      sp.setColorAt(i, tmpCol.setHSL((burst * 0.21 + ph * 0.05) % 1, 0.9, 0.65));
    });
    sp.instanceMatrix.needsUpdate = true;
    sp.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      {/* stepped monument */}
      {[0, 1, 2].map((i) => (
        <C key={i} p={[0, 0.2 + i * 0.4, 0]} a={[3 - i * 0.7, 3.2 - i * 0.7, 0.4, 8]} c="#d6d3d1" r={0.7} />
      ))}
      <mesh position={[0, 4.6, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.8, 7, 4]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 8.7, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 8.7, 0]} color="#fbbf24" intensity={160} distance={45} />
      <pointLight position={[0, 1.5, 6]} color="#fde68a" intensity={60} distance={22} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <C key={i} p={[Math.cos(a) * 11.6, 0.15, Math.sin(a) * 11.6]} a={[0.18, 0.22, 0.3, 10]} c="#fef3c7" e="#fde68a" ei={2.5} shadow={false} />;
      })}
      <group ref={rings} position={[0, 4.5, 0]}>
        {profile.metrics.map((m, i) => {
          const a = (i / profile.metrics.length) * Math.PI * 2;
          return (
            <Panel
              key={m.label}
              p={[Math.cos(a) * 4.2, (i % 2) * 0.9, Math.sin(a) * 4.2]}
              rot={[0, -a + Math.PI / 2, 0]}
              size={[2.4, 1]}
              lines={[m.value, m.label]}
              opts={{ w: 512, h: 220, bg: "#0f172a", accent: "#fbbf24", size: 86 }}
              glow={0.9}
            />
          );
        })}
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 8, 0, 4]}>
          <C p={[0, 2.5, 0]} a={[0.06, 0.08, 5, 8]} c="#e2e8f0" m={0.7} />
          <B p={[s * -0.7, 4.4, 0]} s={[1.4, 0.8, 0.03]} c={s > 0 ? "#38bdf8" : "#a78bfa"} e={s > 0 ? "#38bdf8" : "#a78bfa"} ei={0.4} />
        </group>
      ))}
      <instancedMesh ref={sparks} args={[null, null, N]} frustumCulled={false} visible={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export const DIORAMAS = {
  campus: Campus,
  homeOffice: HomeOffice,
  homeCare: HomeCare,
  warehouse: Warehouse,
  dataCenter: DataCenter,
  gateway: Gateway,
  gallery: Gallery,
  skillGarden: SkillGarden,
  studio: Studio,
  finale: Finale,
};
