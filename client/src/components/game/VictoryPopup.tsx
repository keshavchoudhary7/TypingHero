import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import WorldMap from './WorldMap';
import type { Level } from '../../lib/typing';
import { useAuth } from '../../lib/authContext';

type LevelResult = { accuracy: number; wpm: number; stars: number };

type VictoryPopupProps = {
  visible: boolean;
  levels: Level[];
  completedLevels: number[];
  levelResults: Record<number, LevelResult>;
  activeLevelId: number;
  stats: { wpm: number; netWpm: number; accuracy: number; stars: number };
  onClose: () => void;
  onSelectLevel: (levelId: number) => void;
  challengeResult?: {
    won: boolean;
    challengerWpm: number;
    challengerAccuracy: number;
    challengerName: string;
    playerWpm: number;
    playerAccuracy: number;
  } | null;
};

export default function VictoryPopup({
  visible,
  levels,
  completedLevels,
  levelResults,
  activeLevelId,
  stats,
  onClose,
  onSelectLevel,
  challengeResult,
}: VictoryPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Entry animation
  useEffect(() => {
    if (!visible || !popupRef.current) return undefined;
    gsap.fromTo(
      popupRef.current,
      { y: 60, opacity: 0, scale: 0.92 },
      { duration: 0.55, y: 0, opacity: 1, scale: 1, ease: 'expo.out' },
    );
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { duration: 0.3, opacity: 1 });
    }
    return undefined;
  }, [visible]);

  // Three.js victory scene
  useEffect(() => {
    if (!visible || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pLight1 = new THREE.PointLight(0x00f5ff, 2, 50);
    pLight1.position.set(4, 4, 6);
    scene.add(pLight1);
    const pLight2 = new THREE.PointLight(0xbf5fff, 1.5, 50);
    pLight2.position.set(-4, -3, 6);
    scene.add(pLight2);

    // Trophy orb — color based on stars
    const orbColor = stats.stars === 3 ? 0xffd700 : stats.stars === 2 ? 0x00f5ff : 0xbf5fff;
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 48, 48),
      new THREE.MeshStandardMaterial({ color: orbColor, emissive: orbColor, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.6 }),
    );
    scene.add(orb);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: orbColor, transparent: true, opacity: 0.04, side: THREE.BackSide }),
    );
    scene.add(innerGlow);

    // Rings
    const ringColors = [0x00f5ff, 0xbf5fff, 0xff3cac];
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const rGeo = new THREE.RingGeometry(2.6 + i * 0.7, 2.8 + i * 0.7, 64);
      const rMat = new THREE.MeshBasicMaterial({ color: ringColors[i], transparent: true, opacity: 0.25 - i * 0.05, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI * (0.3 + i * 0.2);
      ring.rotation.y = Math.PI * (i * 0.15);
      rings.push(ring);
      scene.add(ring);
    }

    // Burst particles
    const particleGeo = new THREE.BufferGeometry();
    const pCount = 250;
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const palette = [[0, 0.96, 1], [0.75, 0.37, 1], [1, 0.24, 0.67], [1, 0.72, 0.01]];
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 4 + Math.random() * 4;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      pColors[i * 3] = c[0]; pColors[i * 3 + 1] = c[1]; pColors[i * 3 + 2] = c[2];
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.85 });
    const particles = new THREE.Points(particleGeo, pMat);
    scene.add(particles);

    const clock = new THREE.Clock();
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      orb.rotation.y = t * 0.4;
      orb.scale.setScalar(1 + Math.sin(t * 2.8) * 0.05);
      innerGlow.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
      rings[0].rotation.z = t * 0.5;
      rings[1].rotation.z = -t * 0.35;
      rings[2].rotation.y = t * 0.25;
      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.015;
      pLight1.intensity = 1.8 + Math.sin(t * 3) * 0.5;
      pLight2.intensity = 1.3 + Math.sin(t * 2.5 + 1) * 0.4;
      renderer.render(scene, camera);
    };
    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      rings.forEach((r) => { r.geometry.dispose(); (r.material as THREE.Material).dispose(); });
      orb.geometry.dispose(); (orb.material as THREE.Material).dispose();
      particleGeo.dispose(); pMat.dispose();
    };
  }, [visible, stats.stars]);

  const { user } = useAuth();
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedChallenge, setCopiedChallenge] = useState(false);

  const handleLevelSelect = (levelId: number) => {
    onSelectLevel(levelId);
    onClose();
  };

  const handleShareScore = () => {
    const shareText = `🛡️ I cleared Level ${activeLevelId} in TypingHeroes!\n⚡ Speed: ${stats.wpm} WPM\n🎯 Accuracy: ${stats.accuracy}%\n⭐ Stars: ${'★'.repeat(stats.stars)}\nCan you beat my record? Play now! ⚔️`;
    void navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleChallengeFriend = () => {
    const challengerName = user?.username || 'Guest Hero';
    const challengeLink = `${window.location.origin}/?challenge=${activeLevelId}:${encodeURIComponent(challengerName)}:${stats.wpm}:${stats.accuracy}`;
    const challengeText = `⚔️ Dungeon Challenge!\nI typed Level ${activeLevelId} at ${stats.wpm} WPM with ${stats.accuracy}% accuracy.\nAccept the challenge and try to beat my score here:\n${challengeLink}`;
    void navigator.clipboard.writeText(challengeText);
    setCopiedChallenge(true);
    setTimeout(() => setCopiedChallenge(false), 2000);
  };

  if (!visible) return null;

  const starColor = stats.stars === 3 ? '#ffd700' : stats.stars === 2 ? '#00f5ff' : '#bf5fff';
  const starGlow = stats.stars === 3 ? 'rgba(255,215,0,0.5)' : stats.stars === 2 ? 'rgba(0,245,255,0.5)' : 'rgba(191,95,255,0.5)';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(5,7,14,0.92)', backdropFilter: 'blur(14px)' }}
    >
      <div
        ref={popupRef}
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
        style={{
          maxHeight: 'calc(100vh - 2rem)',
          background: 'rgba(8,12,22,0.98)',
          border: '1px solid rgba(0,245,255,0.2)',
          boxShadow: '0 0 80px rgba(0,245,255,0.12), 0 0 160px rgba(191,95,255,0.08)',
        }}
      >
        {/* Sticky top accent line */}
        <div className="absolute inset-x-0 top-0 h-px shrink-0" style={{ background: 'linear-gradient(90deg, transparent, #00f5ff 30%, #bf5fff 70%, transparent)' }} />

        {/* ── STICKY HEADER ── */}
        <div
          className="shrink-0 flex items-center justify-between gap-4 px-5 pt-5 pb-3"
          style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.25)', color: '#00f5ff' }}
            >
              ⚡ Victory
            </span>
            <h2
              className="text-xl font-black text-white sm:text-2xl"
              style={{ textShadow: '0 0 20px rgba(0,245,255,0.3)' }}
            >
              Level Cleared! 🎉
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-slate-700/50 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-slate-500 hover:bg-slate-800 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
          >
            Continue →
          </button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5">

            {/* Friend Challenge Comparison Result */}
            {challengeResult && (
              <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-radial-gradient from-purple-500 via-transparent to-transparent" />
                <h3 className="text-center text-xs font-black uppercase tracking-widest text-indigo-400 mb-3.5">
                  ⚔️ Dungeon Challenge Results ⚔️
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Challenger */}
                  <div className="rounded-xl bg-slate-950/40 p-3.5 border border-slate-900 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Challenger</p>
                    <p className="text-sm font-black text-slate-300 mt-1 truncate">{challengeResult.challengerName}</p>
                    <div className="mt-2.5 flex justify-around text-xs font-mono">
                      <div>
                        <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-widest">WPM</span>
                        <span className="text-white font-bold">{challengeResult.challengerWpm}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-widest">Accuracy</span>
                        <span className="text-white font-bold">{challengeResult.challengerAccuracy}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Player */}
                  <div className={`rounded-xl p-3.5 border text-center relative ${challengeResult.won
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-rose-500/30 bg-rose-500/5'
                    }`}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">You</p>
                    <p className={`text-sm font-black mt-1 uppercase tracking-wider ${challengeResult.won ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'
                      }`}>
                      {challengeResult.won ? '🏆 Victory!' : '💀 Defeated'}
                    </p>

                    <div className="mt-2.5 flex justify-around text-xs font-mono">
                      <div>
                        <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-widest">WPM</span>
                        <span className="text-white font-bold">{challengeResult.playerWpm}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-widest">Accuracy</span>
                        <span className="text-white font-bold">{challengeResult.playerAccuracy}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats + 3D row — compact side-by-side */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr]">

              {/* 3D canvas — compact */}
              <div
                className="relative overflow-hidden rounded-xl sm:w-52"
                style={{ background: 'rgba(5,8,16,0.8)', border: '1px solid rgba(191,95,255,0.15)' }}
              >
                <canvas ref={canvasRef} className="h-36 w-full" />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
                  style={{ background: 'linear-gradient(transparent, rgba(5,8,16,0.8))' }}
                />
                <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: '1.1rem',
                          color: s <= stats.stars ? starColor : 'rgba(100,116,139,0.2)',
                          textShadow: s <= stats.stars ? `0 0 10px ${starGlow}` : 'none',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Run stats — 2×2 grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Gross WPM', value: stats.wpm, color: '#00f5ff', glow: 'rgba(0,245,255,0.3)', icon: '⚡' },
                  { label: 'Net WPM', value: stats.netWpm, color: '#bf5fff', glow: 'rgba(191,95,255,0.3)', icon: '🎯' },
                  { label: 'Accuracy', value: `${stats.accuracy}%`, color: '#39ff14', glow: 'rgba(57,255,20,0.3)', icon: '✓' },
                  { label: 'Stars', value: '★'.repeat(stats.stars), color: starColor, glow: starGlow, icon: '🏅' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl p-2.5 text-center"
                    style={{ background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}
                  >
                    <div className="mb-0.5 text-base">{item.icon}</div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.6)' }}>
                      {item.label}
                    </p>
                    <p
                      className="mt-0.5 text-xl font-black tabular-nums"
                      style={{ color: item.color, textShadow: `0 0 10px ${item.glow}`, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {value(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Share and Challenge actions */}
            <div className="mb-4 flex flex-wrap gap-2.5 justify-center sm:justify-start">
              <button
                onClick={handleShareScore}
                className="flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/30 hover:border-cyan-500/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-400 cursor-pointer transition-all"
              >
                <span>📋</span>
                <span>{copiedShare ? 'Copied Stats!' : 'Share Results'}</span>
              </button>
              <button
                onClick={handleChallengeFriend}
                className="flex items-center gap-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 hover:border-purple-500/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-purple-400 cursor-pointer transition-all"
              >
                <span>⚔️</span>
                <span>{copiedChallenge ? 'Challenge Link Copied!' : 'Challenge Friend'}</span>
              </button>
            </div>

            {/* World Map */}
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: '1px solid rgba(30,41,59,0.6)', background: 'rgba(5,8,16,0.7)' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}
              >
                <span className="text-sm">🗺</span>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>
                  World Map — Select Your Next Challenge
                </p>
              </div>
              <div className="p-3">
                <WorldMap
                  levels={levels}
                  completedLevels={completedLevels}
                  levelResults={levelResults}
                  activeLevelId={activeLevelId}
                  onSelectLevel={handleLevelSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to avoid TS complaints on mixed value types
function value(v: string | number): string | number { return v; }
