// The 3D half of the Journey (lazy-loaded with three.js). All UI lives in Journey.jsx.
import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import Player from "./Player";
import { Atmosphere, Birds, Clouds, Fireflies, Flowers, Ground, Lamps, Mountains, Pads, Road, Rocks, Stars, Trees } from "./Scenery";
import Stations from "./Stations";
import { STATIONS } from "./world";

function FirstFrame({ onReady }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onReady?.();
    }
  });
  return null;
}

export default function JourneyScene({ quality, onPerfDrop, onReady, stations, player }) {
  const high = quality === "high";
  return (
    <Canvas
      shadows={quality !== "low"}
      dpr={high ? [1, 1.75] : [0.75, 1]}
      gl={{ antialias: high, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 50, near: 0.1, far: 700, position: [STATIONS[0].anchor.x, 5, 16] }}
      style={{ touchAction: "none" }}
      aria-label="3D journey through Mayank's career. Use the controls panel to move, or start the guided tour."
    >
      <FirstFrame onReady={onReady} />
      <PerformanceMonitor onDecline={onPerfDrop} flipflops={2} />
      <Atmosphere quality={quality} />
      <Ground />
      <Road />
      <Pads />
      <Mountains />
      <Clouds quality={quality} />
      <Stars />
      <Trees quality={quality} />
      <Rocks quality={quality} />
      {quality !== "low" && <Flowers quality={quality} />}
      <Lamps />
      <Birds />
      <Fireflies quality={quality} />
      <Stations {...stations} quality={quality} />
      <Player {...player} />
    </Canvas>
  );
}
