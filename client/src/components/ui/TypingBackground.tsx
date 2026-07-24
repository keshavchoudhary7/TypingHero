import React, { useEffect, useState } from 'react';

const MECHANICAL_KEYS_LEFT = [
  { char: 'Q', row: 0, col: 0, delay: '1.2s' },
  { char: 'W', row: 0, col: 1, delay: '0.4s' },
  { char: 'E', row: 0, col: 2, delay: '2.8s' },
  { char: 'R', row: 0, col: 3, delay: '1.8s' },
  { char: 'A', row: 1, col: 0, delay: '2.0s' },
  { char: 'S', row: 1, col: 1, delay: '0.8s' },
  { char: 'D', row: 1, col: 2, delay: '1.5s' },
  { char: 'F', row: 1, col: 3, delay: '3.2s' },
  { char: 'Z', row: 2, col: 0, delay: '0.2s' },
  { char: 'X', row: 2, col: 1, delay: '2.4s' },
  { char: 'C', row: 2, col: 2, delay: '1.0s' },
  { char: 'V', row: 2, col: 3, delay: '3.6s' },
];

const MECHANICAL_KEYS_RIGHT = [
  { char: 'O', row: 0, col: 0, delay: '0.6s' },
  { char: 'P', row: 0, col: 1, delay: '1.9s' },
  { char: '[', row: 0, col: 2, delay: '3.0s' },
  { char: ']', row: 0, col: 3, delay: '2.5s' },
  { char: 'K', row: 1, col: 0, delay: '1.4s' },
  { char: 'L', row: 1, col: 1, delay: '0.2s' },
  { char: ';', row: 1, col: 2, delay: '2.1s' },
  { char: "'", row: 1, col: 3, delay: '3.5s' },
  { char: 'M', row: 2, col: 0, delay: '1.0s' },
  { char: ',', row: 2, col: 1, delay: '2.7s' },
  { char: '.', row: 2, col: 2, delay: '0.9s' },
  { char: '/', row: 2, col: 3, delay: '3.8s' },
];

const CODE_LINES = [
  'const arena = new MatchArena();',
  'await arena.connect({ lobby: "multiplayer" });',
  '// WPM: 148 | ACC: 99.4% | RANK: Mythic',
  'arena.on("keypress", (key) => hero.attack());',
  'git commit -m "feat: level up typing hero"',
  'npm run play:solo --theme=cyberpunk',
  '// Connecting to matchmaking server...',
  'const wpm = player.calculateWPM();',
  'if (wpm > 120) player.triggerUltimate();',
  'arena.broadcast("GG WP! Ready for rematch.");',
];

