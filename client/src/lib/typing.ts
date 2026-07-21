export type TypingStats = {
  correctChars: number;
  incorrectChars: number;
  wpm: number;       // gross WPM
  netWpm: number;    // net WPM (subtracts uncorrected errors)
  accuracy: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  state: 'Bronze' | 'Silver' | 'Gold' | 'Heroic' | 'Unlocked';
};

type CalculateStatsArgs = {
  passage: string;
  typed: string;
  elapsedMs: number;
};

export type Level = {
  id: number;
  title: string;
  world: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passage: string;
  unlocksAtLevel?: number;
};

export function calculateStats({ passage, typed, elapsedMs }: CalculateStatsArgs): TypingStats {
  const safeElapsedMs = Math.max(elapsedMs, 1);
  const typedChars = typed.split('');
  const passageChars = passage.split('');

  if (typedChars.length === 0) {
    return { correctChars: 0, incorrectChars: 0, wpm: 0, netWpm: 0, accuracy: 100 };
  }

  let correctChars = 0;
  let incorrectChars = 0;

  for (let index = 0; index < typedChars.length; index += 1) {
    const expected = passageChars[index];
    const actual = typedChars[index];

    if (actual === expected) {
      correctChars += 1;
    } else {
      incorrectChars += 1;
    }
  }

  const totalChars = typedChars.length;
  const accuracy = totalChars === 0 ? 100 : Math.round((correctChars / totalChars) * 100);
  const minutes = safeElapsedMs / 60000;
  const grossWpm = Math.round((typedChars.length / 5 / minutes) * 10) / 10;
  // Net WPM: (correct chars / 5 − errors per minute) / minutes elapsed
  const netWpm = Math.max(0, Math.round(((correctChars / 5) / minutes - incorrectChars / minutes) * 10) / 10);

  return { correctChars, incorrectChars, wpm: grossWpm, netWpm, accuracy };
}

export function isLevelUnlocked(levelId: number, completedLevels: number[]): boolean {
  if (levelId === 1) {
    return true;
  }

  return completedLevels.includes(levelId - 1);
}

// Star thresholds scale with level — later levels require higher sustained WPM on longer passages
export function getLevelStars({ accuracy, wpm, level = 1 }: { accuracy: number; wpm: number; level?: number }): number {
  // WPM required for 3★ rises per level (Easy ~40, Medium ~35, Hard ~30 net on long passages)
  const threeStarAcc = 95;
  const twoStarAcc = 85;
  // WPM floor for 3★: starts at 45 for L1, increases by 3 per level, caps at 70 for L8+
  const threeStarWpm = Math.min(45 + (level - 1) * 3, 70);
  // WPM floor for 2★: starts at 28, increases by 2 per level, caps at 45
  const twoStarWpm = Math.min(28 + (level - 1) * 2, 45);

  if (accuracy >= threeStarAcc && wpm >= threeStarWpm) return 3;
  if (accuracy >= twoStarAcc && wpm >= twoStarWpm) return 2;
  return 1;
}

export function getAchievements({ completedLevels, accuracy, wpm, status }: { completedLevels: number[]; accuracy: number; wpm: number; status: string }): Achievement[] {
  const achievements: Achievement[] = [];

  if (completedLevels.length >= 1) {
    achievements.push({ id: 'first-spark', title: 'First Spark', description: 'Completed your first challenge.', icon: '✨', state: 'Bronze' });
  }

  if (accuracy >= 95) {
    achievements.push({ id: 'precision', title: 'Precision', description: 'Kept accuracy at 95% or higher.', icon: '🎯', state: 'Silver' });
  }

  if (wpm >= 70) {
    achievements.push({ id: 'velocity', title: 'Velocity', description: 'Sprinted above 70 WPM.', icon: '⚡', state: 'Silver' });
  }

  if (completedLevels.length >= 3) {
    achievements.push({ id: 'world-explorer', title: 'World Explorer', description: 'Cleared three kingdoms of play.', icon: '🗺️', state: 'Gold' });
  }

  if (completedLevels.length >= 6) {
    achievements.push({ id: 'champion', title: 'Champion', description: 'Conquered six levels across worlds.', icon: '👑', state: 'Heroic' });
  }

  if (status === 'finished' && accuracy >= 90 && wpm >= 50) {
    achievements.push({ id: 'heroic-run', title: 'Heroic Run', description: 'Finished a strong run with speed and control.', icon: '🏅', state: 'Heroic' });
  }

  return achievements;
}

