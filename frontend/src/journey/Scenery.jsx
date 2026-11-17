// Sky, light, terrain, road and ambient life. Everything is procedural: no textures or HDRIs are fetched.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { END_Z, ROAD_WIDTH, START_Z, STATIONS, roadX, runtime, seeded } from "./world";

/* ------------------------------------------------------------------ helpers */

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (repeat) t.repeat.set(...repeat);
  return t;
}

/* ------------------------------------------------------------------ time of day */

// The sky moves with the career: dawn at university, noon mid-career, dusk at CognitivTrust, night at the finale.
const KEYS = [
  { p: 0.0, top: "#24406b", horizon: "#f2a679", ground: "#2a2f3a", sun: "#ffb37a", sunI: 1.5, elev: 6, az: 1.2, hemiSky: "#f5c7aa", hemiGround: "#3a3a2a" },
  { p: 0.2, top: "#3f7fc0", horizon: "#cfe2ef", ground: "#3c4a52", sun: "#fff0d8", sunI: 2.4, elev: 28, az: 0.9, hemiSky: "#cfe4ff", hemiGround: "#4a5a3a" },
  { p: 0.45, top: "#2d6bb5", horizon: "#b9d6ec", ground: "#3c4a52", sun: "#ffffff", sunI: 2.8, elev: 58, az: 0.4, hemiSky: "#d8ecff", hemiGround: "#4d5e3c" },
  { p: 0.66, top: "#3b6fae", horizon: "#e7d6b5", ground: "#3c4a52", sun: "#ffe1ad", sunI: 2.4, elev: 32, az: -0.4, hemiSky: "#e9e2cf", hemiGround: "#4b553a" },
  { p: 0.8, top: "#46508c", horizon: "#f39a5a", ground: "#3a3340", sun: "#ff9a4f", sunI: 1.9, elev: 9, az: -0.8, hemiSky: "#f2b48a", hemiGround: "#3f3a33" },
  { p: 0.9, top: "#22275a", horizon: "#b8677a", ground: "#2a2838", sun: "#ff8a6a", sunI: 1.1, elev: -2, az: -1.0, hemiSky: "#8a7aae", hemiGround: "#35303c" },
  { p: 1.0, top: "#0a1030", horizon: "#33407a", ground: "#111527", sun: "#b4c4ff", sunI: 1.1, elev: -14, az: -1.1, hemiSky: "#7a8fd6", hemiGround: "#262c40" },
];
const KEY_COLORS = KEYS.map((k) => ({
  ...k,
  top: new THREE.Color(k.top),
  horizon: new THREE.Color(k.horizon),
  ground: new THREE.Color(k.ground),
  sun: new THREE.Color(k.sun),
  hemiSky: new THREE.Color(k.hemiSky),
  hemiGround: new THREE.Color(k.hemiGround),
}));

const sky = {
  top: new THREE.Color(),
  horizon: new THREE.Color(),
  ground: new THREE.Color(),
  sun: new THREE.Color(),
  hemiSky: new THREE.Color(),
  hemiGround: new THREE.Color(),
  sunI: 1,
  elev: 30,
  az: 0,
};

function sampleSky(p) {
  let i = 0;
  while (i < KEY_COLORS.length - 2 && p > KEY_COLORS[i + 1].p) i++;
  const a = KEY_COLORS[i];
  const b = KEY_COLORS[i + 1];
  const t = THREE.MathUtils.smoothstep(p, a.p, b.p);
  for (const k of ["top", "horizon", "ground", "sun", "hemiSky", "hemiGround"]) sky[k].copy(a[k]).lerp(b[k], t);
  sky.sunI = THREE.MathUtils.lerp(a.sunI, b.sunI, t);
  sky.elev = THREE.MathUtils.lerp(a.elev, b.elev, t);
  sky.az = THREE.MathUtils.lerp(a.az, b.az, t);
  return sky;
}

