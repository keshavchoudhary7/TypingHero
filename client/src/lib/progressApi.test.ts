import { describe, expect, it } from 'vitest';
import { buildProgressPayload, normalizeProgressPayload } from './progressApi';

describe('progressApi', () => {
  it('builds a payload from completed levels and results', () => {
    expect(
      buildProgressPayload({
        activeLevelId: 3,
        completedLevels: [1, 2],
        levelResults: {
          1: { accuracy: 90, wpm: 60, stars: 3 },
          2: { accuracy: 95, wpm: 70, stars: 4 },
        },
      }),
    ).toEqual({
      activeLevelId: 3,
      completedLevels: [1, 2],
      levelResults: {
        1: { accuracy: 90, wpm: 60, stars: 3 },
        2: { accuracy: 95, wpm: 70, stars: 4 },
      },
    });
  });

  it('normalizes partial server data', () => {
    expect(normalizeProgressPayload({ completedLevels: [2] })).toEqual({
      activeLevelId: null,
      completedLevels: [2],
      levelResults: {},
    });
  });
});
