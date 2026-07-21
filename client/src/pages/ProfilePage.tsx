import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { getHeroRank } from '../lib/xp';

type ProfilePageProps = {
  completedLevels: number[];
  levelResults: Record<number, { accuracy: number; wpm: number; netWpm: number; stars: number }>;
  streak: number;
  totalXp: number;
};

const FREE_AVATARS = [
  { id: 'knight',  emoji: '🛡️', name: 'Knight',  desc: 'The Valiant Defender', color: '#00f5ff' },
  { id: 'wizard',  emoji: '🔮', name: 'Wizard',  desc: 'The Arcane Master',    color: '#bf5fff' },
  { id: 'rogue',   emoji: '🗡️', name: 'Rogue',   desc: 'The Shadow Blade',    color: '#ff3cac' },
  { id: 'ranger',  emoji: '🏹', name: 'Ranger',  desc: 'The Swift Tracker',   color: '#39ff14' },
  { id: 'cleric',  emoji: '❇️', name: 'Cleric',  desc: 'The Divine Healer',   color: '#ffb703' },
];

const PREMIUM_AVATARS = [
  { id: 'dragon',      emoji: '🐲', name: 'Dragon Lord' },
  { id: 'phoenix',     emoji: '🦅', name: 'Phoenix'     },
  { id: 'necromancer', emoji: '💀', name: 'Necromancer' },
  { id: 'paladin',     emoji: '⚔️', name: 'Paladin'     },
  { id: 'berserker',   emoji: '🪓', name: 'Berserker'   },
];

