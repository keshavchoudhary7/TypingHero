export type ProgressPayload = {
  activeLevelId: number | null;
  completedLevels: number[];
  levelResults: Record<number, { accuracy: number; wpm: number; netWpm: number; stars: number }>;
  // M3 fields
  xp: number;
  streak: number;
  lastPlayedDate: string | null;
  dailyChallengeDoneDate: string | null;
};

export function buildProgressPayload(payload: Partial<ProgressPayload>): ProgressPayload {
  return {
    activeLevelId: payload.activeLevelId ?? null,
    completedLevels: payload.completedLevels ?? [],
    levelResults: payload.levelResults ?? {},
    xp: payload.xp ?? 0,
    streak: payload.streak ?? 0,
    lastPlayedDate: payload.lastPlayedDate ?? null,
    dailyChallengeDoneDate: payload.dailyChallengeDoneDate ?? null,
  };
}

export function normalizeProgressPayload(payload: Partial<ProgressPayload> | null | undefined): ProgressPayload {
  if (!payload) {
    return {
      activeLevelId: null, completedLevels: [], levelResults: {},
      xp: 0, streak: 0, lastPlayedDate: null, dailyChallengeDoneDate: null,
    };
  }

  return {
    activeLevelId: payload.activeLevelId ?? null,
    completedLevels: Array.isArray(payload.completedLevels) ? payload.completedLevels : [],
    levelResults: payload.levelResults ?? {},
    xp: typeof payload.xp === 'number' ? payload.xp : 0,
    streak: typeof payload.streak === 'number' ? payload.streak : 0,
    lastPlayedDate: payload.lastPlayedDate ?? null,
    dailyChallengeDoneDate: payload.dailyChallengeDoneDate ?? null,
  };
}

export async function saveProgress(userId: string, payload: ProgressPayload, authToken?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`http://localhost:4000/api/progress/${userId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save progress');
  }

  return response.json();
}

export async function loadProgress(userId: string, authToken?: string | null): Promise<ProgressPayload> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`http://localhost:4000/api/progress/${userId}`, { headers });

  if (!response.ok) {
    throw new Error('Failed to load progress');
  }

  return normalizeProgressPayload(await response.json());
}
