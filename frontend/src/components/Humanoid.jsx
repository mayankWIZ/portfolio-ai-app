// A stylised-realistic procedural person: proper proportions, jointed arms and legs,
// a face that blinks, hair styles and per-character outfits/accessories.
// Body parts are named groups so callers can animate them (walk cycles, waves, looks).
import { forwardRef } from "react";
import * as THREE from "three";

export const OUTFITS = {
  // The visitor's character
  player: { skin: "#c68a5e", hair: "#16161a", hairStyle: "short", top: "#2563eb", topStyle: "hoodie", bottom: "#1f2937", shoes: "#f8fafc", sole: "#94a3b8", backpack: "#111827" },
  // Ava · Concierge: blazer and a headset
  welcome: { skin: "#f1c7a3", hair: "#3b2314", hairStyle: "long", top: "#0ea5e9", topStyle: "blazer", shirt: "#f8fafc", bottom: "#1e293b", shoes: "#0f172a", accessory: "headset" },
  // Theo · Career advisor: shirt and tie
  career: { skin: "#8d5a3b", hair: "#0b0b0d", hairStyle: "short", top: "#f1f5f9", topStyle: "shirt", tie: "#7c3aed", bottom: "#312e81", shoes: "#3f2a1d", accessory: "tie" },
  // Nova · Project lead: lab vest, glasses, ponytail
  project: { skin: "#e8b98f", hair: "#1c1917", hairStyle: "ponytail", top: "#10b981", topStyle: "vest", shirt: "#e2e8f0", bottom: "#334155", shoes: "#f8fafc", accessory: "glasses" },
  // Max · Business advisor: blazer, beard
  client: { skin: "#d6a27a", hair: "#5b3a1e", hairStyle: "short", top: "#d97706", topStyle: "blazer", shirt: "#fef3c7", bottom: "#292524", shoes: "#1c1917", accessory: "beard" },
  // Iris · Research analyst: glasses and a bun
  research: { skin: "#f5d0b5", hair: "#7c2d12", hairStyle: "bun", top: "#db2777", topStyle: "sweater", bottom: "#1f2937", shoes: "#4c0519", accessory: "glasses" },
};

function M({ c, r = 0.75, m = 0, e }) {
  return <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e || "#000000"} emissiveIntensity={e ? 0.4 : 0} />;
}

function Limb({ r, len, c, y = -len / 2 - r, shadow = true }) {
  return (
    <mesh position={[0, y, 0]} castShadow={shadow}>
      <capsuleGeometry args={[r, len, 4, 12]} />
      <M c={c} r={0.8} />
    </mesh>
  );
}

function Hair({ style, color }) {
  const mat = <M c={color} r={0.9} />;
  return (
    <group>
      {/* cap of hair over the skull */}
      <mesh position={[0, 0.035, -0.012]} scale={[1.08, 1.0, 1.1]} castShadow>
        <sphereGeometry args={[0.135, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.85]} />
        {mat}
      </mesh>
      {style === "long" && (
        <mesh position={[0, -0.09, -0.07]} scale={[1.15, 1, 0.7]} castShadow>
          <capsuleGeometry args={[0.11, 0.2, 4, 12]} />
          {mat}
        </mesh>
      )}
      {style === "bun" && (
        <mesh position={[0, 0.1, -0.11]} castShadow>
          <sphereGeometry args={[0.065, 14, 10]} />
          {mat}
        </mesh>
      )}
      {style === "ponytail" && (
        <mesh position={[0, -0.03, -0.16]} rotation={[0.5, 0, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.18, 4, 8]} />
          {mat}
        </mesh>
      )}
      {style === "short" && (
        <mesh position={[0, 0.1, 0.05]} rotation={[0.35, 0, 0]} scale={[1, 0.35, 0.8]}>
          <sphereGeometry args={[0.12, 16, 8]} />
          {mat}
        </mesh>
      )}
    </group>
  );
}