const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p;
}`;
const skyFragment = /* glsl */ `
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 ground;
uniform vec3 sunDir;
uniform vec3 sunColor;
uniform float night;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 1.0, h), 0.55)) : mix(horizon, ground, smoothstep(0.0, -0.2, h));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  float disc = smoothstep(0.9993, 0.9997, s);
  col += sunColor * (disc * mix(6.0, 1.2, night) + pow(s, 10.0) * 0.28 + pow(s, 64.0) * 0.5);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function makeSkyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      top: { value: new THREE.Color() },
      horizon: { value: new THREE.Color() },
      ground: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunColor: { value: new THREE.Color() },
      night: { value: 0 },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
}

/** Sky dome, sun/moon light, hemisphere light, fog and a sky-matched environment map. */
export function Atmosphere({ quality }) {
  const { scene, gl, camera } = useThree();
  const dome = useRef();
  const sun = useRef();
  const hemi = useRef();
  const material = useMemo(makeSkyMaterial, []);
  const envState = useRef({ bucket: -1, rt: null });

  // A tiny second scene holding the same sky, rendered into a PMREM env map whenever the sky changes enough.
  const envScene = useMemo(() => {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), material));
    return s;
  }, [material]);
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);

  useEffect(
    () => () => {
      envState.current.rt?.dispose();
      pmrem.dispose();
      scene.environment = null;
    },
    [pmrem, scene]
  );

  useEffect(() => {
    const target = sun.current?.target;
    if (target) scene.add(target);
    return () => {
      if (target) scene.remove(target);
    };
  }, [scene]);

  useFrame(() => {
    const p = runtime.progress;
    const k = sampleSky(p);
    const elev = THREE.MathUtils.degToRad(k.elev);
    runtime.sunDir.set(Math.cos(elev) * Math.sin(k.az), Math.sin(elev), -Math.cos(elev) * Math.cos(k.az)).normalize();
    runtime.night = THREE.MathUtils.smoothstep(p, 0.8, 0.97);

    const u = material.uniforms;
    u.top.value.copy(k.top);
    u.horizon.value.copy(k.horizon);
    u.ground.value.copy(k.ground);
    u.sunDir.value.copy(runtime.sunDir);
    u.sunColor.value.copy(k.sun);
    u.night.value = runtime.night;
    if (dome.current) dome.current.position.copy(camera.position);

    if (scene.fog) scene.fog.color.copy(k.horizon).lerp(k.top, 0.15);

    // The key light never drops below the horizon: after sunset it becomes moonlight from high up.
    const L = sun.current;
    if (L) {
      const lightElev = Math.max(elev, THREE.MathUtils.degToRad(24));
      const dir = new THREE.Vector3(Math.cos(lightElev) * Math.sin(k.az), Math.sin(lightElev), -Math.cos(lightElev) * Math.cos(k.az));
      L.position.copy(runtime.player).addScaledVector(dir, 40);
      L.target.position.copy(runtime.player);
      L.color.copy(k.sun);
      L.intensity = k.sunI;
    }
    if (hemi.current) {
      hemi.current.color.copy(k.hemiSky);
      hemi.current.groundColor.copy(k.hemiGround);
      hemi.current.intensity = THREE.MathUtils.lerp(0.9, 0.8, runtime.night);
    }

    const bucket = Math.round(p * 24);
    if (bucket !== envState.current.bucket) {
      envState.current.bucket = bucket;
      const rt = pmrem.fromScene(envScene, 0, 0.1, 100);
      envState.current.rt?.dispose();
      envState.current.rt = rt;
      scene.environment = rt.texture;
      scene.environmentIntensity = THREE.MathUtils.lerp(0.75, 0.6, runtime.night);
    }
  });

  const shadowSize = quality === "high" ? 2048 : 1024;
  return (
    <>
      <mesh ref={dome} material={material} frustumCulled={false} renderOrder={-1}>
        <sphereGeometry args={[300, 32, 16]} />
      </mesh>
      <fog attach="fog" args={["#cfe2ef", 40, 150]} />
      <hemisphereLight ref={hemi} args={["#cfe4ff", "#4a5a3a", 0.8]} />
      <directionalLight
        ref={sun}
        castShadow={quality !== "low"}
        intensity={2}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={110}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}

