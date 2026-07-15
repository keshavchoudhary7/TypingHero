import { describe, expect, it } from 'vitest';
import { calculateStats, getAchievements, getLevelStars, isLevelUnlocked } from './typing';

describe('calculateStats', () => {
  it('computes wpm and accuracy from typed input', () => {
    const result = calculateStats({
      passage: 'hello world',
      typed: 'hello worl',
      elapsedMs: 60000,
    });

    expect(result.correctChars).toBe(10);
    expect(result.incorrectChars).toBe(0);
    expect(result.wpm).toBe(2);
    expect(result.accuracy).toBe(100);
  });

  it('handles empty input gracefully', () => {
    const result = calculateStats({
      passage: 'abc',
      typed: '',
      elapsedMs: 120000,
    });

    expect(result.wpm).toBe(0);
    expect(result.accuracy).toBe(100);
  });

  it('unlocks the next level only after the previous one is cleared', () => {
    expect(isLevelUnlocked(1, [])).toBe(true);
    expect(isLevelUnlocked(2, [1])).toBe(true);
    expect(isLevelUnlocked(3, [1])).toBe(false);
  });

  it('awards stars according to accuracy and speed', () => {
    expect(getLevelStars({ accuracy: 100, wpm: 80 })).toBe(3);
    expect(getLevelStars({ accuracy: 90, wpm: 50 })).toBe(2);
    expect(getLevelStars({ accuracy: 70, wpm: 30 })).toBe(1);
  });

  it('surfaces achievements from user performance', () => {
    const achievements = getAchievements({ completedLevels: [1, 2], accuracy: 97, wpm: 75, status: 'finished' });

    expect(achievements.map((entry) => entry.id)).toEqual(expect.arrayContaining(['first-spark', 'precision', 'velocity', 'heroic-run']));
  });
});
