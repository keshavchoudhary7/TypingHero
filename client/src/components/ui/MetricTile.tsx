import { useEffect, useRef, useState } from 'react';

type MetricTileProps = {
  label: string;
  value: string | number;
  accent: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';
  subtitle?: string;
  className?: string;
};

const accentConfig: Record<MetricTileProps['accent'], {
  bg: string;
  border: string;
  text: string;
  glow: string;
  topBar: string;
  iconBg: string;
  icon: string;
}> = {
  cyan: {
    bg: 'rgba(0,245,255,0.08)',
    border: 'rgba(0,245,255,0.30)',
    text: '#00f5ff',
    glow: 'rgba(0,245,255,0.35)',
    topBar: 'linear-gradient(90deg, #00f5ff, #0ea5e9)',
    iconBg: 'rgba(0,245,255,0.15)',
    icon: '⚡',
  },
  emerald: {
    bg: 'rgba(57,255,20,0.08)',
    border: 'rgba(57,255,20,0.30)',
    text: '#39ff14',
    glow: 'rgba(57,255,20,0.35)',
    topBar: 'linear-gradient(90deg, #39ff14, #10b981)',
    iconBg: 'rgba(57,255,20,0.15)',
    icon: '🎯',
  },
  violet: {
    bg: 'rgba(191,95,255,0.08)',
    border: 'rgba(191,95,255,0.30)',
    text: '#bf5fff',
    glow: 'rgba(191,95,255,0.35)',
    topBar: 'linear-gradient(90deg, #bf5fff, #8b5cf6)',
    iconBg: 'rgba(191,95,255,0.15)',
    icon: '⏱',
  },
  amber: {
    bg: 'rgba(255,183,3,0.10)',
    border: 'rgba(255,183,3,0.35)',
    text: '#ffb703',
    glow: 'rgba(255,183,3,0.45)',
    topBar: 'linear-gradient(90deg, #ffb703, #f59e0b)',
    iconBg: 'rgba(255,183,3,0.18)',
    icon: '📈',
  },
  rose: {
    bg: 'rgba(255,68,68,0.08)',
    border: 'rgba(255,68,68,0.30)',
    text: '#ff4444',
    glow: 'rgba(255,68,68,0.40)',
    topBar: 'linear-gradient(90deg, #ff4444, #f43f5e)',
    iconBg: 'rgba(255,68,68,0.15)',
    icon: '❌',
  },
};

export default function MetricTile({ label, value, accent, subtitle, className = '' }: MetricTileProps) {
  const cfg = accentConfig[accent];
  const prevValue = useRef(value);
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setPopped(true);
      const t = setTimeout(() => setPopped(false), 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [value]);

  return (
    <div
      className={`metric-card relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 ${popped ? 'metric-pop' : ''} ${className}`}
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        boxShadow: `0 0 20px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
        style={{ background: cfg.topBar }}
      />
      {/* Icon badge */}
      <div
        className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-base"
        style={{ background: cfg.iconBg }}
      >
        {cfg.icon}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.7)' }}>
        {label}
      </p>
      <p
        className="mt-1.5 text-2xl font-black tabular-nums"
        style={{
          color: cfg.text,
          textShadow: `0 0 12px ${cfg.glow}, 0 0 30px ${cfg.glow}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'rgba(100,116,139,0.8)' }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
