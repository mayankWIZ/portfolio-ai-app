// World layout for the Journey: one winding road heading north (-z), a station per chapter
// alternating on either side, and a finale plaza at the end of the road.
import * as THREE from "three";
import { CHAPTERS, FINALE_INDEX } from "./chapters";

export const SPACING = 30;
export const START_Z = 8;
export const ROAD_WIDTH = 4.4;
const FIRST_Z = -16;

/** Road centre line: a gentle S-curve. */
export const roadX = (z) => Math.sin(z * 0.042) * 7 + Math.sin(z * 0.013) * 3;

export const END_Z = FIRST_Z - FINALE_INDEX * SPACING;

export const STATIONS = CHAPTERS.map((chapter, i) => {
  const finale = i === FINALE_INDEX;
  const z = finale ? END_Z : FIRST_Z - i * SPACING;
  const ax = roadX(z);
  const side = finale ? 0 : i % 2 ? 1 : -1;
  const anchor = new THREE.Vector3(ax, 0, z);
  // Diorama centre: beside the road (or straight ahead, for the finale).
  const center = finale ? new THREE.Vector3(ax, 0, z - 13) : new THREE.Vector3(ax + side * 12, 0, z);
  // Rotate the diorama so its local +z (its front) faces the road.
  const rotY = finale ? 0 : side > 0 ? -Math.PI / 2 : Math.PI / 2;
  const agentPos = finale
    ? new THREE.Vector3(ax - 2.5, 0, z - 4)
    : new THREE.Vector3(ax + side * 4.4, 0, z + 2.2);
  const shot = finale
    ? { pos: new THREE.Vector3(ax + 7, 7, z + 9), look: center.clone().add(new THREE.Vector3(0, 3, 0)) }
    : {
        pos: new THREE.Vector3(ax - side * 5, 6.5, z + 9),
        look: center.clone().add(new THREE.Vector3(0, 1.8, 0)),
      };
  return { index: i, chapter, anchor, center, side, rotY, agentPos, shot };
});

/** Local (diorama-space) point → world point for a station. */
export function toWorld(station, x, y, z, out = new THREE.Vector3()) {
  return out.set(x, y, z).applyAxisAngle(THREE.Object3D.DEFAULT_UP, station.rotY).add(station.center);
}

/** Circles the player can't walk through: the main structure of each diorama (local coords). */
const COLLIDERS = {
  campus: [[0, -2, 4.2]],
  homeOffice: [[-1.5, -2, 3]],
  homeCare: [[-2.5, -2, 3], [3, -1.5, 1.8]],
  warehouse: [[-1, -2.5, 4]],
  dataCenter: [[0, -2.8, 4]],
  gateway: [[0, -3.5, 3.2]],
  gallery: [],
  skillGarden: [],
  studio: [[-3, -2.5, 2.6], [3.5, -2.5, 1.6]],
  finale: [[0, 0, 2.4]],
};

export const COLLIDER_LIST = STATIONS.flatMap((s) =>
  (COLLIDERS[s.chapter.kind] || []).map(([x, z, r]) => {
    const p = toWorld(s, x, 0, z);
    return { x: p.x, z: p.z, r };
  })
).concat(STATIONS.map((s) => ({ x: s.agentPos.x, z: s.agentPos.z, r: 0.6 })));

/** 0 at the start of the road, 1 at the finale. Drives the time of day. */
export const progressAt = (z) => THREE.MathUtils.clamp((START_Z - z) / (START_Z - END_Z), 0, 1);

/** Closest point on the road centre to z (the road runs along z, so this is cheap). */
export const roadPoint = (z, out = new THREE.Vector3()) => out.set(roadX(z), 0, z);

export const ZONE_RADIUS = 10;

/** Per-frame runtime shared by scene components (never triggers React renders). */
export const runtime = {
  player: new THREE.Vector3(roadX(START_Z), 0, START_Z),
  progress: 0,
  night: 0, // 0 day … 1 night, drives lamps, stars and fireflies
  sunDir: new THREE.Vector3(0.4, 0.6, 0.3).normalize(),
};

/** Deterministic pseudo-random generator so the world is the same on every visit. */
export function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
