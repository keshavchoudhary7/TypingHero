const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export type Challenge = {
  id: string;
  title: string;
  passage: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  world: string;
};

// Progressive difficulty specs per level —
// Each tier is meaningfully harder than the last in length, vocabulary, and punctuation.
type LevelSpec = {
  minChars: number;
  maxChars: number;
  vocab: string;
  punctuation: string;
  structure: string;
};

const levelSpecs: Record<number, LevelSpec> = {
  1:  { minChars: 60,  maxChars: 80,  vocab: 'very common 3-4 letter words only',       punctuation: 'no punctuation at all',                                                structure: 'one simple sentence' },
  2:  { minChars: 90,  maxChars: 115, vocab: 'common 4-6 letter words',                  punctuation: 'one or two commas only',                                                structure: 'two short simple sentences joined by "and" or "while"' },
  3:  { minChars: 130, maxChars: 165, vocab: 'everyday 5-7 letter words',                punctuation: 'commas and one period mid-passage',                                     structure: 'two sentences, one compound clause' },
  4:  { minChars: 170, maxChars: 210, vocab: 'varied 6-8 letter words',                  punctuation: 'commas and one semicolon',                                               structure: 'two sentences with a subordinate clause each' },
  5:  { minChars: 210, maxChars: 255, vocab: 'technical and abstract 7-9 letter words',  punctuation: 'commas, one colon, one semicolon',                                      structure: 'three sentences, one with a conditional or causal clause' },
  6:  { minChars: 255, maxChars: 305, vocab: 'advanced technical vocabulary',             punctuation: 'commas, semicolons, em-dash, colon',                                    structure: 'three or four sentences with nested clauses and varied rhythm' },
  7:  { minChars: 305, maxChars: 355, vocab: 'expert-level academic or technical words', punctuation: 'heavy: commas, semicolons, colons, hyphens, em-dashes',                 structure: 'four sentences with complex nested clauses and parenthetical phrases' },
  8:  { minChars: 355, maxChars: 420, vocab: 'dense academic, philosophical, or scientific vocabulary', punctuation: 'very heavy: all punctuation types freely mixed', structure: 'five or more sentences, maximally complex with multiple subordinate clauses' },
};

// High-quality hand-crafted fallback challenges covering all 8 levels
const fallbackChallenges: Challenge[] = [
  {
    id: 'fallback-1',
    title: 'Forest Sprint',
    world: 'Moonlit Forest',
    difficulty: 'Easy',
    passage: 'The sun sets low and red birds fly fast over the big green lake at dusk.',
  },
  {
    id: 'fallback-2',
    title: 'Cedar Drift',
    world: 'Moonlit Forest',
    difficulty: 'Easy',
    passage: 'Tall cedar trees bend in the wind, and dry leaves spin slowly to the ground, painting the forest floor gold.',
  },
  {
    id: 'fallback-3',
    title: 'River Relay',
    world: 'Crystal Coast',
    difficulty: 'Medium',
    passage: 'The river bends sharply around the ancient boulder, carrying silt and broken branches with it. Each keystroke should match the relentless forward motion of water.',
  },
  {
    id: 'fallback-4',
    title: 'Tide Rush',
    world: 'Crystal Coast',
    difficulty: 'Medium',
    passage: 'Coastal storms arrive without warning; their fierce, salt-laden gusts strip the shoreline bare. Typists who maintain composure under pressure will always outlast those who rush and stumble on each difficult word transition.',
  },
  {
    id: 'fallback-5',
    title: 'Skyforge Trial',
    world: 'Neon Circuit',
    difficulty: 'Hard',
    passage: 'Precision is not a talent; it is a discipline forged through thousands of repetitions. The circuit board demands accuracy above all else: one misplaced signal disrupts the entire sequence, cascading into failures that compound with every subsequent keystroke you attempt.',
  },
  {
    id: 'fallback-6',
    title: 'Pulse Surge',
    world: 'Neon Circuit',
    difficulty: 'Hard',
    passage: 'High-frequency signals do not tolerate hesitation — each pulse arrives at precisely calculated intervals, demanding that operators respond without second-guessing their instincts. The system architecture was designed for speed; its fault-tolerance mechanisms will catch minor errors, but the operator rhythm must remain unbroken throughout the entire burst cycle.',
  },
  {
    id: 'fallback-7',
    title: 'Nova Ascent',
    world: 'Nova Terminal',
    difficulty: 'Hard',
    passage: 'Highly skilled operators understand that sustained performance — the kind that separates elite typists from intermediate ones — requires deliberate, well-paced keystrokes rather than frantic bursts of activity. Cognitive load must be carefully managed; the moment you allow anxiety to dictate your finger placement, your accuracy degrades faster than any speed-training regimen can compensate for.',
  },
  {
    id: 'fallback-8',
    title: 'Terminal Blitz',
    world: 'Nova Terminal',
    difficulty: 'Hard',
    passage: 'At the highest echelons of competitive typing, the distinction between raw speed and net-adjusted performance becomes critical: a typist who sustains ninety words per minute with ninety-eight percent accuracy will always outrank one who bursts at one hundred twenty but leaves a trail of uncorrected errors. True mastery is not about velocity alone; it is about the seamless integration of cognition, motor control, and real-time error-correction that elite practitioners develop over years of deliberate, focused practice.',
  },
];