const NEXT_RANK_TITLES = ['Apprentice','Practitioner','Specialist','Expert','Master','Grandmaster','Legend',''];

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  currentUsername,
  onClose,
  onSave,
}: {
  currentUsername: string;
  onClose: () => void;
  onSave: (newUsername: string) => Promise<void>;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 3)           { setError('Must be at least 3 characters.'); return; }
    if (trimmed.length > 20)          { setError('Must be at most 20 characters.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setError('Only letters, numbers & underscores.'); return; }
    if (trimmed === currentUsername)  { onClose(); return; }
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to update. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,7,17,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-8 overflow-hidden"
        style={{
          background: 'rgba(10,14,28,0.98)',
          borderColor: 'rgba(0,245,255,0.18)',
          boxShadow: '0 0 100px rgba(0,245,255,0.07), 0 40px 80px rgba(0,0,0,0.85)',
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-48"
          style={{ background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)' }} />
        {/* Corner accent */}
        <div className="absolute top-0 right-0 h-16 w-16 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(0,245,255,0.06), transparent)' }} />

        <div className="mb-6">
          <h2 className="text-xl font-black text-white tracking-tight">Edit Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">Forge your hero identity</p>
        </div>

        {/* Username field */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm select-none">@</span>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
              maxLength={20}
              spellCheck={false}
              className="w-full rounded-xl border pl-8 pr-4 py-3 text-sm font-bold text-white outline-none transition-all font-mono"
              style={{
                background: 'rgba(5,10,20,0.9)',
                borderColor: error ? 'rgba(255,68,68,0.5)' : 'rgba(0,245,255,0.2)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,245,255,0.55)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,245,255,0.09), 0 0 20px rgba(0,245,255,0.05)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? 'rgba(255,68,68,0.5)' : 'rgba(0,245,255,0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {error
              ? <p className="text-[10px] text-red-400 font-semibold">{error}</p>
              : <p className="text-[10px] text-slate-600">Letters, numbers &amp; underscores only</p>
            }
            <p className="text-[10px] text-slate-600">{username.length}/20</p>
          </div>
        </div>

        {/* Coming-soon fields */}
        <div
          className="mb-5 rounded-xl border p-4 opacity-45 select-none"
          style={{ background: 'rgba(5,10,20,0.5)', borderColor: 'rgba(100,116,139,0.12)' }}
        >
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
            🔒 More Fields — Unlock with Premium
          </p>
          {['Display Name', 'Bio / Status', 'Country / Region'].map((f) => (
            <div key={f} className="h-8 rounded-lg bg-slate-900/50 flex items-center px-3 mb-1.5 last:mb-0">
              <span className="text-[10px] text-slate-600">{f}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider text-slate-400 transition-all hover:text-slate-200 cursor-pointer"
            style={{ borderColor: 'rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(100,116,139,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(100,116,139,0.2)')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-wider text-black transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #00f5ff, #6366f1)',
              boxShadow: saving ? 'none' : '0 0 24px rgba(0,245,255,0.25)',
            }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div
      className="group relative rounded-2xl border p-5 text-center overflow-hidden transition-all duration-300 cursor-default"
      style={{ background: 'rgba(10,14,28,0.88)', borderColor: 'rgba(100,116,139,0.13)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}35`;
        e.currentTarget.style.boxShadow = `0 0 28px ${color}12`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(100,116,139,0.13)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = '';
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}07 0%, transparent 70%)` }} />
      <span className="text-2xl mb-2 block">{icon}</span>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{label}</p>
      <p className="text-xl font-black font-mono" style={{ color, textShadow: `0 0 15px ${color}50` }}>
        {value}
      </p>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage({ completedLevels, levelResults, streak, totalXp }: ProfilePageProps) {
  const { user, updateAvatar, updateUsername } = useAuth();
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const rankInfo           = getHeroRank(totalXp);
  const totalLevelsCompleted = completedLevels.length;
  const resultsArray       = Object.values(levelResults);

  const avgWpm      = resultsArray.length > 0 ? Math.round(resultsArray.reduce((a, r) => a + r.wpm, 0) / resultsArray.length) : 0;
  const avgAccuracy = resultsArray.length > 0 ? Math.round(resultsArray.reduce((a, r) => a + r.accuracy, 0) / resultsArray.length) : 0;
  const maxWpm      = resultsArray.length > 0 ? Math.max(...resultsArray.map((r) => r.wpm)) : 0;
  const totalStars  = resultsArray.reduce((a, r) => a + r.stars, 0);

  const activeAvatar = FREE_AVATARS.find((av) => av.id === (user?.avatarId || 'knight')) || FREE_AVATARS[0];

  const handleAvatarChange = async (avatarId: string) => {
    setUpdatingId(avatarId);
    await updateAvatar(avatarId);
    setUpdatingId(null);
  };

  const handleSaveUsername = async (newUsername: string) => {
    if (!updateUsername) throw new Error('Update not supported');
    const ok = await updateUsername(newUsername);
    if (!ok) throw new Error('Username may already be taken. Try another.');
  };

  return (
    <>
      {showEditModal && (
        <EditProfileModal
          currentUsername={user?.username || ''}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveUsername}
        />
      )}

      <div className="relative min-h-screen pb-16 text-white">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="ambient-orb absolute -top-20 left-[8%] h-72 w-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.055) 0%, transparent 70%)' }} />
          <div className="ambient-orb-2 absolute top-48 right-[4%] h-80 w-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(191,95,255,0.045) 0%, transparent 70%)' }} />
          <div className="ambient-orb-3 absolute bottom-24 left-[35%] h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,60,172,0.035) 0%, transparent 70%)' }} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4">

          {/* ═══ HERO HEADER ═══════════════════════════════════════════════════ */}
          <div
            className="relative mb-6 overflow-hidden rounded-3xl border"
            style={{
              background: 'linear-gradient(140deg, rgba(10,14,28,0.97) 0%, rgba(12,18,38,0.97) 100%)',
              borderColor: 'rgba(0,245,255,0.11)',
              boxShadow: '0 0 70px rgba(0,245,255,0.04), 0 24px 48px rgba(0,0,0,0.55)',
            }}
          >
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,245,255,0.45), rgba(191,95,255,0.3), transparent 90%)' }} />
            {/* Subtle scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.012]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)' }} />

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8">
              {/* Avatar sphere */}
              <div className="relative flex-shrink-0">
                <div
                  className="animate-float relative h-28 w-28 rounded-full flex items-center justify-center text-5xl select-none"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, ${activeAvatar.color}1a, rgba(5,7,17,0.92))`,
                    border: `2px solid ${activeAvatar.color}38`,
                    boxShadow: `0 0 40px ${activeAvatar.color}22, 0 0 90px ${activeAvatar.color}0e, inset 0 0 30px rgba(0,0,0,0.55)`,
                  }}
                >
                  {activeAvatar.emoji}
                  <div
                    className="animate-pulse-ring absolute inset-0 rounded-full"
                    style={{ border: `1px solid ${activeAvatar.color}22` }}
                  />
                </div>
                <div
                  className="absolute -bottom-1.5 -right-1.5 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider"
                  style={{ background: rankInfo.color, color: '#000', boxShadow: `0 0 10px ${rankInfo.color}55` }}
                >
                  Lv.{rankInfo.level}
                </div>
              </div>

              {/* Hero info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Username — truncated with max-w so it never breaks layout */}
                  <h1
                    className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-indigo-300 bg-clip-text text-transparent"
                    style={{
                      maxWidth: '280px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={user?.username || 'Hero'}
                  >
                    {user?.username || 'Hero'}
                  </h1>
                  <button
                    id="edit-profile-btn"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1.5 self-center sm:self-auto rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-125 active:scale-95 cursor-pointer flex-shrink-0"
                    style={{ borderColor: 'rgba(0,245,255,0.22)', background: 'rgba(0,245,255,0.06)', color: '#00f5ff' }}
                  >
                    ✏️ Edit
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap justify-center sm:justify-start gap-x-2 gap-y-0.5">
                  <span style={{ color: activeAvatar.color }}>{activeAvatar.emoji} {activeAvatar.name}</span>
                  <span className="text-slate-700">·</span>
                  <span style={{ color: rankInfo.color }}>{rankInfo.icon} {rankInfo.title}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-500">{totalLevelsCompleted} levels cleared</span>
                </p>

                {/* XP bar */}
                <div className="mt-4 w-full max-w-sm mx-auto sm:mx-0">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    <span>XP Progress</span>
                    <span className="font-mono" style={{ color: rankInfo.color }}>
                      {totalXp.toLocaleString()}
                      {rankInfo.maxXp !== Infinity && ` / ${rankInfo.maxXp.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full"
                    style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(100,116,139,0.13)' }}>
                    <div
                      className="xp-bar-animate h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${rankInfo.progressPct}%`,
                        background: `linear-gradient(90deg, ${activeAvatar.color}, #6366f1)`,
                        boxShadow: `0 0 12px ${activeAvatar.color}45`,
                      }}
                    />
                  </div>
                  {rankInfo.maxXp !== Infinity && (
                    <p className="text-[9px] text-slate-600 mt-1 font-mono">
                      {(rankInfo.maxXp - totalXp).toLocaleString()} XP to {NEXT_RANK_TITLES[rankInfo.level - 1]}
                    </p>
                  )}
                </div>
              </div>

              {/* Stars badge */}
              <div
                className="flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl border px-5 py-4 text-center"
                style={{ background: 'rgba(255,183,3,0.05)', borderColor: 'rgba(255,183,3,0.14)' }}
              >
                <span className="text-3xl select-none">⭐</span>
                <p className="text-2xl font-black font-mono leading-none" style={{ color: '#ffb703', textShadow: '0 0 18px rgba(255,183,3,0.4)' }}>
                  {totalStars}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Stars</p>
              </div>
            </div>
          </div>

          {/* ═══ STAT CARDS ════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Best WPM"     value={maxWpm      ? `${maxWpm}`      : '—'} color="#bf5fff" icon="⚡" />
            <StatCard label="Avg WPM"      value={avgWpm      ? `${avgWpm}`      : '—'} color="#00f5ff" icon="🚀" />
            <StatCard label="Avg Accuracy" value={avgAccuracy ? `${avgAccuracy}%`: '—'} color="#39ff14" icon="🎯" />
            <StatCard label="Daily Streak" value={streak      ? `${streak} 🔥`  : '—'} color="#ffb703" icon="🔥" />
          </div>

          {/* ═══ MAIN GRID ══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Left column: avatar selector + premium teaser ── */}
            <div className="lg:col-span-1 space-y-5">

              {/* Free avatar selector */}
              <div
                className="rounded-2xl border p-5"
                style={{ background: 'rgba(10,14,28,0.88)', borderColor: 'rgba(100,116,139,0.12)' }}
              >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                  Choose Class
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {FREE_AVATARS.map((av) => {
                    const isCurrent  = user?.avatarId === av.id;
                    const isUpdating = updatingId === av.id;
                    return (
                      <button
                        key={av.id}
                        disabled={isCurrent || !!updatingId}
                        onClick={() => handleAvatarChange(av.id)}
                        title={`${av.name} — ${av.desc}`}
                        className="flex flex-col items-center gap-1 rounded-xl border p-2 transition-all duration-200 cursor-pointer disabled:cursor-default"
                        style={{
                          background:   isCurrent ? `${av.color}14` : 'rgba(5,10,20,0.72)',
                          borderColor:  isCurrent ? `${av.color}52` : 'rgba(100,116,139,0.14)',
                          boxShadow:    isCurrent ? `0 0 16px ${av.color}22` : 'none',
                          transform:    isUpdating ? 'scale(0.88)' : '',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent && !updatingId) {
                            e.currentTarget.style.borderColor = `${av.color}30`;
                            e.currentTarget.style.transform   = 'scale(1.06)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.borderColor = 'rgba(100,116,139,0.14)';
                            e.currentTarget.style.transform   = '';
                          }
                        }}
                      >
                        <span className="text-2xl select-none">{isUpdating ? '⏳' : av.emoji}</span>
                        <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: isCurrent ? av.color : '#64748b' }}>
                          {av.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active class detail */}
                <div
                  className="mt-4 rounded-xl border p-3 text-center"
                  style={{ background: `${activeAvatar.color}09`, borderColor: `${activeAvatar.color}22` }}
                >
                  <p className="text-xs font-black" style={{ color: activeAvatar.color }}>
                    {activeAvatar.emoji} {activeAvatar.name}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{activeAvatar.desc}</p>
                </div>
              </div>

              {/* Premium avatars teaser */}
              <div
                className="relative overflow-hidden rounded-2xl border p-5"
                style={{ background: 'rgba(10,14,28,0.88)', borderColor: 'rgba(191,95,255,0.15)' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top, rgba(191,95,255,0.06) 0%, transparent 65%)' }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Premium Classes</h3>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider"
                      style={{ color: '#bf5fff', borderColor: 'rgba(191,95,255,0.28)', background: 'rgba(191,95,255,0.08)' }}
                    >
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-600 mb-4">Unlock legendary heroes with premium</p>
                  <div className="grid grid-cols-5 gap-2 opacity-45 select-none">
                    {PREMIUM_AVATARS.map((av) => (
                      <div
                        key={av.id}
                        className="flex flex-col items-center gap-1 rounded-xl border p-2"
                        style={{ background: 'rgba(5,10,20,0.8)', borderColor: 'rgba(191,95,255,0.1)' }}
                      >
                        <div className="relative">
                          <span className="text-2xl" style={{ filter: 'grayscale(0.7)' }}>{av.emoji}</span>
                          <span className="absolute -top-1 -right-1 text-[8px]">🔒</span>
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-wide text-slate-600">{av.name}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled
                    className="mt-4 w-full rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-widest opacity-55 cursor-not-allowed"
                    style={{
                      background:  'linear-gradient(135deg, rgba(191,95,255,0.12), rgba(99,102,241,0.07))',
                      borderColor: 'rgba(191,95,255,0.22)',
                      color:       '#bf5fff',
                    }}
                  >
                    💎 Unlock Premium — Coming Soon
                  </button>
                </div>
              </div>

              {/* Boost Profile teaser */}
              <div
                className="relative overflow-hidden rounded-2xl border p-5"
                style={{ background: 'rgba(10,14,28,0.88)', borderColor: 'rgba(255,183,3,0.14)' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top right, rgba(255,183,3,0.06) 0%, transparent 60%)' }} />
                <div className="relative">
                  <span className="text-2xl mb-2 block select-none">🚀</span>
                  <h3 className="text-sm font-black text-white mb-1">Boost Your Rank</h3>
                  <p className="text-[9px] text-slate-500 mb-4 leading-relaxed">
                    Pin your profile to the top of leaderboards. Get a golden frame, exclusive badge &amp; more.
                  </p>
                  <button
                    disabled
                    className="w-full rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-widest opacity-55 cursor-not-allowed"
                    style={{
                      background:  'linear-gradient(135deg, rgba(255,183,3,0.09), rgba(255,60,172,0.07))',
                      borderColor: 'rgba(255,183,3,0.2)',
                      color:       '#ffb703',
                    }}
                  >
                    ⚡ Boost Profile — Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: Level history ── */}
            <div className="lg:col-span-2">
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'rgba(10,14,28,0.88)', borderColor: 'rgba(100,116,139,0.12)' }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between border-b px-5 py-4"
                  style={{ borderColor: 'rgba(100,116,139,0.1)' }}
                >
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level Clear History</h3>
                    <p className="text-sm font-black text-white mt-0.5">{totalLevelsCompleted} Levels Completed</p>
                  </div>
                  {totalStars > 0 && (
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest">Stars</p>
                      <p className="text-lg font-black leading-none" style={{ color: '#ffb703' }}>
                        {'⭐'.repeat(Math.min(totalStars, 6))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Body */}
                {totalLevelsCompleted === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="text-5xl mb-4 animate-float select-none">⚔️</div>
                    <p className="text-sm font-black text-slate-400 mb-1">No battles fought yet</p>
                    <p className="text-[10px] text-slate-600">Complete levels in the Arena to see your history here</p>
                  </div>
                ) : (
                  <div className="p-4 max-h-[500px] overflow-y-auto space-y-2">
                    {Object.entries(levelResults)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([lvlId, res]) => {
                        const wpmColor = res.wpm >= 80 ? '#39ff14' : res.wpm >= 50 ? '#00f5ff' : '#94a3b8';
                        const accColor = res.accuracy >= 95 ? '#39ff14' : res.accuracy >= 80 ? '#ffb703' : '#ff4444';
                        return (
                          <div
                            key={lvlId}
                            className="flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200"
                            style={{ background: 'rgba(5,10,20,0.6)', borderColor: 'rgba(100,116,139,0.1)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,245,255,0.13)';
                              e.currentTarget.style.background   = 'rgba(0,245,255,0.025)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(100,116,139,0.1)';
                              e.currentTarget.style.background   = 'rgba(5,10,20,0.6)';
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black"
                                style={{ background: 'rgba(0,245,255,0.08)', color: '#00f5ff', border: '1px solid rgba(0,245,255,0.14)' }}
                              >
                                {lvlId}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-200">Level {lvlId}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5">
                                  {'⭐'.repeat(res.stars)}{'☆'.repeat(3 - res.stars)}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2 text-right">
                              <p className="text-xs font-black font-mono" style={{ color: wpmColor }}>{res.wpm} WPM</p>
                              <p className="text-[9px] font-semibold font-mono mt-0.5" style={{ color: accColor }}>{res.accuracy}% ACC</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
