
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BodyParams, ClosetItem, Category } from '../types';

interface ThreeModelProps {
  bodyParams: BodyParams;
  equipped: { [key in Category]?: ClosetItem | null };
}

const ThreeModel: React.FC<ThreeModelProps> = ({ bodyParams, equipped }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mannequin: THREE.Group;
    parts: { [key: string]: THREE.Mesh };
    clothes: { [key: string]: THREE.Mesh };
    textureLoader: THREE.TextureLoader;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2d2d2d); // Slightly warmer studio dark

    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.4, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.target.set(0, 1.1, 0);

    // 2. High-Quality Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.5);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 2, 2);
    scene.add(fillLight);

    // 3. Realistic Skin Material
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xead0c3,
      metalness: 0.0,
      roughness: 0.75,
      clearcoat: 0.1,
      clearcoatRoughness: 0.2,
      reflectivity: 0.1,
    });

    const mannequin = new THREE.Group();
    scene.add(mannequin);

    const parts: { [key: string]: THREE.Mesh } = {};
    const clothes: { [key: string]: THREE.Mesh } = {};
    const textureLoader = new THREE.TextureLoader();
    // CRITICAL: Set crossOrigin for TextureLoader to avoid tainted canvas errors
    textureLoader.setCrossOrigin('anonymous');

    const addBodyPart = (geo: THREE.BufferGeometry, name: string, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geo, skinMat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mannequin.add(mesh);
      parts[name] = mesh;

      // Create a "Clothing Shell" mesh slightly larger than body
      const clothGeo = geo.clone();
      clothGeo.scale(1.02, 1.02, 1.05); // Slight offset to prevent Z-fighting
      const clothMat = new THREE.MeshStandardMaterial({ 
        transparent: true, 
        opacity: 0, 
        side: THREE.FrontSide,
        depthWrite: true
      });
      const clothMesh = new THREE.Mesh(clothGeo, clothMat);
      clothMesh.position.set(...pos);
      clothMesh.rotation.set(...rot);
      mannequin.add(clothMesh);
      clothes[name] = clothMesh;

      return mesh;
    };

    // --- Build Organic Mannequin (8-Head Proportions) ---
    
    // Head & Neck
    addBodyPart(new THREE.SphereGeometry(0.14, 32, 32), 'head', [0, 1.7, 0]);
    addBodyPart(new THREE.CylinderGeometry(0.045, 0.055, 0.12), 'neck', [0, 1.58, 0]);

    // Torso (Organic Silhouette)
    const torsoPts = [];
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * 0.6;
      // Define a "V" taper for shoulders to waist to hips
      const x = 0.15 + (Math.sin(i * 0.35 + 3) * 0.06) + (i < 3 ? 0.04 : 0);
      torsoPts.push(new THREE.Vector2(x, y));
    }
    addBodyPart(new THREE.LatheGeometry(torsoPts, 32), 'torso', [0, 1.0, 0]);

    // Limbs (Capsules for smooth joints)
    // Natural "A" Pose Arms
    addBodyPart(new THREE.CapsuleGeometry(0.04, 0.45, 12, 24), 'leftArm', [-0.28, 1.35, 0], [0, 0, Math.PI * 0.1]);
    addBodyPart(new THREE.CapsuleGeometry(0.04, 0.45, 12, 24), 'rightArm', [0.28, 1.35, 0], [0, 0, -Math.PI * 0.1]);

    // Natural Legs
    addBodyPart(new THREE.CapsuleGeometry(0.07, 0.9, 12, 24), 'leftLeg', [-0.12, 0.5, 0]);
    addBodyPart(new THREE.CapsuleGeometry(0.07, 0.9, 12, 24), 'rightLeg', [0.12, 0.5, 0]);

    // Pelvis / Hips
    addBodyPart(new THREE.SphereGeometry(0.2, 32, 32), 'pelvis', [0, 1.0, 0]);

    sceneRef.current = { scene, camera, renderer, mannequin, parts, clothes, textureLoader };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      // Clean up resources properly
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update Body Morphology
  useEffect(() => {
    if (!sceneRef.current) return;
    const { parts, clothes, mannequin } = sceneRef.current;

    const sW = bodyParams.shoulderWidth;
    const wW = bodyParams.waistWidth;
    const hR = bodyParams.heightRatio;

    // Apply Scaling
    const torsoScale = [sW, 1, (sW + wW) / 2];
    parts['torso'].scale.set(torsoScale[0], torsoScale[1], torsoScale[2]);
    clothes['torso'].scale.set(torsoScale[0] * 1.02, torsoScale[1] * 1.02, torsoScale[2] * 1.02);

    parts['pelvis'].scale.set(wW, 1, wW);
    clothes['pelvis'].scale.set(wW * 1.02, 1, wW * 1.02);

    // Dynamically adjust arm anchor points
    const shoulderX = 0.28 * sW;
    parts['leftArm'].position.x = -shoulderX;
    clothes['leftArm'].position.x = -shoulderX;
    parts['rightArm'].position.x = shoulderX;
    clothes['rightArm'].position.x = shoulderX;

    // Apply height ratio to whole mannequin
    mannequin.scale.set(1, hR, 1);

  }, [bodyParams]);

  // Update Clothing Textures & Fit
  useEffect(() => {
    if (!sceneRef.current) return;
    const { clothes, textureLoader } = sceneRef.current;

    const top = equipped[Category.TOPS];
    const bottom = equipped[Category.BOTTOMS];
    const dress = equipped[Category.DRESSES];

    const updateTexture = async (meshNames: string[], item: ClosetItem | null | undefined) => {
      meshNames.forEach(name => {
        const mesh = clothes[name];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        
        if (item) {
          // Add cache bust to force fresh fetch with CORS headers if needed
          const url = item.imageUrl.includes('?') ? `${item.imageUrl}&cb=${Date.now()}` : `${item.imageUrl}?cb=${Date.now()}`;
          textureLoader.load(url, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            // Center mapping
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.repeat.set(1, 1);
            
            mat.map = texture;
            mat.opacity = 1;
            mat.color.set(0xffffff); // Clear color to show texture fully
            mat.needsUpdate = true;
          });
        } else {
          mat.map = null;
          mat.opacity = 0;
          mat.needsUpdate = true;
        }
      });
    };

    // Apply clothing based on selection logic
    if (dress) {
      updateTexture(['torso', 'pelvis', 'leftLeg', 'rightLeg'], dress);
      updateTexture(['leftArm', 'rightArm'], null);
    } else {
      updateTexture(['torso', 'leftArm', 'rightArm'], top);
      updateTexture(['pelvis', 'leftLeg', 'rightLeg'], bottom);
    }
  }, [equipped]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};

export default ThreeModel;
