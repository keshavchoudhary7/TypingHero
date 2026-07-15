import AchievementCard from '../components/dashboard/AchievementCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { type Achievement } from '../lib/typing';

type AchievementsPageProps = {
  achievements: Achievement[];
  completedLevels: number;
  totalLevels: number;
  onBack: () => void;
};

const stateConfig: Record<Achievement['state'], { color: string; label: string }> = {
  Bronze: { color: '#cd7f32', label: 'Bronze' },
  Silver: { color: '#c0c0c0', label: 'Silver' },
  Gold: { color: '#ffd700', label: 'Gold' },
  Heroic: { color: '#ff3cac', label: 'Heroic' },
  Unlocked: { color: '#39ff14', label: 'Unlocked' },
};

export default function AchievementsPage({ achievements, completedLevels, totalLevels, onBack }: AchievementsPageProps) {
  const completionRate = Math.round((completedLevels / Math.max(totalLevels, 1)) * 100);
  const heroicCount = achievements.filter((achievement) => achievement.state === 'Heroic').length;
  const stats = [
    { label: 'Unlocked', value: achievements.length, icon: '🏆', color: '#ff3cac' },
    { label: 'Levels Cleared', value: completedLevels, icon: '⚡', color: '#00f5ff' },
    { label: 'Completion', value: `${completionRate}%`, icon: '📈', color: '#ffd700' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100 grid-bg" style={{ background: '#050711' }}>
      <div className="ambient-orb pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(255,60,172,0.1) 0%, transparent 70%)' }} />
      <div className="ambient-orb-2 pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)' }} />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="relative mb-8 overflow-hidden rounded-2xl p-6" style={{ background: 'rgba(10,14,28,0.88)', border: '1px solid rgba(255,60,172,0.18)', backdropFilter: 'blur(24px)', boxShadow: '0 0 60px rgba(255,60,172,0.06)' }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,60,172,0.6), rgba(0,245,255,0.4), transparent)' }} />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: 'linear-gradient(135deg, rgba(255,60,172,0.15), rgba(0,245,255,0.1))', border: '1px solid rgba(255,60,172,0.25)' }}>🏆</div><div><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#ff3cac' }}>Hero Collection</p><h1 className="text-2xl font-black text-white">Achievements</h1></div></div>
              <p className="mt-3 max-w-lg text-sm text-slate-500">Celebrate the typing milestones you have earned in the arena.</p>
            </div>
            <PrimaryButton onClick={onBack} variant="dark">← Back to Arena</PrimaryButton>
          </div>
        </header>
        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">{stats.map((stat) => <div key={stat.label} className="relative overflow-hidden rounded-2xl p-5 text-center" style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}28`, boxShadow: `0 0 20px ${stat.color}16` }}><div className="mb-2 text-2xl">{stat.icon}</div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{stat.label}</p><p className="mt-2 text-3xl font-black tabular-nums" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</p></div>)}</div>
            <section className="rounded-2xl p-6" style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(30,41,59,0.7)' }}>
              <div className="mb-6 flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Your Trophy Case</p><span className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: 'rgba(255,60,172,0.1)', border: '1px solid rgba(255,60,172,0.25)', color: '#ff3cac' }}>{achievements.length} earned</span></div>
              {achievements.length > 0 ? <div className="grid gap-4 sm:grid-cols-2">{achievements.map((achievement) => <div key={achievement.id} className="relative"><AchievementCard achievement={achievement} /><span className="absolute right-3 top-3 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: stateConfig[achievement.state].color, background: `${stateConfig[achievement.state].color}14`, border: `1px solid ${stateConfig[achievement.state].color}30` }}>{stateConfig[achievement.state].label}</span></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center"><p className="text-3xl">✨</p><p className="mt-3 font-semibold text-white">Your first achievement is waiting</p><p className="mt-1 text-sm text-slate-500">Complete a challenge to begin your collection.</p></div>}
            </section>
          </div>
          <aside className="space-y-5">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(0,245,255,0.12)' }}><p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Collection Progress</p><p className="text-6xl font-black tabular-nums" style={{ color: completionRate >= 80 ? '#39ff14' : '#00f5ff', fontFamily: "'JetBrains Mono', monospace" }}>{completionRate}%</p><p className="mt-1 text-xs text-slate-600">of available levels cleared</p><div className="mt-4 h-3 overflow-hidden rounded-full border border-slate-800 bg-slate-950/80"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" style={{ width: `${Math.max(completionRate, 2)}%` }} /></div><p className="mt-3 text-sm text-slate-400">{completedLevels} of {totalLevels} challenges completed</p></div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,60,172,0.04)', border: '1px solid rgba(255,60,172,0.14)' }}><p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ff3cac' }}>Achievement Highlights</p><div className="mt-4 space-y-3 text-sm text-slate-400"><p><span className="font-bold text-white">{heroicCount}</span> Heroic achievement{heroicCount === 1 ? '' : 's'} earned</p><p>Build speed and precision to unlock more badges.</p></div></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