// 8 levels across 4 worlds — ensures rich world variety even without server
export const levels: Level[] = [
  // World 1: Moonlit Forest (Easy)
  {
    id: 1,
    title: 'Forest Sprint',
    world: 'Moonlit Forest',
    difficulty: 'Easy',
    passage: 'The sun sets low and red birds fly fast over the big green lake at dusk.',
  },
  {
    id: 2,
    title: 'Cedar Drift',
    world: 'Moonlit Forest',
    difficulty: 'Easy',
    passage: 'Tall cedar trees bend in the wind, and dry leaves spin slowly to the ground, painting the forest floor gold.',
    unlocksAtLevel: 1,
  },
  // World 2: Crystal Coast (Medium)
  {
    id: 3,
    title: 'River Relay',
    world: 'Crystal Coast',
    difficulty: 'Medium',
    passage: 'The river bends sharply around the ancient boulder, carrying silt and broken branches with it. Each keystroke should match the relentless forward motion of water.',
    unlocksAtLevel: 2,
  },
  {
    id: 4,
    title: 'Tide Rush',
    world: 'Crystal Coast',
    difficulty: 'Medium',
    passage: 'Coastal storms arrive without warning; their fierce, salt-laden gusts strip the shoreline bare. Typists who maintain composure under pressure will always outlast those who rush and stumble on each difficult word transition.',
    unlocksAtLevel: 3,
  },
  // World 3: Neon Circuit (Hard)
  {
    id: 5,
    title: 'Skyforge Trial',
    world: 'Neon Circuit',
    difficulty: 'Hard',
    passage: 'Precision is not a talent; it is a discipline forged through thousands of repetitions. The circuit board demands accuracy above all else: one misplaced signal disrupts the entire sequence, cascading into failures that compound with every subsequent keystroke you attempt.',
    unlocksAtLevel: 4,
  },
  {
    id: 6,
    title: 'Pulse Surge',
    world: 'Neon Circuit',
    difficulty: 'Hard',
    passage: 'High-frequency signals do not tolerate hesitation — each pulse arrives at precisely calculated intervals, demanding that operators respond without second-guessing their instincts. The system architecture was designed for speed; its fault-tolerance mechanisms will catch minor errors, but the operator rhythm must remain unbroken throughout the entire burst cycle.',
    unlocksAtLevel: 5,
  },
  // World 4: Nova Terminal (Hard — elite)
  {
    id: 7,
    title: 'Nova Ascent',
    world: 'Nova Terminal',
    difficulty: 'Hard',
    passage: 'Highly skilled operators understand that sustained performance — the kind that separates elite typists from intermediate ones — requires deliberate, well-paced keystrokes rather than frantic bursts of activity. Cognitive load must be carefully managed; the moment you allow anxiety to dictate your finger placement, your accuracy degrades faster than any speed-training regimen can compensate for.',
    unlocksAtLevel: 6,
  },
  {
    id: 8,
    title: 'Terminal Blitz',
    world: 'Nova Terminal',
    difficulty: 'Hard',
    passage: 'At the highest echelons of competitive typing, the distinction between raw speed and net-adjusted performance becomes critical: a typist who sustains ninety words per minute with ninety-eight percent accuracy will always outrank one who bursts at one hundred twenty but leaves a trail of uncorrected errors. True mastery is not about velocity alone; it is about the seamless integration of cognition, motor control, and real-time error-correction that elite practitioners develop over years of deliberate, focused practice.',
    unlocksAtLevel: 7,
  },
];
