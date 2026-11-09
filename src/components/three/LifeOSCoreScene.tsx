'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface LifeOSCoreSceneProps {
  variant?: 'login' | 'dashboard' | 'ambient';
  interactive?: boolean;
  paused?: boolean;
  className?: string;
}

export default function LifeOSCoreScene({
  variant = 'dashboard',
  interactive = true,
  paused = false,
  className = '',
}: LifeOSCoreSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isDisposed = false;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = variant === 'ambient' ? 7.5 : variant === 'login' ? 6.0 : 5.6;

    // 3. Renderer setup with high-DPI clamping
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Track objects to cleanly dispose
    const disposables: { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }[] = [];

    // 4. Central Inner Core (Sapphire Blue Crystal)
    const coreRadius = variant === 'login' ? 1.2 : variant === 'dashboard' ? 1.2 : 0.95;
    const coreGeometry = new THREE.IcosahedronGeometry(coreRadius, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e5aa8, // Sapphire Blue
      emissive: 0x164584,
      emissiveIntensity: 0.5,
      roughness: 0.18,
      metalness: 0.7,
      wireframe: false,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);
    disposables.push({ geometry: coreGeometry, material: coreMaterial });

    // 5. Outer Wireframe Shell (Sunset Orange Digital Shield)
    const outerRadius = coreRadius * 1.45;
    const outerGeometry = new THREE.IcosahedronGeometry(outerRadius, 1);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0xf58220, // Sunset Orange
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    scene.add(outerMesh);
    disposables.push({ geometry: outerGeometry, material: outerMaterial });

    // 6. Orbital Rings (Sunset Orange & Vanilla Cream Gyroscope)
    const ring1Geom = new THREE.TorusGeometry(coreRadius * 1.85, 0.022, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0xf58220, // Sunset Orange
      transparent: true,
      opacity: 0.85,
    });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    scene.add(ring1);
    disposables.push({ geometry: ring1Geom, material: ring1Mat });

    const ring2Geom = new THREE.TorusGeometry(coreRadius * 2.2, 0.016, 16, 140);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xf5e6c8, // Vanilla Cream
      transparent: true,
      opacity: 0.75,
    });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    scene.add(ring2);
    disposables.push({ geometry: ring2Geom, material: ring2Mat });

    // 7. Light Airy Particle Field (Vanilla Cream Shimmer)
    const particleCount = variant === 'ambient' ? 80 : variant === 'login' ? 120 : 150;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * (variant === 'login' ? 6.0 : 4.8);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
      particleSpeeds[i] = 0.2 + Math.random() * 0.8;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf5e6c8, // Vanilla Cream
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlePoints);
    disposables.push({ geometry: particleGeometry, material: particleMaterial });

    // 8. Balanced Brand Palette Lighting System
    const ambientLight = new THREE.AmbientLight(0xfaf3e3, 1.3); // Warm Vanilla Cream ambient
    scene.add(ambientLight);

    const pointLightSunset = new THREE.PointLight(0xf58220, 3.0, 20); // Sunset Orange
    pointLightSunset.position.set(4, 3, 5);
    scene.add(pointLightSunset);

    const pointLightSapphire = new THREE.PointLight(0x1e5aa8, 3.5, 20); // Sapphire Blue
    pointLightSapphire.position.set(-4, -3, 3);
    scene.add(pointLightSapphire);

    const dirLight = new THREE.DirectionalLight(0xf5e6c8, 1.2); // Vanilla Cream directional key
    dirLight.position.set(2, 5, 4);
    scene.add(dirLight);
    scene.add(dirLight);

    // 9. Mouse Parallax & Smooth Damping
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const { innerWidth, innerHeight } = window;
      mouseX = (event.clientX / innerWidth - 0.5) * 2;
      mouseY = -(event.clientY / innerHeight - 0.5) * 2;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // 10. Resize Observer for flexible responsive layout
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && !isDisposed) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 11. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;

      animationFrameId = requestAnimationFrame(animate);

      if (pausedRef.current) {
        return; // Skip drawing when paused to save GPU/CPU cycles
      }

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera / target parallax interpolation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x = targetX * 0.8;
      camera.position.y = targetY * 0.5;
      camera.lookAt(scene.position);

      // Rotations
      coreMesh.rotation.y += delta * 0.4;
      coreMesh.rotation.x += delta * 0.2;

      // Pulse emissive slightly
      const pulse = Math.sin(elapsed * 1.5) * 0.2 + 0.6;
      coreMaterial.emissiveIntensity = pulse;

      outerMesh.rotation.y -= delta * 0.25;
      outerMesh.rotation.z += delta * 0.15;

      ring1.rotation.z += delta * 0.35;
      ring1.rotation.y += delta * 0.15;

      ring2.rotation.x += delta * 0.25;
      ring2.rotation.z -= delta * 0.2;

      // Slowly rotate particle field
      particlePoints.rotation.y += delta * 0.06;
      particlePoints.rotation.x += delta * 0.03;

      renderer.render(scene, camera);
    };

    // Initial render
    renderer.render(scene, camera);
    animate();

    // 12. Cleanup (disposal to prevent WebGL leaks per threejs best practices)
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }

      // Dispose all tracked geometries and materials
      disposables.forEach(({ geometry, material }) => {
        if (geometry) geometry.dispose();
        if (material) {
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
          }
        }
      });

      // Clear scene
      scene.clear();

      // Dispose renderer
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [variant, interactive]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}
