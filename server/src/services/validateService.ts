export type KeystrokeLog = {
  offset: number; // offset in milliseconds from start
  char: string;   // the key/character pressed
};

export type ValidationResult = {
  valid: boolean;
  reason?: string;
};

/**
 * Validates a submitted attempt for potential cheating.
 * 
 * Check rules:
 * 1. Calculated WPM must match reported WPM.
 * 2. Speeds exceeding 250 WPM are flagged as superhuman.
 * 3. Keystroke interval standard deviation must not be unnaturally perfect (indicates uniform bot).
 * 4. Paste detection: if too many keys are pressed within 0ms of each other (macros/paste).
 * 5. Negative offsets or out-of-order logs are rejected.
 */
export function validateAttempt(params: {
  passage: string;
  wpm: number;
  accuracy: number;
  elapsedMs: number;
  logs?: KeystrokeLog[];
}): ValidationResult {
  const { passage, wpm, accuracy, elapsedMs, logs } = params;

  // 1. Basic sanity checks
  if (elapsedMs <= 0) {
    return { valid: false, reason: 'Elapsed time must be greater than zero.' };
  }
  if (wpm < 0 || accuracy < 0 || accuracy > 100) {
    return { valid: false, reason: 'Invalid WPM or Accuracy bounds.' };
  }

  // 2. WPM Calculation Check
  // WPM = (characters / 5) / (minutes)
  const calculatedWpm = Math.round((passage.length / 5) / (elapsedMs / 1000 / 60));
  const wpmDifference = Math.abs(wpm - calculatedWpm);
  
  if (wpmDifference > 8) {
    return { valid: false, reason: `WPM stats mismatch. Reported: ${wpm}, Calculated: ${calculatedWpm}` };
  }

  // 3. Superhuman speed limit
  if (wpm > 250) {
    return { valid: false, reason: 'Superhuman speed detected (> 250 WPM).' };
  }

  // If no logs are provided, reject from the official leaderboard but allow logging
  if (!logs || logs.length === 0) {
    return { valid: false, reason: 'Missing keystroke logs.' };
  }

  // 4. Validate keystroke timeline order and timeline sanity
  let zeroIntervals = 0;
  const intervals: number[] = [];

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    if (log.offset < 0 || log.offset > elapsedMs + 500) {
      return { valid: false, reason: 'Keystroke timeline exceeds test duration boundary.' };
    }

    if (i > 0) {
      const prevLog = logs[i - 1];
      const diff = log.offset - prevLog.offset;
      if (diff < 0) {
        return { valid: false, reason: 'Keystrokes are out of chronological order.' };
      }
      if (diff === 0) {
        zeroIntervals++;
      } else {
        intervals.push(diff);
      }
    }
  }

  // 5. Bot Paste / Macro Detection
  // If more than 8% of the keystrokes are exactly 0ms apart, it is likely pasted or inputted via script.
  const zeroIntervalFraction = zeroIntervals / logs.length;
  if (logs.length > 10 && zeroIntervalFraction > 0.08) {
    return { valid: false, reason: `Macro/Paste input signature detected. Zero-delay fraction: ${(zeroIntervalFraction * 100).toFixed(1)}%` };
  }

  // 6. Perfect Consistency Detection (Auto-typer bot checks)
  // Human typing has variance. If typing intervals are mathematically uniform (e.g. exactly 80ms every key), it's a bot.
  if (intervals.length > 10) {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Human typing standard deviation is rarely below 10ms
    if (stdDev < 5) {
      return { valid: false, reason: `Unnatural typing rhythm detected. Standard deviation: ${stdDev.toFixed(2)}ms` };
    }
  }

  return { valid: true };
}
