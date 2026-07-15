import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export default function OrbitalStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const colors = useMemo(() => ({
    core1: new THREE.Color('#00f5ff'),
    core2: new THREE.Color('#bf5fff'),
    star: new THREE.Color('#ff3cac'),
    ring1: new THREE.Color('#00f5ff'),
    ring2: new THREE.Color('#bf5fff'),
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(0, 0, 14);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pLight = new THREE.PointLight(0x00f5ff, 2.5, 60);
    pLight.position.set(4, 4, 8);
    scene.add(pLight);
    const pLight2 = new THREE.PointLight(0xbf5fff, 1.8, 60);
    pLight2.position.set(-5, -3, 5);
    scene.add(pLight2);

    // Core planet
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        emissive: 0x5b21b6,
        emissiveIntensity: 0.6,
        roughness: 0.15,
        metalness: 0.4,
      }),
    );
    scene.add(core);

    // Core atmosphere glow
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xbf5fff,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
      }),
    );
    scene.add(atmosphere);

    // Orbital rings
    const ringDefs = [
      { inner: 3.2, outer: 3.45, color: colors.ring1, opacity: 0.4, tiltX: 0.4, tiltY: 0.1, speed: 0.28 },
      { inner: 4.2, outer: 4.4, color: colors.ring2, opacity: 0.28, tiltX: 0.9, tiltY: 0.3, speed: -0.18 },
      { inner: 5.4, outer: 5.55, color: new THREE.Color('#ff3cac'), opacity: 0.18, tiltX: 1.2, tiltY: -0.2, speed: 0.12 },
    ];
    const rings: { mesh: THREE.Mesh; speed: number }[] = ringDefs.map(({ inner, outer, color, opacity, tiltX, tiltY, speed }) => {
      const geo = new THREE.RingGeometry(inner, outer, 80);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = tiltX;
      mesh.rotation.y = tiltY;
      scene.add(mesh);
      return { mesh, speed };
    });

    // Orbiting satellites
    const satellites: { pivot: THREE.Object3D; speed: number }[] = [];
    const satColors = [0x00f5ff, 0xffb703, 0xff3cac];
    satColors.forEach((color, i) => {
      const pivot = new THREE.Object3D();
      pivot.rotation.x = (i * Math.PI * 2) / 3 + 0.4;
      pivot.rotation.y = (i * Math.PI * 0.8);
      const sat = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.1 }),
      );
      const dist = 3.5 + i * 0.4;
      sat.position.set(dist, 0, 0);
      pivot.add(sat);
      scene.add(pivot);
      satellites.push({ pivot, speed: 0.6 + i * 0.3 });
    });

    // Star field — multi-color
    const starGeo = new THREE.BufferGeometry();
    const starCount = 320;
    const sPos = new Float32Array(starCount * 3);
    const sColors = new Float32Array(starCount * 3);
    const starPalette = [
      [0, 0.96, 1],    // cyan
      [0.75, 0.37, 1], // purple
      [1, 0.72, 0.01], // amber
      [1, 1, 1],       // white
    ];
    for (let i = 0; i < starCount; i++) {
      sPos[i * 3]     = (Math.random() - 0.5) * 24;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 24;
      const c = starPalette[Math.floor(Math.random() * starPalette.length)];
      sColors[i * 3] = c[0]; sColors[i * 3 + 1] = c[1]; sColors[i * 3 + 2] = c[2];
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(sColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.8 });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const clock = new THREE.Clock();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const delta = clock.getDelta();

      core.rotation.y = t * 0.2;
      core.rotation.x = Math.sin(t * 0.3) * 0.1;
      atmosphere.rotation.y = -t * 0.1;

      // Pulsing core glow
      const pulse = 1 + Math.sin(t * 2.4) * 0.04;
      core.scale.setScalar(pulse);
      atmosphere.scale.setScalar(1 + Math.sin(t * 1.8) * 0.08);

      rings.forEach(({ mesh, speed }) => { mesh.rotation.z += delta * speed; });
      satellites.forEach(({ pivot, speed }) => { pivot.rotation.z += delta * speed; });

      starfield.rotation.y = t * 0.015;
      starfield.rotation.x = Math.sin(t * 0.07) * 0.03;

      // Animate point lights
      pLight.intensity = 2.2 + Math.sin(t * 2.1) * 0.6;
      pLight2.intensity = 1.5 + Math.sin(t * 1.7 + 1) * 0.5;
      pLight.position.x = Math.sin(t * 0.5) * 5;
      pLight.position.y = Math.cos(t * 0.4) * 4;

      renderer.render(scene, camera);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rings.forEach(({ mesh }) => { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); });
      core.geometry.dispose(); (core.material as THREE.Material).dispose();
      atmosphere.geometry.dispose(); (atmosphere.material as THREE.Material).dispose();
      starGeo.dispose(); starMat.dispose();
    };
  }, [colors]);

  return (
    <div className="relative overflow-hidden" style={{ background: 'rgba(5,8,16,0.95)' }}>
      <canvas ref={canvasRef} className="h-64 w-full" />
      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
        style={{ background: 'linear-gradient(transparent, rgba(5,8,16,0.9))' }}
      />
      {/* Label */}
      <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: '#bf5fff', boxShadow: '0 0 6px #bf5fff', animation: 'live-pulse 2s ease-in-out infinite' }}
        />
        <span
          className="text-[9px] font-bold uppercase tracking-[0.25em]"
          style={{ color: 'rgba(191,95,255,0.6)' }}
        >
          Orbital Challenge Stage
        </span>
      </div>
    </div>
  );
}