export default function TypingBackground() {
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  
  // Simulated Live Metrics
  const [wpm, setWpm] = useState(132);
  const [acc, setAcc] = useState(99.2);
  const [combo, setCombo] = useState(48);

  // Typewriter effect simulator
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const targetLine = CODE_LINES[currentLineIndex];

    if (currentCharIndex < targetLine.length) {
      timer = setTimeout(() => {
        setCurrentText((prev) => prev + targetLine[currentCharIndex]);
        setCurrentCharIndex((prev) => prev + 1);
      }, 50 + Math.random() * 60); // Variable typing speed
    } else {
      // Line complete: wait 1.8 seconds, then clear and write next line
      timer = setTimeout(() => {
        setTypedLines((prev) => {
          const next = [...prev, targetLine];
          if (next.length > 4) next.shift(); // Keep last 4 lines
          return next;
        });
        setCurrentText('');
        setCurrentCharIndex(0);
        setCurrentLineIndex((prev) => (prev + 1) % CODE_LINES.length);
      }, 1800);
    }

    return () => clearTimeout(timer);
  }, [currentLineIndex, currentCharIndex]);

  // Jitter WPM & Metrics to feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setWpm((prev) => {
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.max(120, Math.min(160, prev + change));
      });
      setAcc((prev) => {
        const change = (Math.random() * 0.4 - 0.2); // -0.2 to +0.2
        return parseFloat(Math.max(98.5, Math.min(100.0, prev + change)).toFixed(1));
      });
      setCombo((prev) => {
        const change = Math.random() > 0.7 ? 1 : Math.random() > 0.85 ? -2 : 0;
        return Math.max(30, prev + change);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        @keyframes waveShift {
          0% { stroke-dashoffset: 1200; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes keycapPress {
          0%, 15%, 100% {
            fill: rgba(10, 14, 28, 0.7);
            stroke: rgba(51, 65, 85, 0.4);
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 0 0px rgba(6, 182, 212, 0));
          }
          5% {
            fill: rgba(6, 182, 212, 0.15);
            stroke: rgba(6, 182, 212, 0.8);
            transform: translateY(2px) scale(0.95);
            filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6));
          }
          10% {
            fill: rgba(147, 51, 234, 0.15);
            stroke: rgba(147, 51, 234, 0.8);
            transform: translateY(1px) scale(0.97);
            filter: drop-shadow(0 0 6px rgba(147, 51, 234, 0.4));
          }
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.6); opacity: 1; }
        }

        @keyframes driftParticle {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-10vh) translateX(50px); opacity: 0; }
        }

        .animated-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(6, 182, 212, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.04) 1px, transparent 1px);
          animation: gridMove 20s linear infinite;
        }

        .key-sim {
          animation: keycapPress 4s ease-in-out infinite;
        }
      `}</style>

      {/* Cyber Grid Base */}
      <div className="absolute inset-0 animated-grid bg-[#05070f]" />

      {/* Radiant Glowing Orbs */}
      <div className="absolute top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] h-[400px] w-[400px] rounded-full bg-pink-500/3 blur-[120px] pointer-events-none" />

      {/* Scrolling Speed waves (SVGs) */}
      <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
        {/* Speed Wave 1 (Cyan) */}
        <path
          d="M -100 400 C 300 250, 500 550, 900 380 C 1300 210, 1600 500, 2100 350"
          fill="none"
          stroke="rgba(6, 182, 212, 0.25)"
          strokeWidth="2"
          strokeDasharray="1200"
          strokeDashoffset="1200"
          style={{ animation: 'waveShift 15s linear infinite' }}
        />
        {/* Speed Wave 2 (Purple) */}
        <path
          d="M -50 480 C 350 580, 700 250, 1100 430 C 1500 610, 1750 300, 2150 480"
          fill="none"
          stroke="rgba(147, 51, 234, 0.2)"
          strokeWidth="2.5"
          strokeDasharray="1400"
          strokeDashoffset="1400"
          style={{ animation: 'waveShift 18s linear infinite reverse', animationDelay: '-3s' }}
        />
      </svg>

      {/* Ambient Floating Keycap Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => {
          const size = 20 + (i % 3) * 10;
          const left = 5 + (i * 17) % 90;
          const duration = 12 + (i % 4) * 4;
          const delay = i * -3.5;
          const label = ['A', 'Ctrl', 'Alt', 'Enter', 'Space', 'Shift'][i % 6];
          return (
            <div
              key={i}
              className="absolute border border-slate-700/20 bg-slate-900/5 text-slate-500/20 rounded font-mono font-bold flex items-center justify-center pointer-events-none"
              style={{
                width: size * 1.5,
                height: size,
                left: `${left}%`,
                animation: `driftParticle ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                fontSize: `${size * 0.4}px`,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* LEFT SIDE PANEL HUD (Visible on larger screens) */}
      <div className="hidden xl:flex flex-col gap-6 absolute left-12 top-1/2 -translate-y-1/2 w-80 pointer-events-none z-10">
        
        {/* Terminal Sandbox code-typing card */}
        <div className="rounded-xl border border-slate-800/60 bg-[#070b16]/75 p-5 backdrop-blur-md shadow-lg glow-cyan/5">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            <span className="ml-2 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              typing-hero-sandbox
            </span>
          </div>

          <div className="font-mono text-xs text-slate-400 space-y-2 h-[120px] overflow-hidden flex flex-col justify-end">
            {typedLines.map((line, idx) => (
              <div key={idx} className="opacity-40 transition-opacity duration-300 truncate">
                <span className="text-cyan-500/60 font-semibold mr-1.5">&gt;</span> {line}
              </div>
            ))}
            <div className="text-cyan-400 font-medium flex items-center truncate">
              <span className="text-cyan-400 font-bold mr-1.5">&gt;</span>
              {currentText}
              <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Keyboard Keycap Module (Left) */}
        <div className="rounded-xl border border-slate-800/60 bg-[#070b16]/75 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-3.5 text-left border-b border-slate-800/60 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Input Arena Matrix (Left)
            </span>
          </div>

          <svg width="250" height="110" viewBox="0 0 250 110" className="mx-auto">
            {MECHANICAL_KEYS_LEFT.map((key) => {
              const kw = 48;
              const kh = 28;
              const gapX = 8;
              const gapY = 8;
              const x = key.col * (kw + gapX) + (key.row * 10);
              const y = key.row * (kh + gapY);
              return (
                <g key={key.char} className="select-none">
                  <rect
                    x={x}
                    y={y}
                    width={kw}
                    height={kh}
                    rx="6"
                    className="key-sim"
                    style={{
                      animationDelay: key.delay,
                      cursor: 'default',
                    }}
                  />
                  <text
                    x={x + kw / 2}
                    y={y + kh / 2 + 4}
                    textAnchor="middle"
                    fill="rgba(148, 163, 184, 0.7)"
                    className="font-mono text-[9px] font-bold pointer-events-none"
                  >
                    {key.char}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* RIGHT SIDE PANEL HUD (Visible on larger screens) */}
      <div className="hidden xl:flex flex-col gap-6 absolute right-12 top-1/2 -translate-y-1/2 w-80 pointer-events-none z-10">
        
        {/* Game Performance Dashboard */}
        <div className="rounded-xl border border-slate-800/60 bg-[#070b16]/75 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800/60 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Hero Battle Stats
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-bold text-cyan-400 uppercase tracking-wider animate-pulse">
              ● Match Arena
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Speed
              </div>
              <div className="mt-1 text-lg font-black text-cyan-400 tracking-tight transition-all duration-300">
                {wpm} <span className="text-[8px] font-bold text-slate-400 uppercase">Wpm</span>
              </div>
            </div>
            <div className="text-center border-x border-slate-800/60">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Accuracy
              </div>
              <div className="mt-1 text-lg font-black text-purple-400 tracking-tight transition-all duration-300">
                {acc}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Combo
              </div>
              <div className="mt-1 text-lg font-black text-pink-500 tracking-tight transition-all duration-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                {combo}
              </div>
            </div>
          </div>
        </div>

        {/* Speed Chart Graph Module */}
        <div className="rounded-xl border border-slate-800/60 bg-[#070b16]/75 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-4 flex justify-between items-center border-b border-slate-800/60 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              WPM Chart (Last 10s)
            </span>
            <span className="text-[9px] font-mono text-cyan-500 font-bold uppercase">
              Avg: 139 WPM
            </span>
          </div>

          {/* SVG Sparkline / Graph */}
          <div className="relative">
            <svg width="240" height="90" viewBox="0 0 240 90">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                </linearGradient>
              </defs>
              
              <line x1="0" y1="20" x2="240" y2="20" stroke="rgba(51, 65, 85, 0.15)" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="240" y2="50" stroke="rgba(51, 65, 85, 0.15)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="240" y2="80" stroke="rgba(51, 65, 85, 0.15)" />

              {/* Area under curve */}
              <path
                d="M 0 90 L 0 50 Q 30 65, 60 40 T 120 25 T 180 55 T 240 30 L 240 90 Z"
                fill="url(#chartGrad)"
              />

              {/* The Line */}
              <path
                d="M 0 50 Q 30 65, 60 40 T 120 25 T 180 55 T 240 30"
                fill="none"
                stroke="rgb(6, 182, 212)"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
              />

              {/* Glowing Dot on WPM wave */}
              <circle cx="120" cy="25" r="4.5" fill="rgb(0, 245, 255)" style={{ animation: 'dotPulse 2s infinite' }} />
              <circle cx="240" cy="30" r="4" fill="rgb(168, 85, 247)" />
            </svg>
          </div>
        </div>

        {/* Keyboard Keycap Module (Right) */}
        <div className="rounded-xl border border-slate-800/60 bg-[#070b16]/75 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-3.5 text-left border-b border-slate-800/60 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Input Arena Matrix (Right)
            </span>
          </div>

          <svg width="250" height="110" viewBox="0 0 250 110" className="mx-auto">
            {MECHANICAL_KEYS_RIGHT.map((key) => {
              const kw = 48;
              const kh = 28;
              const gapX = 8;
              const gapY = 8;
              const x = key.col * (kw + gapX) + (key.row * 10);
              const y = key.row * (kh + gapY);
              return (
                <g key={key.char} className="select-none">
                  <rect
                    x={x}
                    y={y}
                    width={kw}
                    height={kh}
                    rx="6"
                    className="key-sim"
                    style={{
                      animationDelay: key.delay,
                      cursor: 'default',
                    }}
                  />
                  <text
                    x={x + kw / 2}
                    y={y + kh / 2 + 4}
                    textAnchor="middle"
                    fill="rgba(148, 163, 184, 0.7)"
                    className="font-mono text-[9px] font-bold pointer-events-none"
                  >
                    {key.char}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
