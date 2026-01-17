
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { BodyMetrics, ClosetItem, Category } from '../types';

// Fix for JSX intrinsic element errors by using explicit casting
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const CylinderGeometry = 'cylinderGeometry' as any;
const SphereGeometry = 'sphereGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const AmbientLight = 'ambientLight' as any;
const SpotLight = 'spotLight' as any;
const PointLight = 'pointLight' as any;

interface MannequinProps {
  metrics: BodyMetrics;
  equippedItems: ClosetItem[];
}

const Mannequin: React.FC<MannequinProps> = ({ metrics, equippedItems }) => {
  const groupRef = useRef<THREE.Group>(null!);

  // Simple humanoid model built with primitives
  return (
    <Group ref={groupRef} position={[0, -1, 0]}>
      {/* Torso */}
      <Mesh position={[0, 1, 0]} scale={[metrics.shoulderWidth, metrics.heightRatio, metrics.waistWidth * 0.8]}>
        <CylinderGeometry args={[0.3, 0.25, 1, 32]} />
        <MeshStandardMaterial color="#e0ac69" />
      </Mesh>

      {/* Head */}
      <Mesh position={[0, 1.7, 0]} scale={[1, 1, 1]}>
        <SphereGeometry args={[0.15, 32, 32]} />
        <MeshStandardMaterial color="#e0ac69" />
      </Mesh>

      {/* Legs */}
      <Mesh position={[-0.12, 0.2, 0]} scale={[1, metrics.heightRatio, 1]}>
        <CylinderGeometry args={[0.1, 0.08, 0.8, 32]} />
        <MeshStandardMaterial color="#e0ac69" />
      </Mesh>
      <Mesh position={[0.12, 0.2, 0]} scale={[1, metrics.heightRatio, 1]}>
        <CylinderGeometry args={[0.1, 0.08, 0.8, 32]} />
        <MeshStandardMaterial color="#e0ac69" />
      </Mesh>

      {/* Arms */}
      <Mesh position={[-0.4 * metrics.shoulderWidth, 1.2, 0]} rotation={[0, 0, 0.2]}>
        <CylinderGeometry args={[0.07, 0.06, 0.7, 32]} />
        <MeshStandardMaterial color="#e0ac69" />
      </Mesh>
      <Mesh position={[0.4 * metrics.shoulderWidth, 1.2, 0]} rotation={[0, 0, -0.2]}>
        <CylinderGeometry args={[0.07, 0.06, 0.7, 32]} />
        <MeshStandardMaterial color="#e0ac69" />
      </Mesh>

      {/* Simple Visualization of Equipped Items */}
      {equippedItems.map((item) => {
        let yPos = 1.0;
        let scale: [number, number, number] = [1.1, 1.05, 1.1];
        
        if (item.category === Category.TOPS) {
          yPos = 1.1;
          scale = [0.4 * metrics.shoulderWidth, 0.6 * metrics.heightRatio, 0.35 * metrics.waistWidth];
        } else if (item.category === Category.BOTTOMS) {
          yPos = 0.3;
          scale = [0.35, 0.8 * metrics.heightRatio, 0.3];
        }

        return (
          <Mesh key={item.id} position={[0, yPos, 0]} scale={scale}>
            <CylinderGeometry args={[1, 1, 1, 32]} />
            <MeshStandardMaterial 
              color={item.color || "white"} 
              transparent 
              opacity={0.7} 
              wireframe
            />
          </Mesh>
        );
      })}
    </Group>
  );
};

const ThreeScene: React.FC<MannequinProps> = (props) => {
  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl overflow-hidden relative shadow-inner">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={50} />
        <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
        
        <AmbientLight intensity={0.5} />
        <SpotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <PointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Mannequin {...props} />
        
        <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        <Environment preset="city" />
      </Canvas>
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg text-xs font-medium text-gray-500 shadow-sm">
        <i className="fa-solid fa-arrows-spin mr-1"></i> Drag to Rotate
      </div>
    </div>
  );
};

export default ThreeScene;
