// 3D side of the mini-games: collectible commits along the road and Event Rush orbs.
// Positions are registered in `pickups`; the player collects them by touching (and jumping).
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { pickups } from "./store";
import { COMMITS } from "./world";

const o = new THREE.Object3D();

function useRegister(items, taken) {
  useEffect(() => {
    for (const it of items) {
      if (taken.has(it.id)) pickups.delete(it.id);
      else pickups.set(it.id, { x: it.x, y: it.y, z: it.z });
    }
    return () => items.forEach((it) => pickups.delete(it.id));
  }, [items, taken]);
}

/** Spinning gold tokens; high ones get a faint pillar so you know to jump. */
export function Commits({ taken }) {
  const coins = useRef();
  const glows = useRef();
  useRegister(COMMITS, taken);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    COMMITS.forEach((c, i) => {
      const gone = taken.has(c.id);
      o.position.set(c.x, c.y + Math.sin(t * 2 + i) * 0.12, c.z);
      o.rotation.set(Math.PI / 2, 0, t * 2.4 + i);
      o.scale.setScalar(gone ? 0 : 1);
      o.updateMatrix();
      coins.current.setMatrixAt(i, o.matrix);
      o.rotation.set(0, 0, 0);
      o.position.set(c.x, c.y / 2, c.z);
      o.scale.set(gone || !c.high ? 0 : 1, c.y, gone || !c.high ? 0 : 1);
      o.updateMatrix();
      glows.current.setMatrixAt(i, o.matrix);
    });
    coins.current.instanceMatrix.needsUpdate = true;
    glows.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={coins} args={[null, null, COMMITS.length]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 20]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.9} metalness={0.8} roughness={0.25} />
      </instancedMesh>
      <instancedMesh ref={glows} args={[null, null, COMMITS.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.05, 0.05, 1, 6]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** Event Rush: glowing event packets to grab before the timer runs out. */
export function RushOrbs({ items, taken }) {
  const orbs = useRef();
  useRegister(items, taken);
  useFrame(({ clock }) => {
    const m = orbs.current;
    if (!m) return;
    const t = clock.elapsedTime;
    items.forEach((it, i) => {
      o.position.set(it.x, it.y + Math.sin(t * 3 + i) * 0.15, it.z);
      o.rotation.set(t + i, t * 1.3, 0);
      o.scale.setScalar(taken.has(it.id) ? 0 : 0.32 + Math.sin(t * 6 + i) * 0.04);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  if (!items.length) return null;
  return (
    <instancedMesh ref={orbs} args={[null, null, items.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={2} toneMapped={false} />
    </instancedMesh>
  );
}
