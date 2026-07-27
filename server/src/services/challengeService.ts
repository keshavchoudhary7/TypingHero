import { getRandomPassageByDifficulty } from '../lib/passages.js';

export type Challenge = {
  id: string;
  title: string;
  passage: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  world: string;
};

function normalizeDifficulty(difficulty: string): Challenge['difficulty'] {
  const normalized = difficulty.toLowerCase();
  if (normalized === 'easy') return 'Easy';
  if (normalized === 'hard') return 'Hard';
  return 'Medium';
}

export async function generateChallenge(_level: number, difficulty: string): Promise<Challenge> {
  // Randomly select a passage matching the required difficulty tier from the passages file
  const selected = getRandomPassageByDifficulty(difficulty);

  return {
    id: selected.id,
    title: selected.title,
    passage: selected.passage,
    difficulty: normalizeDifficulty(difficulty),
    world: selected.world,
  };
}
