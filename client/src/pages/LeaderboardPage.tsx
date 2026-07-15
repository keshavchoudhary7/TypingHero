import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';

type GlobalLeader = {
  username: string;
  avatarId: string;
  xp: number;
  streak: number;
};

type LevelLeader = {
  username: string;
  avatarId: string;
  wpm: number;
  accuracy: number;
  stars: number;
  createdAt: string;
};

const AVATAR_EMOJIS: Record<string, string> = {
  knight: '🛡️',
  wizard: '🔮',
  rogue: '🗡️',
  ranger: '🏹',
  cleric: '❇️',
};

const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'level'>('global');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [globalLeaders, setGlobalLeaders] = useState<GlobalLeader[]>([]);
  const [levelLeaders, setLevelLeaders] = useState<LevelLeader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Global Leaderboard
  const fetchGlobal = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/leaderboard/global');
      if (response.ok) {
        const data = await response.json();
        setGlobalLeaders(data);
      } else {
        setError('Failed to load global leaderboards.');
      }
    } catch {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Level Leaderboard
  const fetchLevel = async (lvlId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:4000/api/leaderboard/level/${lvlId}`);
      if (response.ok) {
        const data = await response.json();
        setLevelLeaders(data);
      } else {
        setError(`Failed to load leaderboards for Level ${lvlId}.`);
      }
    } catch {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'global') {
      fetchGlobal();
    } else {
      fetchLevel(selectedLevel);
    }
  }, [activeTab, selectedLevel]);

  return (
    <div className="mx-auto max-w-4xl p-6 text-white min-h-[80vh]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            🏆 Hall of Heroes
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Top performers in the TypingHero kingdoms
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('global')}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
              activeTab === 'global'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'border-slate-800 bg-[#0a0e1c]/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Global XP Rank
          </button>
          <button
            onClick={() => setActiveTab('level')}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
              activeTab === 'level'
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                : 'border-slate-800 bg-[#0a0e1c]/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Level Speedruns
          </button>
        </div>
      </div>

      {/* Level Selector Dropdown */}
      {activeTab === 'level' && (
        <div className="mb-4 flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Select Dungeon:
          </label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(Number(e.target.value))}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            {Array.from({ length: 9 }, (_, i) => i + 1).map((lvl) => (
              <option key={lvl} value={lvl}>
                Kingdom Level {lvl}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Leaderboard Table Container */}
      <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/85 p-6 backdrop-blur-md relative overflow-hidden">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-cyan-400">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-cyan-500 border-t-transparent" />
              <span className="animate-pulse text-[10px] font-bold tracking-widest uppercase">Fetching Ranks...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] items-center justify-center text-red-400 text-xs font-semibold uppercase tracking-widest">
            ⚠️ {error}
          </div>
        ) : activeTab === 'global' ? (
          /* GLOBAL XP LEADERBOARD */
          globalLeaders.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest">
              💀 No records in history yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 pb-3">
                    <th className="py-3 pl-4">Rank</th>
                    <th>Hero</th>
                    <th>Class</th>
                    <th>Streak</th>
                    <th className="text-right pr-4">Total XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {globalLeaders.map((leader, index) => {
                    const rankNum = index + 1;
                    return (
                      <tr key={index} className="hover:bg-slate-950/20 text-xs font-semibold text-slate-300">
                        <td className="py-3.5 pl-4 font-bold tabular-nums">
                          {RANK_MEDALS[rankNum] ? (
                            <span className="text-xl">{RANK_MEDALS[rankNum]}</span>
                          ) : (
                            `#${rankNum}`
                          )}
                        </td>
                        <td className="font-bold text-white font-mono">
                          {leader.username}
                        </td>
                        <td className="text-lg">
                          <span title={leader.avatarId}>
                            {AVATAR_EMOJIS[leader.avatarId] || '🛡️'}
                          </span>
                        </td>
                        <td>
                          {leader.streak > 0 ? `${leader.streak} Days 🔥` : '0'}
                        </td>
                        <td className="text-right pr-4 font-mono font-bold text-cyan-400">
                          {leader.xp.toLocaleString()} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* LEVEL LEADERBOARD */
          levelLeaders.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest">
              🏹 No attempts recorded for Level {selectedLevel} yet. Be the first to clear it!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 pb-3">
                    <th className="py-3 pl-4">Rank</th>
                    <th>Hero</th>
                    <th>Class</th>
                    <th>Accuracy</th>
                    <th>Stars</th>
                    <th className="text-right pr-4">Speed (WPM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {levelLeaders.map((leader, index) => {
                    const rankNum = index + 1;
                    return (
                      <tr key={index} className="hover:bg-slate-950/20 text-xs font-semibold text-slate-300">
                        <td className="py-3.5 pl-4 font-bold tabular-nums">
                          {RANK_MEDALS[rankNum] ? (
                            <span className="text-xl">{RANK_MEDALS[rankNum]}</span>
                          ) : (
                            `#${rankNum}`
                          )}
                        </td>
                        <td className="font-bold text-white font-mono">
                          {leader.username}
                        </td>
                        <td className="text-lg">
                          <span title={leader.avatarId}>
                            {AVATAR_EMOJIS[leader.avatarId] || '🛡️'}
                          </span>
                        </td>
                        <td className="font-mono">
                          {leader.accuracy}%
                        </td>
                        <td>
                          {Array.from({ length: leader.stars }).map(() => '⭐').join('')}
                        </td>
                        <td className="text-right pr-4 font-mono font-bold text-indigo-400">
                          {leader.wpm} WPM
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
