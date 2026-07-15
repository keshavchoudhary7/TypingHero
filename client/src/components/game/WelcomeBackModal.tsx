import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { WelcomeBackType } from '../../lib/xp';
import { getHeroRank } from '../../lib/xp';

type WelcomeBackModalProps = {
  type: WelcomeBackType;
  streak: number;
  totalXp: number;
  onDismiss: () => void;
};

const config: Record<NonNullable<WelcomeBackType>, {
  icon: string;
  title: string;
  subtitle: (streak: number) => string;
  accentColor: string;
  accentGlow: string;
  ctaLabel: string;
}> = {
  first_time: {
    icon: '🚀',
    title: 'Welcome to TypingHero!',
    subtitle: () => 'Your journey to elite typing starts now. Complete levels to earn XP and climb the ranks.',
    accentColor: '#00f5ff',
    accentGlow: 'rgba(0,245,255,0.3)',
    ctaLabel: 'Start my journey',
  },
  streak_at_risk: {
    icon: '⚠️',
    title: 'Streak at Risk!',
    subtitle: (streak) => `You have a ${streak}-day streak — but today hasn't been logged yet. Play now to keep it alive!`,
    accentColor: '#ffb703',
    accentGlow: 'rgba(255,183,3,0.35)',
    ctaLabel: 'Protect my streak',
  },
  streak_broken: {
    icon: '💔',
    title: 'Streak Lost',
    subtitle: (streak) => `You missed a day and your ${streak}-day streak was reset. Start fresh today!`,
    accentColor: '#ff4444',
    accentGlow: 'rgba(255,68,68,0.3)',
    ctaLabel: 'Start a new streak',
  },
  streak_continued: {
    icon: '🔥',
    title: 'Welcome Back!',
    subtitle: (streak) => `Good to see you again! You're on a ${streak}-day streak. Keep the fire going!`,
    accentColor: '#ff6b35',
    accentGlow: 'rgba(255,107,53,0.35)',
    ctaLabel: 'Continue my streak',
  },
};

export default function WelcomeBackModal({ type, streak, totalXp, onDismiss }: WelcomeBackModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cardRef.current || !overlayRef.current) return undefined;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { duration: 0.25, opacity: 1 });
    gsap.fromTo(cardRef.current, { y: 50, opacity: 0, scale: 0.9 }, { duration: 0.5, y: 0, opacity: 1, scale: 1, ease: 'expo.out', delay: 0.1 });
    return undefined;
  }, []);

  if (!type) return null;

  const cfg = config[type];
  const rank = getHeroRank(totalXp);

  const dismiss = () => {
    if (cardRef.current && overlayRef.current) {
      gsap.to(cardRef.current, { duration: 0.25, y: 30, opacity: 0, scale: 0.95, ease: 'power2.in', onComplete: onDismiss });
      gsap.to(overlayRef.current, { duration: 0.25, opacity: 0 });
    } else {
      onDismiss();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,7,14,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={dismiss}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(8,12,22,0.98)',
          border: `1px solid ${cfg.accentColor}35`,
          boxShadow: `0 0 60px ${cfg.accentGlow}, 0 0 120px ${cfg.accentGlow}60`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.accentColor}, transparent)` }} />

        {/* Icon */}
        <div className="mb-4 text-5xl" style={{ animation: 'level-up-burst 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {cfg.icon}
        </div>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-black text-white" style={{ textShadow: `0 0 20px ${cfg.accentColor}50` }}>
          {cfg.title}
        </h2>
        <p className="mb-5 text-sm text-slate-400">{cfg.subtitle(streak)}</p>

        {/* Rank card */}
        <div
          className="mx-auto mb-5 flex w-fit items-center gap-3 rounded-xl px-4 py-2.5"
          style={{ background: `${rank.color}12`, border: `1px solid ${rank.color}30` }}
        >
          <span className="text-xl">{rank.icon}</span>
          <div className="text-left">
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.6)' }}>Current Rank</p>
            <p className="text-base font-black" style={{ color: rank.color }}>{rank.title}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-600">Total XP</p>
            <p className="font-black tabular-nums text-sm" style={{ color: rank.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {totalXp.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && type !== 'first_time' && (
          <div
            className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)' }}
          >
            <span className="text-lg">🔥</span>
            <span className="font-black tabular-nums" style={{ color: '#ff6b35', fontFamily: "'JetBrains Mono', monospace" }}>
              {streak} day streak
            </span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200"
          style={{
            background: `linear-gradient(135deg, ${cfg.accentColor}20, ${cfg.accentColor}10)`,
            border: `1px solid ${cfg.accentColor}45`,
            color: cfg.accentColor,
            boxShadow: `0 0 20px ${cfg.accentGlow}`,
          }}
        >
          {cfg.ctaLabel} →
        </button>

        <button
          onClick={dismiss}
          className="mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
