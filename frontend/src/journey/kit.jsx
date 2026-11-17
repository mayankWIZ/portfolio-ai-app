// Small building blocks shared by the dioramas: primitives, painted text panels, hotspots.
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CHAPTERS } from "./chapters";
import { hotspotKey, hotspots } from "./store";

export const StationCtx = createContext(null);
export const useStation = () => useContext(StationCtx);

/** Box with a standard PBR material. `e` makes it glow. */
export function B({ p = [0, 0, 0], s = [1, 1, 1], c = "#ffffff", r = 0.7, m = 0, e, ei = 1, rot, shadow = true, ...rest }) {
  return (
    <mesh position={p} rotation={rot} castShadow={shadow} receiveShadow={shadow} {...rest}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e || "#000000"} emissiveIntensity={e ? ei : 0} toneMapped={!e} />
    </mesh>
  );
}

/** Cylinder: a = [radiusTop, radiusBottom, height, segments]. */
export function C({ p = [0, 0, 0], a = [0.5, 0.5, 1, 16], c = "#ffffff", r = 0.6, m = 0, e, ei = 1, rot, shadow = true, ...rest }) {
  return (
    <mesh position={p} rotation={rot} castShadow={shadow} receiveShadow={shadow} {...rest}>
      <cylinderGeometry args={a} />
      <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e || "#000000"} emissiveIntensity={e ? ei : 0} toneMapped={!e} />
    </mesh>
  );
}

/** A canvas-painted text texture (no font fetching: system fonts only). */
export function useTextTexture(lines, { w = 512, h = 256, bg = "#0f172a", fg = "#f8fafc", accent = "#38bdf8", border = true, size = 54 } = {}) {
  const key = JSON.stringify([lines, w, h, bg, fg, accent, border, size]);
  const tex = useMemo(() => {
    const [ls, W, H, BG, FG, AC, BO, SZ] = JSON.parse(key);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = BG;
    g.fillRect(0, 0, W, H);
    if (BO) {
      g.strokeStyle = AC;
      g.lineWidth = 10;
      g.strokeRect(5, 5, W - 10, H - 10);
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    const lh = H / (ls.length + 0.6);
    ls.forEach((line, i) => {
      const big = i === 0;
      let fs = big ? SZ : SZ * 0.6;
      g.font = `${big ? 700 : 500} ${fs}px Inter, system-ui, sans-serif`;
      while (g.measureText(line).width > W - 40 && fs > 10) {
        fs -= 2;
        g.font = `${big ? 700 : 500} ${fs}px Inter, system-ui, sans-serif`;
      }
      g.fillStyle = big ? FG : AC;
      g.fillText(line, W / 2, lh * (i + 0.8));
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [key]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** A flat panel showing painted text. */
export function Panel({ lines, p, rot, size = [2, 1], glow = 0.6, opts, back = true }) {
  const map = useTextTexture(lines, opts);
  return (
    <group position={p} rotation={rot}>
      <mesh>
        <planeGeometry args={size} />
        <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={glow} roughness={0.5} toneMapped={false} />
      </mesh>
      {back && (
        <mesh position={[0, 0, -0.03]} castShadow>
          <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, 0.05]} />
          <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.4} />
        </mesh>
      )}
    </group>
  );
}

const _p = new THREE.Vector3();

/** An inspectable object marker. Registers its world position so the player can find it. */
export function Hot({ i, at }) {
  const st = useStation();
  const key = hotspotKey(st.index, i);
  const done = st.revealed.has(key);
  const group = useRef();
  const gem = useRef();
  useEffect(() => () => hotspots.delete(key), [key]);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    if (!hotspots.has(key)) {
      g.updateWorldMatrix(true, false);
      g.getWorldPosition(_p);
      hotspots.set(key, { chapter: st.index, index: i, label: CHAPTERS[st.index].inspect[i]?.label, pos: _p.clone() });
    }
    const t = clock.elapsedTime;
    if (gem.current) {
      gem.current.rotation.y = t * 1.6;
      gem.current.position.y = Math.sin(t * 2.2 + i) * 0.1;
      const s = st.near === key ? 1.5 : 1;
      gem.current.scale.lerp(_p.set(s, s, s), 0.2);
    }
  });
  const color = done ? "#4ade80" : st.color;
  return (
    <group ref={group} position={at}>
      <group ref={gem}>
        <mesh>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={done ? 1 : 2.2} toneMapped={false} />
        </mesh>
      </group>
      {!done && (
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.4, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
      {/* generous invisible hit target for mouse/touch */}
      <mesh
        onClick={(e) => {
          if (e.delta > 8) return;
          e.stopPropagation();
          st.onInspect(key);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Plain low-poly tree for dressing dioramas. */
export function Tree({ p, s = 1, round }) {
  return (
    <group position={p} scale={s}>
      <C p={[0, 0.6, 0]} a={[0.1, 0.15, 1.2, 6]} c="#5b3a1e" r={1} />
      {round ? (
        <mesh position={[0, 1.8, 0]} castShadow>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color="#4d7c0f" roughness={0.9} flatShading />
        </mesh>
      ) : (
        <mesh position={[0, 2, 0]} castShadow>
          <coneGeometry args={[0.8, 2.2, 7]} />
          <meshStandardMaterial color="#166534" roughness={0.9} flatShading />
        </mesh>
      )}
    </group>
  );
}