function Face({ o }) {
  return (
    <group>
      {/* eyes: whites + irises, in a group the animator squashes to blink */}
      <group name="eyes" position={[0, 0.015, 0.112]}>
        {[-0.045, 0.045].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh scale={[1, 0.8, 0.5]}>
              <sphereGeometry args={[0.024, 12, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.011]}>
              <sphereGeometry args={[0.014, 10, 8]} />
              <meshStandardMaterial color="#3b2a1a" roughness={0.1} />
            </mesh>
            <mesh position={[0.004, 0.005, 0.02]}>
              <sphereGeometry args={[0.004, 6, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>
      {/* brows */}
      {[-0.045, 0.045].map((x) => (
        <mesh key={x} position={[x, 0.055, 0.118]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
          <boxGeometry args={[0.045, 0.009, 0.01]} />
          <M c={o.hair} />
        </mesh>
      ))}
      {/* nose */}
      <mesh position={[0, -0.012, 0.13]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.016, 0.04, 8]} />
        <M c={o.skin} r={0.6} />
      </mesh>
      {/* smile */}
      <mesh name="mouth" position={[0, -0.055, 0.112]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.025, 0.006, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#9f1239" roughness={0.5} />
      </mesh>
      {/* ears */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.13, 0, 0]} scale={[0.4, 1, 0.7]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <M c={o.skin} r={0.6} />
        </mesh>
      ))}
      {o.accessory === "glasses" && (
        <group position={[0, 0.018, 0.13]}>
          {[-0.045, 0.045].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <torusGeometry args={[0.03, 0.005, 6, 20]} />
              <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.03, 0.005, 0.005]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
        </group>
      )}
      {o.accessory === "beard" && (
        <mesh position={[0, -0.07, 0.07]} scale={[1, 0.8, 0.7]}>
          <sphereGeometry args={[0.1, 16, 10, 0, Math.PI * 2, Math.PI / 2.2, Math.PI / 2]} />
          <M c={o.hair} r={0.95} />
        </mesh>
      )}
      {o.accessory === "headset" && (
        <group>
          <mesh rotation={[0, 0, 0]} position={[0, 0.02, 0]}>
            <torusGeometry args={[0.145, 0.009, 6, 24, Math.PI]} />
            <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0.145, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.025, 14]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0.1, -0.06, 0.08]} rotation={[0.9, 0.4, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0.07, -0.085, 0.12]}>
            <sphereGeometry args={[0.012, 8, 6]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * Feet at y = 0, about 1.75 units tall. Named groups: hips, torso, head, eyes, mouth,
 * armL/armR (shoulders), foreL/foreR (elbows), legL/legR (hips), shinL/shinR (knees).
 */
const Humanoid = forwardRef(function Humanoid({ outfit = OUTFITS.player, ...props }, ref) {
  const o = outfit;
  const sleeve = o.top;
  const forearm = o.topStyle === "vest" ? o.skin : o.topStyle === "shirt" ? o.top : o.top;
  return (
    <group ref={ref} {...props}>
      <group name="hips" position={[0, 0.95, 0]}>
        {/* pelvis / belt */}
        <mesh position={[0, 0.02, 0]} scale={[1.25, 0.7, 0.85]} castShadow>
          <sphereGeometry args={[0.15, 18, 12]} />
          <M c={o.bottom} r={0.85} />
        </mesh>
        <mesh position={[0, 0.085, 0]}>
          <cylinderGeometry args={[0.175, 0.18, 0.04, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.3} />
        </mesh>

        <group name="torso" position={[0, 0.08, 0]}>
          {/* chest: tapered for shoulders → waist */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.165, 0.42, 20]} />
            <M c={o.topStyle === "vest" ? o.shirt : o.top} r={0.85} />
          </mesh>
          <mesh position={[0, 0.46, 0]} scale={[1, 0.55, 0.8]} castShadow>
            <sphereGeometry args={[0.205, 20, 12]} />
            <M c={o.topStyle === "vest" ? o.shirt : o.top} r={0.85} />
          </mesh>
          {o.topStyle === "vest" && (
            <mesh position={[0, 0.25, 0]} scale={[1.04, 1, 1.04]}>
              <cylinderGeometry args={[0.2, 0.17, 0.4, 20, 1, true, -Math.PI * 0.85, Math.PI * 1.7]} />
              <meshStandardMaterial color={o.top} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}
          {(o.topStyle === "blazer" || o.topStyle === "shirt") && (
            <mesh position={[0, 0.33, 0.17]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[0.09, 0.26, 0.02]} />
              <M c={o.shirt || "#f8fafc"} r={0.6} />
            </mesh>
          )}
          {o.topStyle === "blazer" &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.06, 0.35, 0.18]} rotation={[-0.15, 0, s * 0.35]}>
                <boxGeometry args={[0.05, 0.22, 0.015]} />
                <M c={new THREE.Color(o.top).multiplyScalar(0.7).getStyle()} r={0.6} />
              </mesh>
            ))}
          {o.accessory === "tie" && (
            <mesh position={[0, 0.3, 0.185]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[0.04, 0.22, 0.012]} />
              <M c={o.tie} r={0.4} />
            </mesh>
          )}
          {o.topStyle === "hoodie" && (
            <>
              <mesh position={[0, 0.5, -0.12]} rotation={[0.5, 0, 0]} castShadow>
                <torusGeometry args={[0.12, 0.05, 8, 16, Math.PI]} />
                <M c={o.top} r={0.9} />
              </mesh>
              {[-0.04, 0.04].map((x) => (
                <mesh key={x} position={[x, 0.36, 0.19]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.12, 4]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
              ))}
              <mesh position={[0, 0.13, 0.165]} rotation={[-0.08, 0, 0]}>
                <boxGeometry args={[0.2, 0.1, 0.02]} />
                <M c={new THREE.Color(o.top).multiplyScalar(0.8).getStyle()} r={0.9} />
              </mesh>
            </>
          )}
          {o.backpack && (
            <group position={[0, 0.3, -0.2]}>
              <mesh castShadow>
                <boxGeometry args={[0.3, 0.36, 0.13]} />
                <M c={o.backpack} r={0.8} />
              </mesh>
              <mesh position={[0, -0.08, -0.07]}>
                <boxGeometry args={[0.22, 0.13, 0.03]} />
                <M c="#1f2937" r={0.8} />
              </mesh>
            </group>
          )}
          {/* neck */}
          <mesh position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.1, 12]} />
            <M c={o.skin} r={0.6} />
          </mesh>

          <group name="head" position={[0, 0.74, 0.01]}>
            <mesh scale={[1, 1.12, 1.03]} castShadow>
              <sphereGeometry args={[0.13, 28, 20]} />
              <M c={o.skin} r={0.55} />
            </mesh>
            {/* jaw */}
            <mesh position={[0, -0.06, 0.02]} scale={[0.85, 0.6, 0.85]}>
              <sphereGeometry args={[0.12, 20, 12]} />
              <M c={o.skin} r={0.55} />
            </mesh>
            <Face o={o} />
            <Hair style={o.hairStyle} color={o.hair} />
          </group>

          {[-1, 1].map((s) => (
            <group key={s} name={s < 0 ? "armL" : "armR"} position={[s * 0.235, 0.5, 0]} rotation={[0, 0, s * 0.08]}>
              <mesh castShadow>
                <sphereGeometry args={[0.07, 12, 10]} />
                <M c={sleeve} r={0.85} />
              </mesh>
              <Limb r={0.055} len={0.22} c={sleeve} />
              <group name={s < 0 ? "foreL" : "foreR"} position={[0, -0.33, 0]} rotation={[-0.15, 0, 0]}>
                <Limb r={0.047} len={0.2} c={forearm} />
                <mesh position={[0, -0.3, 0.01]} scale={[0.8, 1.1, 0.6]} castShadow>
                  <sphereGeometry args={[0.055, 12, 10]} />
                  <M c={o.skin} r={0.55} />
                </mesh>
              </group>
            </group>
          ))}
        </group>

        {[-1, 1].map((s) => (
          <group key={s} name={s < 0 ? "legL" : "legR"} position={[s * 0.095, -0.02, 0]}>
            <Limb r={0.075} len={0.3} c={o.bottom} />
            <group name={s < 0 ? "shinL" : "shinR"} position={[0, -0.45, 0]}>
              <Limb r={0.06} len={0.3} c={o.bottom} />
              <group position={[0, -0.45, 0.05]}>
                <mesh castShadow>
                  <boxGeometry args={[0.12, 0.09, 0.27]} />
                  <M c={o.shoes} r={0.5} />
                </mesh>
                <mesh position={[0, -0.04, 0]}>
                  <boxGeometry args={[0.125, 0.025, 0.28]} />
                  <M c={o.sole || "#e5e7eb"} r={0.7} />
                </mesh>
              </group>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
});

export default Humanoid;

/** Name → Object3D lookup for a mounted humanoid. */
export function humanoidParts(root) {
  const p = {};
  root?.traverse((o) => o.name && (p[o.name] = o));
  return p;
}

/**
 * Idle life for a standing character: breathing, blinking, glancing, and an optional wave.
 * `look` is a world-space yaw (radians) the head should turn toward, relative to the body.
 */
export function animateIdle(p, t, { wave = 0, talk = 0, lookYaw = 0, seed = 0 } = {}) {
  if (!p.torso) return;
  p.torso.scale.y = 1 + Math.sin(t * 1.6 + seed) * 0.012;
  p.torso.rotation.x = Math.sin(t * 0.7 + seed) * 0.02;
  // blink every ~3.5s
  const b = (t + seed) % 3.6;
  p.eyes.scale.y = b < 0.12 ? 0.1 : 1;
  p.head.rotation.y = THREE.MathUtils.clamp(lookYaw, -0.9, 0.9) + Math.sin(t * 0.5 + seed) * 0.08;
  p.head.rotation.x = Math.sin(t * 0.8 + seed) * 0.04 - talk * Math.abs(Math.sin(t * 7)) * 0.05;
  if (p.mouth) p.mouth.scale.y = 1 + talk * Math.abs(Math.sin(t * 9)) * 1.5;
  // arms: relaxed sway, right arm waves when asked
  p.armL.rotation.x = Math.sin(t * 1.2 + seed) * 0.05;
  p.armL.rotation.z = -0.1;
  p.foreL.rotation.x = -0.25;
  const w = wave;
  p.armR.rotation.x = Math.sin(t * 1.2 + seed + 1) * 0.05 * (1 - w);
  p.armR.rotation.z = 0.1 + w * 2.5;
  p.foreR.rotation.x = -0.25 - w * 0.3;
  p.foreR.rotation.z = w * (0.5 + Math.sin(t * 9) * 0.45);
  p.legL.rotation.x = 0;
  p.legR.rotation.x = 0;
  p.shinL.rotation.x = 0;
  p.shinR.rotation.x = 0;
}
