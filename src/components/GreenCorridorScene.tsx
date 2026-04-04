import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

function Road() {
  return (
    <group>
      {/* Main road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[4, 60]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Center line dashes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -29 + i * 2]}>
          <planeGeometry args={[0.08, 0.8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
      {/* Side lines */}
      {[-1.9, 1.9].map(x => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[0.1, 60]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      ))}
      {/* Sidewalks */}
      {[-2.8, 2.8].map(x => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[1.6, 60]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
      ))}
    </group>
  );
}

function TrafficLight({ position, greenActive }: { position: [number, number, number]; greenActive: boolean }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 3]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      {/* Housing */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[0.4, 0.9, 0.3]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Red */}
      <mesh position={[0, 3.1, 0.16]}>
        <circleGeometry args={[0.1]} />
        <meshStandardMaterial color={greenActive ? "#4b5563" : "#ef4444"} emissive={greenActive ? "#000" : "#ef4444"} emissiveIntensity={greenActive ? 0 : 2} />
      </mesh>
      {/* Yellow */}
      <mesh position={[0, 2.8, 0.16]}>
        <circleGeometry args={[0.1]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      {/* Green */}
      <mesh position={[0, 2.5, 0.16]}>
        <circleGeometry args={[0.1]} />
        <meshStandardMaterial color={greenActive ? "#22c55e" : "#4b5563"} emissive={greenActive ? "#22c55e" : "#000"} emissiveIntensity={greenActive ? 2 : 0} />
      </mesh>
    </group>
  );
}

function Car({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.8, 0.3, 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, -0.1]}>
        <boxGeometry args={[0.7, 0.25, 0.9]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function AmbulanceVehicle({ posRef }: { posRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.z = posRef.current;
      meshRef.current.position.x = -0.9;
      meshRef.current.position.y = 0;
    }
    if (lightRef.current) {
      lightRef.current.position.z = posRef.current;
      lightRef.current.intensity = 2 + Math.sin(Date.now() * 0.01) * 1.5;
    }
  });

  return (
    <>
      <group ref={meshRef}>
        {/* Body */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.9, 0.45, 2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Top */}
        <mesh position={[0, 0.65, -0.2]}>
          <boxGeometry args={[0.85, 0.2, 1.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Red stripe */}
        <mesh position={[0, 0.42, 0.01]}>
          <boxGeometry args={[0.92, 0.1, 2.02]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {/* Siren */}
        <mesh position={[0, 0.82, -0.3]}>
          <boxGeometry args={[0.3, 0.12, 0.2]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
        </mesh>
      </group>
      <pointLight ref={lightRef} position={[-0.9, 1.5, 0]} color="#ef4444" intensity={2} distance={8} />
    </>
  );
}

function MovingCars({ ambulancePos }: { ambulancePos: React.MutableRefObject<number> }) {
  const carsRef = useRef<THREE.Group>(null);
  const initialPositions = useMemo(() => {
    const cars: { x: number; z: number; color: string; speed: number }[] = [];
    const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#6366f1", "#64748b", "#0ea5e9", "#a855f7"];
    for (let i = 0; i < 12; i++) {
      const lane = i % 2 === 0 ? 0.9 : -0.9;
      cars.push({
        x: lane + (Math.random() - 0.5) * 0.2,
        z: -25 + i * 4 + Math.random() * 2,
        color: colors[i % colors.length],
        speed: 0.5 + Math.random() * 0.3,
      });
    }
    return cars;
  }, []);

  useFrame((_, delta) => {
    if (!carsRef.current) return;
    const ambZ = ambulancePos.current;
    carsRef.current.children.forEach((car, i) => {
      const data = initialPositions[i];
      // Move cars, but clear the lane when ambulance approaches
      const dist = car.position.z - ambZ;
      if (data.x < 0 && dist > -2 && dist < 8) {
        // Move aside
        car.position.x = THREE.MathUtils.lerp(car.position.x, -2.5, delta * 3);
      } else {
        car.position.x = THREE.MathUtils.lerp(car.position.x, data.x, delta * 1);
      }
      car.position.z += data.speed * delta * (data.x > 0 ? -1 : 1);
      if (car.position.z > 30) car.position.z = -28;
      if (car.position.z < -30) car.position.z = 28;
    });
  });

  return (
    <group ref={carsRef}>
      {initialPositions.map((c, i) => (
        <Car key={i} position={[c.x, 0, c.z]} color={c.color} />
      ))}
    </group>
  );
}

function Scene() {
  const ambulancePos = useRef(25);
  const [greenSignals, setGreenSignals] = useState<boolean[]>([false, false, false, false]);
  const signalPositions: [number, number, number][] = [
    [2.5, 0, 12], [2.5, 0, 4], [2.5, 0, -4], [2.5, 0, -12],
  ];

  useFrame((_, delta) => {
    ambulancePos.current -= delta * 3.5;
    if (ambulancePos.current < -28) ambulancePos.current = 25;

    // Turn signals green as ambulance approaches
    const newGreen = signalPositions.map(p => ambulancePos.current - p[2] < 6 && ambulancePos.current - p[2] > -3);
    setGreenSignals(newGreen);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 60]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      <Road />

      {/* Green corridor glow on road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.9, 0.02, ambulancePos.current - 5]}>
        <planeGeometry args={[1.8, 12]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.15} />
      </mesh>

      {signalPositions.map((pos, i) => (
        <TrafficLight key={i} position={pos} greenActive={greenSignals[i]} />
      ))}

      <AmbulanceVehicle posRef={ambulancePos} />
      <MovingCars ambulancePos={ambulancePos} />

      {/* Simple buildings */}
      {[[-5, 0, -10], [-6, 0, 5], [-5, 0, 15], [5, 0, -8], [6, 0, 3], [5.5, 0, 14], [-6, 0, -20], [6, 0, -18]].map((p, i) => (
        <mesh key={i} position={[p[0], (1 + i * 0.3), p[2]]}>
          <boxGeometry args={[2, 2 + i * 0.6, 2.5]} />
          <meshStandardMaterial color={["#94a3b8", "#cbd5e1", "#a1a1aa", "#d4d4d8"][i % 4]} />
        </mesh>
      ))}
    </>
  );
}

export function GreenCorridorScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [8, 12, 16], fov: 45, near: 0.1, far: 100 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
