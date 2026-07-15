// ─── XP System ────────────────────────────────────────────────────────────────

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type XPGain = {
  base: number;
  accuracyBonus: number;
  speedBonus: number;
  dailyBonus: number;
  total: number;
};

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  Easy: 1.0,
  Medium: 1.5,
  Hard: 2.0,
};

/** Compute XP earned for one completed level run */
export function calculateXP(params: {
  wpm: number;
  accuracy: number;
  stars: number;
  difficulty: Difficulty;
  isDaily: boolean;
}): XPGain {
  const { wpm, accuracy, stars, difficulty, isDaily } = params;
  const mult = DIFFICULTY_MULTIPLIER[difficulty];

  // Base: 60 * difficulty * stars
  const base = Math.round(60 * mult * stars);

  // Accuracy bonus: +40 XP for ≥95%, +20 for ≥85%
  const accuracyBonus = accuracy >= 95 ? 40 : accuracy >= 85 ? 20 : 0;

  // Speed bonus: +10 XP per 5 WPM above 35
  const speedBonus = Math.max(0, Math.floor((wpm - 35) / 5) * 10);

  // Daily challenge bonus
  const dailyBonus = isDaily ? 200 : 0;

  return { base, accuracyBonus, speedBonus, dailyBonus, total: base + accuracyBonus + speedBonus + dailyBonus };
}

// ─── Hero Level System ────────────────────────────────────────────────────────

export type HeroRank = {
  level: number;
  title: string;
  color: string;
  minXp: number;
  maxXp: number;
  icon: string;
};

export const HERO_RANKS: HeroRank[] = [
  { level: 1, title: 'Initiate',     color: '#94a3b8', minXp: 0,    maxXp: 299,  icon: '🌱' },
  { level: 2, title: 'Apprentice',   color: '#39ff14', minXp: 300,  maxXp: 699,  icon: '⚡' },
  { level: 3, title: 'Practitioner', color: '#00f5ff', minXp: 700,  maxXp: 1299, icon: '🔷' },
  { level: 4, title: 'Specialist',   color: '#bf5fff', minXp: 1300, maxXp: 2199, icon: '💜' },
  { level: 5, title: 'Expert',       color: '#ffb703', minXp: 2200, maxXp: 3499, icon: '🌟' },
  { level: 6, title: 'Master',       color: '#ff3cac', minXp: 3500, maxXp: 5199, icon: '🔥' },
  { level: 7, title: 'Grandmaster',  color: '#ffd700', minXp: 5200, maxXp: 7499, icon: '👑' },
  { level: 8, title: 'Legend',       color: '#ffffff', minXp: 7500, maxXp: Infinity, icon: '⚜️' },
];

export function getHeroRank(totalXp: number): HeroRank & { progressPct: number; xpIntoLevel: number; xpNeeded: number } {
  const rank = [...HERO_RANKS].reverse().find((r) => totalXp >= r.minXp) ?? HERO_RANKS[0];
  const xpIntoLevel = totalXp - rank.minXp;
  const xpNeeded = rank.maxXp === Infinity ? 0 : rank.maxXp - rank.minXp;
  const progressPct = xpNeeded === 0 ? 100 : Math.min(Math.round((xpIntoLevel / xpNeeded) * 100), 100);
  return { ...rank, progressPct, xpIntoLevel, xpNeeded };
}

export function didLevelUp(prevXp: number, newXp: number): HeroRank | null {
  const prevRank = getHeroRank(prevXp);
  const newRank = getHeroRank(newXp);
  return newRank.level > prevRank.level ? newRank : null;
}

// ─── Streak System ────────────────────────────────────────────────────────────

export type StreakState = 'new' | 'continued' | 'already_played' | 'broken' | 'at_risk';

export type StreakResult = {
  streak: number;
  state: StreakState;
  lastPlayedDate: string;
};

/** Get today's date as YYYY-MM-DD in local time */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Compute new streak given the stored last-played date and current streak count */
export function computeStreak(params: {
  lastPlayedDate: string | null;
  currentStreak: number;
}): StreakResult {
  const { lastPlayedDate, currentStreak } = params;
  const today = todayString();

  if (!lastPlayedDate) {
    return { streak: 1, state: 'new', lastPlayedDate: today };
  }

  if (lastPlayedDate === today) {
    return { streak: currentStreak, state: 'already_played', lastPlayedDate: today };
  }

  // Diff in days
  const diffMs = new Date(today).getTime() - new Date(lastPlayedDate).getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 1) {
    return { streak: currentStreak + 1, state: 'continued', lastPlayedDate: today };
  }

  // Missed one or more days → streak broken
  return { streak: 1, state: 'broken', lastPlayedDate: today };
}

/** Determine if the streak is at risk (player hasn't played yet today and yesterday was last played) */
export function isStreakAtRisk(lastPlayedDate: string | null): boolean {
  if (!lastPlayedDate) return false;
  const today = todayString();
  if (lastPlayedDate === today) return false;
  const diffMs = new Date(today).getTime() - new Date(lastPlayedDate).getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  return diffDays === 1; // played yesterday, not yet today
}

// ─── Daily Challenge ──────────────────────────────────────────────────────────

/** Deterministic daily level ID based on today's date (stable across all clients) */
export function getDailyLevelId(totalLevels: number): number {
  const today = todayString();
  // Simple numeric hash of the date string
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }
  return (hash % totalLevels) + 1;
}

/** Check if today's daily challenge has already been completed */
export function isDailyDone(dailyChallengeDoneDate: string | null): boolean {
  if (!dailyChallengeDoneDate) return false;
  return dailyChallengeDoneDate === todayString();
}

// ─── Welcome-back logic ──────────────────────────────────────────────────────

export type WelcomeBackType = 'first_time' | 'streak_broken' | 'streak_at_risk' | 'streak_continued' | null;

export function getWelcomeBackType(params: {
  lastPlayedDate: string | null;
  streak: number;
  totalXp: number;
}): WelcomeBackType {
  const { lastPlayedDate, streak, totalXp } = params;

  if (!lastPlayedDate && totalXp === 0) return 'first_time';

  const today = todayString();
  if (lastPlayedDate === today) return null; // already played today, no modal

  if (!lastPlayedDate) return 'first_time';

  const diffMs = new Date(today).getTime() - new Date(lastPlayedDate).getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays > 1) return 'streak_broken';
  if (diffDays === 1 && streak >= 2) return 'streak_at_risk';
  if (diffDays === 1 && streak >= 1) return 'streak_continued';
  return null;
}