/* ------------------------------------------------------------------ terrain & road */

const Z0 = START_Z + 40;
const Z1 = END_Z - 60;
const GROUND_PAD = 260;

export function Ground() {
  const grass = useMemo(
    () =>
      canvasTexture(
        256,
        256,
        (g, w, h) => {
          g.fillStyle = "#4f7a3a";
          g.fillRect(0, 0, w, h);
          const r = seeded(7);
          for (let i = 0; i < 9000; i++) {
            const l = 28 + r() * 22;
            g.fillStyle = `hsl(${88 + r() * 30}, ${32 + r() * 22}%, ${l}%)`;
            g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3);
          }
        },
        [150, 230]
      ),
    []
  );
  const len = Z0 - Z1 + GROUND_PAD * 2;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (Z0 + Z1) / 2]} receiveShadow>
      <planeGeometry args={[640, len, 1, 1]} />
      <meshStandardMaterial map={grass} roughness={0.95} metalness={0} />
    </mesh>
  );
}

function ribbon(width, y, step = 1) {
  const pos = [];
  const uv = [];
  const idx = [];
  let dist = 0;
  let prev = null;
  const from = START_Z + 30;
  const to = END_Z + 4;
  for (let z = from, i = 0; z >= to - 0.001; z -= step, i++) {
    const x = roadX(z);
    const dx = roadX(z - 0.01) - x;
    const t = new THREE.Vector2(dx, -0.01).normalize();
    const n = new THREE.Vector2(-t.y, t.x); // perpendicular, pointing +x when heading -z
    if (prev) dist += Math.hypot(x - prev[0], z - prev[1]);
    prev = [x, z];
    pos.push(x - (n.x * width) / 2, y, z - (n.y * width) / 2, x + (n.x * width) / 2, y, z + (n.y * width) / 2);
    uv.push(0, dist / 6, 1, dist / 6);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // Winding may face down; force normals up so lighting is right either way.
  const nrm = geo.attributes.normal;
  for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
  return geo;
}

export function Road() {
  const asphalt = useMemo(
    () =>
      canvasTexture(128, 256, (g, w, h) => {
        g.fillStyle = "#3b3f46";
        g.fillRect(0, 0, w, h);
        const r = seeded(3);
        for (let i = 0; i < 2600; i++) {
          g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${0.04 + r() * 0.05})`;
          g.fillRect(r() * w, r() * h, 1.5, 1.5);
        }
        g.fillStyle = "#e5e7eb";
        g.fillRect(5, 0, 4, h);
        g.fillRect(w - 9, 0, 4, h);
        g.fillStyle = "#facc15";
        g.fillRect(w / 2 - 2, 0, 4, h * 0.55);
      }),
    []
  );
  const road = useMemo(() => ribbon(ROAD_WIDTH, 0.03), []);
  const shoulder = useMemo(() => ribbon(ROAD_WIDTH + 2.2, 0.015), []);
  return (
    <group>
      <mesh geometry={shoulder} receiveShadow>
        <meshStandardMaterial color="#8b7f6a" roughness={1} />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial map={asphalt} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  );
}

/** A paved pad under each diorama, a path from the road to it, and the finale plaza. */
export function Pads() {
  return STATIONS.map((s) => {
    const finale = s.side === 0;
    const mid = s.anchor.clone().lerp(s.center, 0.5);
    const len = s.anchor.distanceTo(s.center);
    return (
      <group key={s.index}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s.center.x, 0.02, s.center.z]} receiveShadow>
          <circleGeometry args={[finale ? 13 : 8.5, 48]} />
          <meshStandardMaterial color={finale ? "#a8a29e" : "#9ca3af"} roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s.center.x, 0.025, s.center.z]}>
          <ringGeometry args={[finale ? 12.6 : 8.1, finale ? 13 : 8.5, 48]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.atan2(s.center.x - s.anchor.x, s.center.z - s.anchor.z)]} position={[mid.x, 0.022, mid.z]} receiveShadow>
          <planeGeometry args={[3, len]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.95} />
        </mesh>
      </group>
    );
  });
}

/* ------------------------------------------------------------------ vegetation */

function placeAlongRoute(count, seed, minRoad, maxRoad, avoid) {
  const r = seeded(seed);
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    const z = Z1 + 20 + r() * (Z0 - Z1 - 30);
    const side = r() > 0.5 ? 1 : -1;
    const x = roadX(z) + side * (minRoad + r() * (maxRoad - minRoad));
    if (STATIONS.some((s) => Math.hypot(s.center.x - x, s.center.z - z) < avoid + (s.side === 0 ? 6 : 0))) continue;
    if (STATIONS.some((s) => s.side !== 0 && Math.abs(s.anchor.z - z) < 4 && Math.sign(x - s.anchor.x) === s.side)) continue;
    out.push({ x, z, s: 0.7 + r() * 0.9, t: r(), rot: r() * Math.PI * 2 });
  }
  return out;
}

export function Trees({ quality }) {
  const count = quality === "low" ? 150 : 340;
  const pines = useRef();
  const rounds = useRef();
  const trunks = useRef();
  const data = useMemo(() => placeAlongRoute(count, 11, 7.5, 60, 11), [count]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    let pi = 0;
    let ri = 0;
    data.forEach((t, i) => {
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, t.rot);
      const s = t.s * 1.6;
      m.compose(new THREE.Vector3(t.x, s * 0.6, t.z), q, new THREE.Vector3(s, s, s));
      trunks.current.setMatrixAt(i, m);
      if (t.t < 0.55) {
        m.compose(new THREE.Vector3(t.x, s * 2.1, t.z), q, new THREE.Vector3(s, s * 1.15, s));
        pines.current.setMatrixAt(pi, m);
        pines.current.setColorAt(pi++, c.setHSL(0.33 + t.t * 0.08, 0.45, 0.2 + t.t * 0.1));
      } else {
        m.compose(new THREE.Vector3(t.x, s * 1.9, t.z), q, new THREE.Vector3(s * 1.05, s, s * 1.05));
        rounds.current.setMatrixAt(ri, m);
        rounds.current.setColorAt(ri++, c.setHSL(0.2 + (t.t - 0.55) * 0.25, 0.5, 0.3 + (t.t - 0.55) * 0.12));
      }
    });
    pines.current.count = pi;
    rounds.current.count = ri;
    for (const mesh of [trunks.current, pines.current, rounds.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [data]);

  const shadows = quality !== "low";
  return (
    <group>
      <instancedMesh ref={trunks} args={[null, null, data.length]} castShadow={shadows}>
        <cylinderGeometry args={[0.1, 0.16, 1.2, 6]} />
        <meshStandardMaterial color="#5b3a1e" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={pines} args={[null, null, data.length]} castShadow={shadows}>
        <coneGeometry args={[0.85, 2.4, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={rounds} args={[null, null, data.length]} castShadow={shadows}>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
}

export function Rocks({ quality }) {
  const ref = useRef();
  const data = useMemo(() => placeAlongRoute(quality === "low" ? 30 : 70, 23, 4.5, 40, 10), [quality]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    data.forEach((t, i) => {
      q.setFromEuler(new THREE.Euler(t.rot, t.rot * 2, 0));
      const s = 0.25 + t.t * 0.6;
      m.compose(new THREE.Vector3(t.x, s * 0.3, t.z), q, new THREE.Vector3(s * 1.4, s, s * 1.1));
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[null, null, data.length]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8a8f98" roughness={0.85} flatShading />
    </instancedMesh>
  );
}

export function Flowers({ quality }) {
  const ref = useRef();
  const data = useMemo(() => placeAlongRoute(quality === "low" ? 120 : 360, 41, 3.4, 14, 9), [quality]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const palette = ["#f472b6", "#facc15", "#ffffff", "#a78bfa", "#fb923c"];
    data.forEach((t, i) => {
      const s = 0.06 + t.t * 0.05;
      m.makeScale(s, s, s).setPosition(t.x, 0.18, t.z);
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, c.set(palette[Math.floor(t.rot * 10) % palette.length]));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[null, null, data.length]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ street lamps */

export function Lamps() {
  const poles = useRef();
  const bulbs = useRef();
  const bulbMat = useRef();
  const spots = useMemo(() => {
    const out = [];
    for (let z = START_Z, i = 0; z > END_Z + 6; z -= 15, i++) {
      const side = i % 2 ? 1 : -1;
      if (STATIONS.some((s) => Math.abs(s.anchor.z - z) < 6)) continue;
      out.push([roadX(z) + side * (ROAD_WIDTH / 2 + 1.2), z, side]);
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    spots.forEach(([x, z, side], i) => {
      m.makeTranslation(x, 1.6, z);
      poles.current.setMatrixAt(i, m);
      m.makeTranslation(x - side * 0.45, 3.15, z);
      bulbs.current.setMatrixAt(i, m);
    });
    poles.current.instanceMatrix.needsUpdate = true;
    bulbs.current.instanceMatrix.needsUpdate = true;
    poles.current.computeBoundingSphere();
    bulbs.current.computeBoundingSphere();
  }, [spots]);
  useFrame(() => {
    if (bulbMat.current) bulbMat.current.emissiveIntensity = 0.2 + runtime.night * 3.2;
  });
  return (
    <group>
      <instancedMesh ref={poles} args={[null, null, spots.length]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[null, null, spots.length]}>
        <boxGeometry args={[0.7, 0.12, 0.28]} />
        <meshStandardMaterial ref={bulbMat} color="#fef3c7" emissive="#fde68a" emissiveIntensity={0.2} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------ distant & ambient */

export function Mountains() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#475569", fog: false }), []);
  const peaks = useMemo(() => {
    const r = seeded(99);
    const out = [];
    // An ellipse around the whole route, far enough that no cone reaches a station.
    const midZ = (START_Z + END_Z) / 2;
    const semiZ = (START_Z - END_Z) / 2 + 170;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + r() * 0.08;
      const k = 1 + r() * 0.25;
      out.push({ x: Math.cos(a) * 175 * k, z: midZ + Math.sin(a) * semiZ * k, h: 35 + r() * 60, w: 40 + r() * 40 });
    }
    return out;
  }, []);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const k = sampleSky(runtime.progress);
    mat.color.set("#334155").lerp(tmp.copy(k.horizon), 0.45).multiplyScalar(1 - runtime.night * 0.45);
  });
  return peaks.map((p, i) => (
    <mesh key={i} position={[p.x, p.h / 2 - 2, p.z]} material={mat}>
      <coneGeometry args={[p.w, p.h, 6]} />
    </mesh>
  ));
}

export function Clouds({ quality }) {
  const group = useRef();
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false, transparent: true, opacity: 0.92 }), []);
  const clouds = useMemo(() => {
    const r = seeded(5);
    return Array.from({ length: quality === "low" ? 8 : 16 }, () => ({
      x: -120 + r() * 240,
      y: 55 + r() * 30,
      z: END_Z - 40 + r() * (START_Z - END_Z + 80),
      puffs: Array.from({ length: 5 }, (_, j) => [j * 4 - 8 + r() * 2, r() * 2, r() * 4 - 2, 3 + r() * 3]),
      speed: 0.6 + r() * 0.8,
    }));
  }, [quality]);
  useFrame((_, dt) => {
    const k = sampleSky(runtime.progress);
    mat.color.set("#ffffff").lerp(k.sun, 0.35).multiplyScalar(1 - runtime.night * 0.75);
    group.current?.children.forEach((c, i) => {
      c.position.x += dt * clouds[i].speed;
      if (c.position.x > 140) c.position.x = -140;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]}>
          {c.puffs.map(([x, y, z, s], j) => (
            <mesh key={j} position={[x, y, z]} scale={[s * 1.4, s * 0.8, s]} material={mat}>
              <icosahedronGeometry args={[1, 1]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Stars() {
  const ref = useRef();
  const geo = useMemo(() => {
    const r = seeded(17);
    const pos = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      const u = r() * Math.PI * 2;
      const v = Math.acos(r() * 0.95);
      pos.set([Math.sin(v) * Math.cos(u) * 260, Math.cos(v) * 260, Math.sin(v) * Math.sin(u) * 260], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const { camera } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
    ref.current.material.opacity = runtime.night;
    ref.current.visible = runtime.night > 0.02;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#e0e7ff" size={1.6} sizeAttenuation={false} transparent opacity={0} fog={false} depthWrite={false} />
    </points>
  );
}

/** Birds circling over wherever the visitor is, flapping. */
export function Birds() {
  const ref = useRef();
  const birds = useMemo(() => {
    const r = seeded(31);
    return Array.from({ length: 14 }, () => ({ r: 10 + r() * 22, h: 14 + r() * 10, sp: 0.15 + r() * 0.2, ph: r() * 6.28, flap: 6 + r() * 4 }));
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.25, -0.9, 0.15, -0.1, 0, 0, -0.25, 0, 0, 0.25, 0.9, 0.15, -0.1, 0, 0, -0.25], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const center = useRef(new THREE.Vector3());
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    center.current.lerp(runtime.player, 0.01);
    const o = new THREE.Object3D();
    birds.forEach((b, i) => {
      const a = t * b.sp + b.ph;
      o.position.set(center.current.x + Math.cos(a) * b.r, b.h + Math.sin(t + b.ph) * 1.2, center.current.z - 20 + Math.sin(a) * b.r);
      o.rotation.set(0, -a, 0);
      const f = Math.sin(t * b.flap + b.ph);
      o.scale.set(1, 1 + f * 1.4, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.visible = runtime.night < 0.85;
  });
  return (
    <instancedMesh ref={ref} args={[geo, null, birds.length]} frustumCulled={false}>
      <meshBasicMaterial color="#1f2937" side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/** Pollen by day, fireflies by night, always around the visitor. */
export function Fireflies({ quality }) {
  const ref = useRef();
  const n = quality === "low" ? 40 : 90;
  const { geo, seeds } = useMemo(() => {
    const r = seeded(77);
    const pos = new Float32Array(n * 3);
    const seeds = Array.from({ length: n }, () => [r() * 30 - 15, 0.4 + r() * 3, r() * 30 - 15, r() * 6.28]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, seeds };
  }, [n]);
  useFrame(({ clock }) => {
    const p = ref.current;
    if (!p) return;
    const t = clock.elapsedTime;
    const a = geo.attributes.position;
    seeds.forEach(([x, y, z, ph], i) => {
      a.setXYZ(i, runtime.player.x + x + Math.sin(t * 0.3 + ph) * 1.5, y + Math.sin(t * 0.8 + ph) * 0.4, runtime.player.z + z + Math.cos(t * 0.25 + ph) * 1.5);
    });
    a.needsUpdate = true;
    p.material.color.set(runtime.night > 0.4 ? "#fef08a" : "#ffffff");
    p.material.opacity = 0.35 + runtime.night * 0.6;
    p.material.size = runtime.night > 0.4 ? 0.16 : 0.06;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.08} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}
