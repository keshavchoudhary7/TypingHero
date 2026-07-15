import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { getHeroRank } from '../lib/xp';

type ProfilePageProps = {
  completedLevels: number[];
  levelResults: Record<number, { accuracy: number; wpm: number; netWpm: number; stars: number }>;
  streak: number;
  totalXp: number;
};

const AVAILABLE_AVATARS = [
  { id: 'knight', emoji: '🛡️', name: 'Knight', desc: 'The Valiant Defender' },
  { id: 'wizard', emoji: '🔮', name: 'Wizard', desc: 'The Arcane Master' },
  { id: 'rogue', emoji: '🗡️', name: 'Rogue', desc: 'The Shadow Blade' },
  { id: 'ranger', emoji: '🏹', name: 'Ranger', desc: 'The Swift Tracker' },
  { id: 'cleric', emoji: '❇️', name: 'Cleric', desc: 'The Divine Healer' },
];

export default function ProfilePage({
  completedLevels,
  levelResults,
  streak,
  totalXp,
}: ProfilePageProps) {
  const { user, updateAvatar } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Compute stats
  const rankInfo = getHeroRank(totalXp);
  const totalLevelsCompleted = completedLevels.length;

  const resultsArray = Object.values(levelResults);
  const avgWpm =
    resultsArray.length > 0
      ? Math.round(resultsArray.reduce((acc, curr) => acc + curr.wpm, 0) / resultsArray.length)
      : 0;

  const avgAccuracy =
    resultsArray.length > 0
      ? Math.round(resultsArray.reduce((acc, curr) => acc + curr.accuracy, 0) / resultsArray.length)
      : 0;

  const maxWpm =
    resultsArray.length > 0 ? Math.max(...resultsArray.map((r) => r.wpm)) : 0;

  const activeAvatar =
    AVAILABLE_AVATARS.find((av) => av.id === (user?.avatarId || 'knight')) ||
    AVAILABLE_AVATARS[0];

  const handleAvatarChange = async (avatarId: string) => {
    setUpdatingId(avatarId);
    await updateAvatar(avatarId);
    setUpdatingId(null);
  };

  return (
    <div className="mx-auto max-w-4xl p-6 text-white bg-[#05070f] min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: HERO AVATAR CARD */}
        <div className="md:col-span-1 rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-6 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-radial-gradient from-indigo-500/20 via-transparent to-transparent" />
          
          <div className="relative text-7xl mb-4 bg-slate-900/60 p-6 rounded-full border border-slate-700 shadow-inner">
            {activeAvatar.emoji}
          </div>
          
          <h2 className="text-2xl font-black uppercase tracking-wide bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            {user?.username || 'Guest Hero'}
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Class: {activeAvatar.name}
          </p>

          <div className="mt-6 w-full text-center p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Current Rank
            </span>
            <p className="text-xl font-black mt-1" style={{ color: rankInfo.color }}>
              {rankInfo.icon} {rankInfo.title}
            </p>
            <p className="text-[10px] font-bold text-slate-600 mt-0.5">
              Level {rankInfo.level}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: STATS AND XP */}
        <div className="md:col-span-2 space-y-6">
          {/* XP PROGRESS BAR */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Experience (XP)
              </span>
              <span className="text-xs font-bold font-mono text-slate-500">
                {totalXp} XP {rankInfo.maxXp === Infinity ? '' : `/ ${rankInfo.maxXp} XP`}
              </span>
            </div>
            
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all duration-500"
                style={{ width: `${rankInfo.progressPct}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              <span>Level {rankInfo.level}</span>
              {rankInfo.maxXp !== Infinity ? (
                <span>{rankInfo.maxXp - totalXp} XP to next Level</span>
              ) : (
                <span>Max level reached 👑</span>
              )}
            </div>
          </div>

          {/* STATS MATRIX */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Highest WPM', value: maxWpm ? `${maxWpm} WPM` : '—', color: '#bf5fff' },
              { label: 'Average WPM', value: avgWpm ? `${avgWpm} WPM` : '—', color: '#00f5ff' },
              { label: 'Avg Accuracy', value: avgAccuracy ? `${avgAccuracy}%` : '—', color: '#39ff14' },
              { label: 'Daily Streak', value: streak ? `${streak} Days 🔥` : '—', color: '#ffb703' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800/80 bg-[#0a0e1c]/80 p-4 text-center backdrop-blur-md"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {stat.label}
                </span>
                <p className="mt-2 text-lg font-black" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* AVATAR SELECTOR */}
          {user && (
            <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
                Switch Character Class
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {AVAILABLE_AVATARS.map((av) => {
                  const isCurrent = user.avatarId === av.id;
                  const isUpdating = updatingId === av.id;
                  return (
                    <button
                      key={av.id}
                      disabled={isCurrent || isUpdating}
                      onClick={() => handleAvatarChange(av.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-cyan-500 bg-cyan-500/10 cursor-default'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:scale-[1.03]'
                      }`}
                    >
                      <span className="text-3xl">{av.emoji}</span>
                      <span className="mt-1.5 text-[9px] font-bold text-white uppercase">
                        {av.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMPLETED LEVELS RECORD */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
              Level Clear History ({totalLevelsCompleted})
            </h3>
            
            {totalLevelsCompleted === 0 ? (
              <div className="text-center py-6 text-xs font-semibold text-slate-500 uppercase tracking-widest bg-slate-950/20 rounded-xl border border-slate-900">
                ⚔️ No level completion records found. Clear some levels in the Arena!
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                {Object.entries(levelResults).map(([lvlId, res]) => (
                  <div
                    key={lvlId}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-950/30"
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Level {lvlId}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Stars earned: {Array.from({ length: res.stars }).map(() => '⭐').join('')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-cyan-400 font-mono">
                        {res.wpm} WPM
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 font-mono">
                        {res.accuracy}% ACC
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
