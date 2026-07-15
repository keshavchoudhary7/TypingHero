import { type Achievement } from '../../lib/typing';

type AchievementCardProps = {
  achievement: Achievement;
};

export default function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.6)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl">
          {achievement.icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{achievement.title}</p>
          <p className="mt-2 text-sm text-slate-400">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
}
