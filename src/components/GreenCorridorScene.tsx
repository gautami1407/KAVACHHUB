import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

/* ─── Road with lane markings ─── */
function Road() {
  return (
    <group>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[5, 80]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      {/* Median strip */}
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={`dash-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -39 + i * 2]}>
          <planeGeometry args={[0.08, 0.8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
      {/* Lane markings */}
      {[-1.2, 1.2].map(x => (
        <mesh key={`lane-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[0.05, 80]} />
          <meshStandardMaterial color="#9ca3af" opacity={0.4} transparent />
        </mesh>
      ))}
      {/* Curbs */}
      {[-2.4, 2.4].map(x => (
        <mesh key={`curb-${x}`} position={[x, 0.08, 0]}>
          <boxGeometry args={[0.15, 0.16, 80]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
      ))}
      {/* Sidewalks */}
      {[-3.3, 3.3].map(x => (
        <mesh key={`side-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
          <planeGeometry args={[1.6, 80]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}
      {/* Crosswalks at intersections */}
      {[-12, -4, 4, 12].map(z =>
        Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`cw-${z}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-2 + i * 0.55, 0.015, z]}>
            <planeGeometry args={[0.35, 1.2]} />
            <meshStandardMaterial color="#f3f4f6" />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ─── Traffic Light with realistic housing ─── */
function TrafficLight({ position, greenActive }: { position: [number, number, number]; greenActive: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3.6]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Arm */}
      <mesh position={[-1.2, 3.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Housing */}
      <mesh position={[-2.3, 3.4, 0]}>
        <boxGeometry args={[0.35, 1, 0.25]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Red */}
      <mesh position={[-2.3, 3.75, 0.13]}>
        <circleGeometry args={[0.1]} />
        <meshStandardMaterial
          color={greenActive ? "#374151" : "#ef4444"}
          emissive={greenActive ? "#000" : "#ef4444"}
          emissiveIntensity={greenActive ? 0 : 3}
        />
      </mesh>
      {/* Yellow */}
      <mesh position={[-2.3, 3.45, 0.13]}>
        <circleGeometry args={[0.1]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Green */}
      <mesh position={[-2.3, 3.15, 0.13]}>
        <circleGeometry args={[0.1]} />
        <meshStandardMaterial
          color={greenActive ? "#22c55e" : "#374151"}
          emissive={greenActive ? "#22c55e" : "#000"}
          emissiveIntensity={greenActive ? 3 : 0}
        />
      </mesh>
      {/* Green glow on ground when active */}
      {greenActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.3, 0.02, 0]}>
          <circleGeometry args={[1.2]} />
          <meshStandardMaterial color="#22c55e" transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  );
}

/* ─── Realistic car with windows ─── */
function Car({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.75, 0.28, 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.42, -0.05]}>
        <boxGeometry args={[0.65, 0.22, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Windows */}
      <mesh position={[0.33, 0.42, -0.05]}>
        <boxGeometry args={[0.01, 0.16, 0.7]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.33, 0.42, -0.05]}>
        <boxGeometry args={[0.01, 0.16, 0.7]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} />
      </mesh>
      {/* Wheels */}
      {[[-0.35, 0.08, 0.45], [0.35, 0.08, 0.45], [-0.35, 0.08, -0.45], [0.35, 0.08, -0.45]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Ambulance with siren ─── */
function AmbulanceVehicle({ posRef }: { posRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Group>(null);
  const sirenRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z = posRef.current;
      meshRef.current.position.x = -0.6;
      meshRef.current.position.y = 0;
    }
    if (sirenRef.current) {
      const mat = sirenRef.current.material as THREE.MeshStandardMaterial;
      const t = Math.sin(Date.now() * 0.015);
      mat.emissive.set(t > 0 ? "#ef4444" : "#3b82f6");
      mat.emissiveIntensity = 2 + Math.abs(t) * 2;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.9, 0.4, 2.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Box */}
      <mesh position={[0, 0.6, -0.3]}>
        <boxGeometry args={[0.85, 0.2, 1.4]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {/* Red stripe */}
      <mesh position={[0.46, 0.35, 0]}>
        <boxGeometry args={[0.01, 0.15, 2.22]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.46, 0.35, 0]}>
        <boxGeometry args={[0.01, 0.15, 2.22]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Red cross */}
      <mesh position={[0, 0.51, -1]}>
        <boxGeometry args={[0.25, 0.01, 0.08]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 0.51, -1]}>
        <boxGeometry args={[0.08, 0.01, 0.25]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Siren light bar */}
      <mesh ref={sirenRef} position={[0, 0.78, -0.2]}>
        <boxGeometry args={[0.5, 0.1, 0.15]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
      </mesh>
      {/* Siren light */}
      <pointLight position={[0, 1.2, 0]} color="#ef4444" intensity={3} distance={10} />
      <pointLight position={[0, 1.2, 0]} color="#3b82f6" intensity={1.5} distance={6} />
    </group>
  );
}

/* ─── Moving traffic ─── */
function MovingCars({ ambulancePos }: { ambulancePos: React.MutableRefObject<number> }) {
  const carsRef = useRef<THREE.Group>(null);
  const initialPositions = useMemo(() => {
    const cars: { x: number; z: number; color: string; speed: number; lane: number }[] = [];
    const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#6366f1", "#64748b", "#0ea5e9", "#a855f7", "#f97316", "#14b8a6", "#ec4899"];
    for (let i = 0; i < 16; i++) {
      const lane = i % 2 === 0 ? 0.6 : -0.6;
      cars.push({
        x: lane + (Math.random() - 0.5) * 0.15,
        z: -35 + i * 4.5 + Math.random() * 2,
        color: colors[i % colors.length],
        speed: 0.4 + Math.random() * 0.4,
        lane: i % 2,
      });
    }
    return cars;
  }, []);

  useFrame((_, delta) => {
    if (!carsRef.current) return;
    const ambZ = ambulancePos.current;
    carsRef.current.children.forEach((car, i) => {
      const data = initialPositions[i];
      const dist = car.position.z - ambZ;
      // Cars in ambulance's lane move aside when it approaches
      if (data.lane === 0 && dist > -3 && dist < 10) {
        car.position.x = THREE.MathUtils.lerp(car.position.x, -2.0, delta * 4);
      } else {
        car.position.x = THREE.MathUtils.lerp(car.position.x, data.x, delta * 1.5);
      }
      car.position.z += data.speed * delta * (data.lane === 1 ? -1 : 1);
      if (car.position.z > 38) car.position.z = -36;
      if (car.position.z < -38) car.position.z = 36;
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

/* ─── Buildings with windows ─── */
function Building({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  const windowRows = Math.floor(size[1] / 0.8);
  const windowCols = Math.floor(size[0] / 0.6);

  return (
    <group position={position}>
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Windows */}
      {Array.from({ length: windowRows }).map((_, r) =>
        Array.from({ length: windowCols }).map((_, c) => {
          const lit = Math.random() > 0.3;
          return (
            <mesh
              key={`${r}-${c}`}
              position={[
                -size[0] / 2 + 0.4 + c * 0.55,
                0.6 + r * 0.75,
                size[2] / 2 + 0.01,
              ]}
            >
              <planeGeometry args={[0.3, 0.4]} />
              <meshStandardMaterial
                color={lit ? "#fef3c7" : "#6b7280"}
                emissive={lit ? "#fef3c7" : "#000"}
                emissiveIntensity={lit ? 0.3 : 0}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ─── Trees ─── */
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.8]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.5, 1.2, 6]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  );
}

/* ─── Main Scene ─── */
function Scene() {
  const ambulancePos = useRef(30);
  const [greenSignals, setGreenSignals] = useState<boolean[]>([false, false, false, false, false]);
  const signalPositions: [number, number, number][] = [
    [2.8, 0, 16], [2.8, 0, 8], [2.8, 0, 0], [2.8, 0, -8], [2.8, 0, -16],
  ];

  useFrame((_, delta) => {
    ambulancePos.current -= delta * 3;
    if (ambulancePos.current < -35) ambulancePos.current = 30;

    const newGreen = signalPositions.map(p => ambulancePos.current - p[2] < 7 && ambulancePos.current - p[2] > -4);
    setGreenSignals(prev => {
      if (prev.every((v, i) => v === newGreen[i])) return prev;
      return newGreen;
    });
  });

  const buildings = useMemo(() => [
    { pos: [-6, 0, -15] as [number,number,number], size: [2.5, 4, 3] as [number,number,number], color: "#e2e8f0" },
    { pos: [-7, 0, -5] as [number,number,number], size: [3, 6, 3.5] as [number,number,number], color: "#cbd5e1" },
    { pos: [-5.5, 0, 6] as [number,number,number], size: [2, 3, 2.5] as [number,number,number], color: "#f1f5f9" },
    { pos: [-6.5, 0, 16] as [number,number,number], size: [2.5, 5, 3] as [number,number,number], color: "#e2e8f0" },
    { pos: [6, 0, -12] as [number,number,number], size: [2.5, 5, 3] as [number,number,number], color: "#f1f5f9" },
    { pos: [7, 0, 0] as [number,number,number], size: [3, 7, 3.5] as [number,number,number], color: "#cbd5e1" },
    { pos: [5.5, 0, 12] as [number,number,number], size: [2, 3.5, 2.5] as [number,number,number], color: "#e2e8f0" },
    { pos: [6.5, 0, 22] as [number,number,number], size: [2.5, 4, 3] as [number,number,number], color: "#f1f5f9" },
    { pos: [-5, 0, 25] as [number,number,number], size: [2, 8, 3] as [number,number,number], color: "#d1d5db" },
    { pos: [5, 0, -24] as [number,number,number], size: [3, 5, 2.5] as [number,number,number], color: "#e5e7eb" },
  ], []);

  const trees = useMemo(() => [
    [-4.2, 0, -18], [-4.2, 0, -10], [-4.2, 0, -2], [-4.2, 0, 10], [-4.2, 0, 20],
    [4.2, 0, -14], [4.2, 0, -6], [4.2, 0, 4], [4.2, 0, 14], [4.2, 0, 24],
  ] as [number,number,number][], []);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[12, 20, 8]} intensity={1.2} castShadow />
      <directionalLight position={[-8, 12, -8]} intensity={0.3} />
      <hemisphereLight args={["#87ceeb", "#e5e7eb", 0.4]} />

      {/* Sky-colored ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[50, 80]} />
        <meshStandardMaterial color="#f0fdf4" />
      </mesh>

      <Road />

      {/* Green corridor glow strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.6, 0.025, ambulancePos.current - 6]}>
        <planeGeometry args={[2, 14]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.18} />
      </mesh>

      {signalPositions.map((pos, i) => (
        <TrafficLight key={i} position={pos} greenActive={greenSignals[i]} />
      ))}

      <AmbulanceVehicle posRef={ambulancePos} />
      <MovingCars ambulancePos={ambulancePos} />

      {buildings.map((b, i) => (
        <Building key={i} position={b.pos} size={b.size} color={b.color} />
      ))}

      {trees.map((p, i) => (
        <Tree key={i} position={p} />
      ))}
    </>
  );
}

export function GreenCorridorScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [10, 14, 20], fov: 42, near: 0.1, far: 150 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
