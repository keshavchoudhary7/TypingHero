import fs from 'fs';
import path from 'path';

export type PassageItem = {
  id?: string;
  levelId?: number;
  title?: string;
  passage: string;
  world?: string;
};

export type PassagesData = {
  easy: PassageItem[];
  medium: PassageItem[];
  hard: PassageItem[];
  multiplayer: PassageItem[];
};

let cachedPassages: PassagesData | null = null;

// High-quality in-memory fallbacks if passages.json is missing or corrupted.
const fallbackPassages: PassagesData = {
  easy: [
    {
      id: "fallback-easy-1",
      title: "Forest Sprint",
      passage: "The sun sets low and red birds fly fast over the big green lake at dusk.",
      world: "Moonlit Forest"
    },
    {
      id: "fallback-easy-2",
      title: "Cedar Drift",
      passage: "Tall cedar trees bend in the wind, and dry leaves spin slowly to the ground, painting the forest floor gold.",
      world: "Moonlit Forest"
    }
  ],
  medium: [
    {
      id: "fallback-medium-1",
      title: "River Relay",
      passage: "The river bends sharply around the ancient boulder, carrying silt and broken branches with it. Each keystroke should match the relentless forward motion of water.",
      world: "Crystal Coast"
    },
    {
      id: "fallback-medium-2",
      title: "Tide Rush",
      passage: "Coastal storms arrive without warning; their fierce, salt-laden gusts strip the shoreline bare. Typists who maintain composure under pressure will always outlast those who rush and stumble on each difficult word transition.",
      world: "Crystal Coast"
    }
  ],
  hard: [
    {
      id: "fallback-hard-1",
      title: "Skyforge Trial",
      passage: "Precision is not a talent; it is a discipline forged through thousands of repetitions. The circuit board demands accuracy above all else: one misplaced signal disrupts the entire sequence, cascading into failures that compound with every subsequent keystroke you attempt.",
      world: "Neon Circuit"
    },
    {
      id: "fallback-hard-2",
      title: "Pulse Surge",
      passage: "High-frequency signals do not tolerate hesitation — each pulse arrives at precisely calculated intervals, demanding that operators respond without second-guessing their instincts. The system architecture was designed for speed; its fault-tolerance mechanisms will catch minor errors, but the operator rhythm must remain unbroken throughout the entire burst cycle.",
      world: "Neon Circuit"
    }
  ],
  multiplayer: [
    {
      levelId: 101,
      passage: "Deep in the Whispering Woods, a rogue shadows the sleeping dragon, waiting for the crystal to glow."
    },
    {
      levelId: 102,
      passage: "Mages of the Obsidian Citadel chant old runes of power, locking the gates against the invading iron army."
    },
    {
      levelId: 103,
      passage: "The swift archer draws her golden bow, aiming at the target glowing on top of the ancient stone ruins."
    },
    {
      levelId: 104,
      passage: "Valiant knights shield the castle gates as wizards conjure celestial fires to protect the realm."
    },
    {
      levelId: 105,
      passage: "Under the blood moon, shadow blades duel on the high rooftops of the forgotten desert city."
    }
  ]
};

export function loadPassages(): PassagesData {
  if (cachedPassages) {
    return cachedPassages;
  }

  const filePath = path.join(process.cwd(), 'data', 'passages.json');
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      cachedPassages = JSON.parse(content) as PassagesData;
      
      // Basic schema validation
      if (
        cachedPassages.easy && Array.isArray(cachedPassages.easy) &&
        cachedPassages.medium && Array.isArray(cachedPassages.medium) &&
        cachedPassages.hard && Array.isArray(cachedPassages.hard) &&
        cachedPassages.multiplayer && Array.isArray(cachedPassages.multiplayer)
      ) {
        return cachedPassages;
      }
      console.warn('passages.json format is invalid. Using hardcoded fallbacks.');
      cachedPassages = null;
    } else {
      console.warn(`passages.json not found at ${filePath}. Using hardcoded fallbacks.`);
    }
  } catch (err) {
    console.error('Error loading passages.json. Using hardcoded fallbacks:', err);
  }

  return fallbackPassages;
}

export function getRandomPassageByDifficulty(difficulty: string): { id: string; title: string; passage: string; world: string } {
  const data = loadPassages();
  const normDiff = difficulty.toLowerCase();
  
  let pool: PassageItem[];
  if (normDiff === 'easy') {
    pool = data.easy;
  } else if (normDiff === 'hard') {
    pool = data.hard;
  } else {
    pool = data.medium;
  }

  if (!pool || pool.length === 0) {
    pool = fallbackPassages.medium;
  }

  const index = Math.floor(Math.random() * pool.length);
  const selected = pool[index];

  return {
    id: selected.id || `json-${normDiff}-${index}-${Date.now()}`,
    title: selected.title || 'Dynamic Challenge',
    passage: selected.passage,
    world: selected.world || 'Moonlit Forest'
  };
}

export function getRandomMultiplayerPassage(): { levelId: number; passage: string } {
  const data = loadPassages();
  const pool = data.multiplayer && data.multiplayer.length > 0 ? data.multiplayer : fallbackPassages.multiplayer;

  const index = Math.floor(Math.random() * pool.length);
  const selected = pool[index];

  return {
    levelId: selected.levelId || (101 + index),
    passage: selected.passage
  };
}
