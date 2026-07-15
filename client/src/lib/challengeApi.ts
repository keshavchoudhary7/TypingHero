export type GeneratedChallenge = {
  id: string;
  title: string;
  passage: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  world: string;
};

export function normalizeGeneratedChallenge(level: number, challenge: GeneratedChallenge) {
  return {
    id: level,
    title: challenge.title,
    passage: challenge.passage,
    difficulty: challenge.difficulty,
    world: challenge.world,
  };
}

export async function fetchGeneratedChallenge(level: number, difficulty: string) {
  const response = await fetch('http://localhost:4000/api/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, difficulty }),
  });

  if (!response.ok) {
    throw new Error('Failed to load challenge');
  }

  return response.json() as Promise<GeneratedChallenge>;
}
