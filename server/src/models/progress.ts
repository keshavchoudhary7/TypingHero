export type ProgressDocument = {
  _id?: string;
  userId?: string;
  completedLevels: number[];
  levelResults: Record<string, { accuracy: number; wpm: number; netWpm?: number; stars: number }>;
  activeLevelId?: number | null;
  // M3: progression fields
  xp: number;
  streak: number;
  lastPlayedDate: string | null;
  dailyChallengeDoneDate: string | null;
  updatedAt: Date;
};