function buildPrompt(level: number, difficulty: string): string {
  const spec = levelSpecs[Math.min(level, 8)] ?? levelSpecs[8];
  return [
    `Create a competitive typing challenge for level ${level} (${difficulty} difficulty).`,
    `Output ONLY a JSON object with keys: id (string), title (string), passage (string), difficulty ("${difficulty}"), world (string).`,
    `PASSAGE REQUIREMENTS (strictly enforce all of these):`,
    `- Length: between ${spec.minChars} and ${spec.maxChars} characters`,
    `- Vocabulary: ${spec.vocab}`,
    `- Punctuation: ${spec.punctuation}`,
    `- Structure: ${spec.structure}`,
    `- Theme: competitive typing, technology, focus, speed, precision — avoid fantasy or nature themes for hard levels`,
    `- Do NOT use the words: forest, keyboard, moon, cedar, river, ocean, wave, birds`,
    `- Make the passage feel genuinely harder than level ${level - 1}`,
  ].join(' ');
}

function extractJsonObject(text: string) {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fencedJson ?? text;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Gemini response did not include a JSON object.');
  }

  return candidate.slice(firstBrace, lastBrace + 1);
}

function normalizeDifficulty(difficulty: string): Challenge['difficulty'] {
  const normalized = difficulty.toLowerCase();
  if (normalized === 'easy') return 'Easy';
  if (normalized === 'hard') return 'Hard';
  return 'Medium';
}

function createFallbackChallenge(level: number, difficulty: string): Challenge {
  // Use the hand-crafted fallback if available
  const seeded = fallbackChallenges[level - 1];
  if (seeded) {
    return { ...seeded, difficulty: normalizeDifficulty(difficulty) };
  }

  // For levels beyond 8, cycle through hard fallbacks with variation
  const base = fallbackChallenges[(level % fallbackChallenges.length) + 4] ?? fallbackChallenges[7];
  return {
    id: `fallback-${level}`,
    title: `Nova Terminal ${level}`,
    passage: base.passage,
    difficulty: normalizeDifficulty(difficulty),
    world: 'Nova Terminal',
  };
}

function normalizeChallenge(level: number, difficulty: string, challenge: Partial<Challenge>): Challenge {
  const fallback = createFallbackChallenge(level, difficulty);

  return {
    id: challenge.id ?? `gemini-${level}-${Date.now()}`,
    title: challenge.title ?? fallback.title,
    passage: challenge.passage ?? fallback.passage,
    difficulty: normalizeDifficulty(challenge.difficulty ?? difficulty),
    world: challenge.world ?? fallback.world,
  };
}

export async function generateChallenge(level: number, difficulty: string): Promise<Challenge> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return createFallbackChallenge(level, difficulty);
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(level, difficulty) }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 512,
        },
      }),
    });

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!response.ok || !text) {
      throw new Error(data.error?.message ?? `Gemini API failed with status ${response.status}`);
    }

    const challenge = JSON.parse(extractJsonObject(text)) as Partial<Challenge>;

    // Validate passage length meets spec — fall back if AI ignored the constraint
    const spec = levelSpecs[Math.min(level, 8)] ?? levelSpecs[8];
    if (challenge.passage && (challenge.passage.length < spec.minChars * 0.8)) {
      console.warn(`Gemini passage too short for level ${level} (${challenge.passage.length} chars), using fallback`);
      return createFallbackChallenge(level, difficulty);
    }

    return normalizeChallenge(level, difficulty, challenge);
  } catch (error) {
    console.warn('Gemini challenge generation unavailable, using fallback challenge:', error);
    return createFallbackChallenge(level, difficulty);
  }
}
