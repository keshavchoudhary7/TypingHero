import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { gsap } from 'gsap';
import {
  calculateStats,
  getAchievements,
  getLevelStars,
  isLevelUnlocked,
  levels,
  type Achievement,
  type Level,
} from '../lib/typing';
import {
  calculateXP,
  computeStreak,
  getDailyLevelId,
  getHeroRank,
  getWelcomeBackType,
  isDailyDone,
  isStreakAtRisk,
  type HeroRank,
  type WelcomeBackType,
  type XPGain,
} from '../lib/xp';
import { fetchGeneratedChallenge, normalizeGeneratedChallenge } from '../lib/challengeApi';
import { buildProgressPayload, loadProgress, saveProgress } from '../lib/progressApi';
import { useAuth } from '../lib/authContext';
import MetricTile from '../components/ui/MetricTile';
import PrimaryButton from '../components/ui/PrimaryButton';
import OrbitalStage from '../components/three/OrbitalStage';
import AchievementsPage from './AchievementsPage';
import VictoryPopup from '../components/game/VictoryPopup';
import WorldMap from '../components/game/WorldMap';
import XPBar from '../components/game/XPBar';
import StreakBadge from '../components/game/StreakBadge';
import DailyChallenge from '../components/game/DailyChallenge';
import XPToast from '../components/game/XPToast';
import WelcomeBackModal from '../components/game/WelcomeBackModal';

type LevelResult = { accuracy: number; wpm: number; netWpm: number; stars: number };

const getArenaTier = (accuracy: number) => {
  if (accuracy >= 97) return 'Champion';
  if (accuracy >= 92) return 'Elite';
  if (accuracy >= 85) return 'Pro';
  return 'Rookie';
};

const tierConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  Champion: { color: '#ffd700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.25)',  icon: '👑' },
  Elite:    { color: '#00f5ff', bg: 'rgba(0,245,255,0.08)',  border: 'rgba(0,245,255,0.25)',  icon: '💠' },
  Pro:      { color: '#bf5fff', bg: 'rgba(191,95,255,0.08)', border: 'rgba(191,95,255,0.25)', icon: '🔮' },
  Rookie:   { color: '#94a3b8', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', icon: '🎮' },
};

const achievementStateColor: Record<Achievement['state'], string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold:   '#ffd700',
  Heroic: '#ff3cac',
  Unlocked: '#39ff14',
};

function DashboardPage() {
  const [challengePool, setChallengePool] = useState<Level[]>(levels);
  const [activeLevelId, setActiveLevelId] = useState(levels[0].id);
  const [typed, setTyped] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'ready' | 'running' | 'paused' | 'finished'>('ready');
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [levelResults, setLevelResults] = useState<Record<number, LevelResult>>({});
  const [showWinBurst, setShowWinBurst] = useState(false);
  const [showVictoryPopup, setShowVictoryPopup] = useState(false);
  const [pendingNextChallenge, setPendingNextChallenge] = useState<Level | null>(null);
  const [currentPage, setCurrentPage] = useState<'arena' | 'achievements'>('arena');
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [isGeneratingActive, setIsGeneratingActive] = useState(false);
  const [newPB, setNewPB] = useState(false);
  // ── M3: progression state ─────────────────────────────────────────────────
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastPlayedDate, setLastPlayedDate] = useState<string | null>(null);
  const [dailyChallengeDoneDate, setDailyChallengeDoneDate] = useState<string | null>(null);
  const [xpGain, setXpGain] = useState<XPGain | null>(null);
  const [leveledUp, setLeveledUp] = useState<HeroRank | null>(null);
  const [welcomeBackType, setWelcomeBackType] = useState<WelcomeBackType>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const { user, token } = useAuth();
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const generatedLevelIdsRef = useRef<Set<number>>(new Set());
  const keystrokeLogsRef = useRef<Array<{ offset: number; char: string }>>([]);

  const [challengeData, setChallengeData] = useState<{
    levelId: number;
    challengerName: string;
    wpm: number;
    accuracy: number;
  } | null>(null);
  const [challengeResult, setChallengeResult] = useState<{
    won: boolean;
    challengerWpm: number;
    challengerAccuracy: number;
    challengerName: string;
    playerWpm: number;
    playerAccuracy: number;
  } | null>(null);

  // Parse challenge query parameter on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const challengeParam = searchParams.get('challenge');
    if (challengeParam) {
      try {
        const [lvlStr, challenger, wpmStr, accStr] = challengeParam.split(':');
        const levelId = Number(lvlStr);
        const wpm = Number(wpmStr);
        const accuracy = Number(accStr);
        
        if (!isNaN(levelId) && challenger && !isNaN(wpm) && !isNaN(accuracy)) {
          setChallengeData({
            levelId,
            challengerName: decodeURIComponent(challenger),
            wpm,
            accuracy,
          });
          setActiveLevelId(levelId);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error('Failed to parse challenge query:', e);
      }
    }
  }, []);

  const activeLevel = challengePool.find((l) => l.id === activeLevelId) ?? challengePool[0];
  const passage = activeLevel.passage;

  // ─── Character-level feedback for the active word ────────────────────────
  const charFeedback = useMemo(() => {
    const words = passage.split(' ');
    const trimmedText = typed.trimEnd();
    const typedWords = trimmedText.length === 0 ? [] : trimmedText.split(' ');
    const isTrailingSpace = typed.endsWith(' ');
    const activeIndex = isTrailingSpace ? typedWords.length : typedWords.length - 1;

    return words.map((word, wIdx) => {
      const typedWord = typedWords[wIdx] ?? '';
      const isActive = wIdx === activeIndex;
      const isLocked = wIdx < typedWords.length - (isTrailingSpace ? 0 : 1);

      // For locked words — simple word state
      if (isLocked) {
        const wordCorrect = typedWord === word;
        return {
          word,
          wordState: wordCorrect ? 'correct' : 'incorrect',
          active: false,
          // char-level detail for locked words
          chars: word.split('').map((ch, ci) => ({
            ch,
            state: typedWord[ci] === undefined ? 'untyped'
              : typedWord[ci] === ch ? 'correct' : 'incorrect',
          })),
        } as const;
      }

      // Active word — character-level breakdown
      if (isActive) {
        const chars = word.split('').map((ch, ci) => ({
          ch,
          state: typedWord[ci] === undefined ? 'untyped'
            : typedWord[ci] === ch ? 'correct' : 'incorrect',
        }));
        const wordMismatched = typedWord.length > 0 && !word.startsWith(typedWord);
        return {
          word,
          wordState: typedWord.length === 0 ? 'active' : wordMismatched ? 'incorrect' : 'typing',
          active: true,
          chars,
          cursorPos: typedWord.length, // which char position the cursor is at
        } as const;
      }

      return {
        word,
        wordState: 'pending',
        active: false,
        chars: word.split('').map((ch) => ({ ch, state: 'untyped' as const })),
      } as const;
    });
  }, [passage, typed]);

  // ─── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || startedAt === null) return undefined;
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => window.clearInterval(timer);
  }, [isRunning, startedAt]);

  useEffect(() => {
    if (typed === passage) { setIsRunning(false); setStatus('finished'); }
  }, [passage, typed]);

  // ─── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => calculateStats({ passage, typed, elapsedMs }), [elapsedMs, passage, typed]);
  const progress = Math.min(Math.round((typed.length / passage.length) * 100), 100);
  const unlocked = isLevelUnlocked(activeLevel.id, completedLevels);
  const currentLevelIndex = challengePool.findIndex((l) => l.id === activeLevelId);
  const nextLevelTitle = challengePool[currentLevelIndex + 1]?.title ?? `Next challenge level ${currentLevelIndex + 2}`;
  const rank = getArenaTier(stats.accuracy);
  const combo = Math.max(1, Math.round(stats.wpm / 14));
  const tc = tierConfig[rank] ?? tierConfig.Rookie;
  const isComboHigh = combo >= 5;

  // ─── Achievements ────────────────────────────────────────────────────────
  const achievements = useMemo(
    () => getAchievements({ completedLevels, accuracy: stats.accuracy, wpm: stats.wpm, status }),
    [completedLevels, stats.accuracy, stats.wpm, status],
  );

  // ─── Challenge helpers ───────────────────────────────────────────────────
  const upsertChallenge = useCallback((challenge: Level) => {
    setChallengePool((current) => {
      const existingIndex = current.findIndex((l) => l.id === challenge.id);
      if (existingIndex === -1) return [...current, challenge].sort((a, b) => a.id - b.id);
      return current.map((l) => (l.id === challenge.id ? { ...l, ...challenge } : l));
    });
  }, []);

  const getDifficultyForLevel = (level: number): 'Easy' | 'Medium' | 'Hard' => {
    if (level <= 2) return 'Easy';
    if (level <= 5) return 'Medium';
    return 'Hard';
  };

  const generateChallenge = useCallback(async (level: number) => {
    setIsGeneratingNext(true);
    try {
      const generated = await fetchGeneratedChallenge(level, getDifficultyForLevel(level));
      const normalized = normalizeGeneratedChallenge(level, generated);
      generatedLevelIdsRef.current.add(level);
      return normalized;
    } catch {
      return null;
    } finally {
      setIsGeneratingNext(false);
    }
  }, []);

  const generateActiveChallenge = useCallback(async (level: number) => {
    if (generatedLevelIdsRef.current.has(level)) return;
    setIsGeneratingActive(true);
    const generated = await generateChallenge(level);
    if (generated) upsertChallenge(generated);
    setIsGeneratingActive(false);
  }, [generateChallenge, upsertChallenge]);

  // ─── Load saved progress on mount / auth change ──────────────────────────
  useEffect(() => {
    void (async () => {
      try {
        const persisted = await loadProgress(user?.id || 'hero-user', token);
        setCompletedLevels(persisted.completedLevels);
        setLevelResults(persisted.levelResults as Record<number, LevelResult>);
        const nextId = persisted.activeLevelId ?? 1;
        setActiveLevelId(nextId);
        void generateActiveChallenge(nextId);
        // M3: restore progression
        setTotalXp(persisted.xp ?? 0);
        setStreak(persisted.streak ?? 0);
        setLastPlayedDate(persisted.lastPlayedDate ?? null);
        setDailyChallengeDoneDate(persisted.dailyChallengeDoneDate ?? null);
        // Welcome-back modal
        const wbType = getWelcomeBackType({
          lastPlayedDate: persisted.lastPlayedDate ?? null,
          streak: persisted.streak ?? 0,
          totalXp: persisted.xp ?? 0,
        });
        if (wbType) {
          setWelcomeBackType(wbType);
          setShowWelcomeBack(true);
        }
      } catch {
        void generateActiveChallenge(1);
      }
    })();
  }, [generateActiveChallenge, user?.id, token]);


  // ─── Entry animations ────────────────────────────────────────────────────
  useEffect(() => {
    if (!dashboardRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.metric-card', { duration: 0.9, y: 24, opacity: 0, stagger: 0.08, ease: 'power3.out' });
    }, dashboardRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (status !== 'finished' || !winRef.current) return undefined;
    setShowWinBurst(true);
    const anim = gsap.fromTo(
      winRef.current,
      { scale: 0.7, opacity: 0 },
      { duration: 0.6, scale: 1, opacity: 1, ease: 'elastic.out(1, 0.6)',
        onComplete: () => { gsap.to(winRef.current, { duration: 0.3, scale: 1.05, repeat: 1, yoyo: true }); },
      },
    );
    return () => { anim.kill(); };
  }, [status]);

  // ─── Persistence ─────────────────────────────────────────────────────────
  const persistProgress = useCallback(async (
    nextCompleted: number[],
    nextResults: Record<number, LevelResult>,
    nextActiveId: number | null,
    m3?: { xp: number; streak: number; lastPlayedDate: string | null; dailyChallengeDoneDate: string | null },
  ) => {
    setIsSavingProgress(true);
    try {
      await saveProgress(user?.id || 'hero-user', buildProgressPayload({
        activeLevelId: nextActiveId,
        completedLevels: nextCompleted,
        levelResults: nextResults,
        xp: m3?.xp ?? totalXp,
        streak: m3?.streak ?? streak,
        lastPlayedDate: m3?.lastPlayedDate ?? lastPlayedDate,
        dailyChallengeDoneDate: m3?.dailyChallengeDoneDate ?? dailyChallengeDoneDate,
      }), token);
    } catch { /* silently continue */ }
    finally { setIsSavingProgress(false); }
  }, [totalXp, streak, lastPlayedDate, dailyChallengeDoneDate, user?.id, token]);

  // ─── Victory / Navigation ────────────────────────────────────────────────
  const resetRun = useCallback(() => {
    setTyped(''); setElapsedMs(0); setStartedAt(null); setIsRunning(false); setStatus('ready');
    setShowWinBurst(false);
    keystrokeLogsRef.current = [];
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleVictoryClose = () => {
    setShowVictoryPopup(false);
    setChallengeData(null);
    setChallengeResult(null);
    if (pendingNextChallenge) {
      upsertChallenge(pendingNextChallenge);
      setActiveLevelId(pendingNextChallenge.id);
      setPendingNextChallenge(null);
      resetRun();
    }
  };

  const handleSelectLevel = (levelId: number) => {
    setActiveLevelId(levelId);
    setShowWorldMap(false);
    resetRun();
    void generateActiveChallenge(levelId);
  };

  const handleGoToNext = async () => {
    const nextLevelNumber = activeLevel.id + 1;
    const seeded = challengePool.find((l) => l.id === nextLevelNumber);
    const generated = pendingNextChallenge ??
      (generatedLevelIdsRef.current.has(nextLevelNumber) ? null : await generateChallenge(nextLevelNumber));
    const nextLevel = generated ?? seeded;
    if (nextLevel) { upsertChallenge(nextLevel); setActiveLevelId(nextLevel.id); setPendingNextChallenge(null); resetRun(); }
  };

  // ─── Input handling ───────────────────────────────────────────────────────
  const startTyping = useCallback(() => {
    if (isRunning) return;
    setStartedAt(Date.now() - elapsedMs);
    setIsRunning(true);
    setStatus('running');
  }, [isRunning, elapsedMs]);

  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value.slice(0, passage.length);
    const currentElapsed = isRunning ? Date.now() - (startedAt ?? Date.now()) : elapsedMs;
    const nextStats = calculateStats({ passage, typed: nextValue, elapsedMs: currentElapsed });
    
    // Log keypress timings for anti-cheat verification
    if (nextValue.length > typed.length) {
      const activeStartedAt = startedAt ?? Date.now();
      const offset = startedAt ? Date.now() - startedAt : 0;
      const lastChar = nextValue[nextValue.length - 1] || '';
      keystrokeLogsRef.current.push({ offset, char: lastChar });
    }

    setTyped(nextValue);
    if (nextValue.length > 0 && !isRunning && status !== 'paused') startTyping();

    if (nextValue === passage) {
      setIsRunning(false);
      setStatus('finished');
      setShowVictoryPopup(true);
      const stars = getLevelStars({ accuracy: nextStats.accuracy, wpm: nextStats.wpm, level: activeLevel.id });
      const prevResult = levelResults[activeLevel.id];
      const isNewPB = !prevResult || nextStats.wpm > prevResult.wpm;
      if (isNewPB) { setNewPB(true); setTimeout(() => setNewPB(false), 3500); }
      const nextResults: Record<number, LevelResult> = {
        ...levelResults,
        [activeLevel.id]: { accuracy: nextStats.accuracy, wpm: nextStats.wpm, netWpm: nextStats.netWpm, stars },
      };
      const nextCompleted = completedLevels.includes(activeLevel.id) ? completedLevels : [...completedLevels, activeLevel.id];
      setLevelResults(nextResults);
      setCompletedLevels(nextCompleted);

      // ── M3: XP + streak ────────────────────────────────────────────────
      const dailyId = getDailyLevelId(challengePool.length);
      const isDaily = activeLevel.id === dailyId && !isDailyDone(dailyChallengeDoneDate);
      const gain = calculateXP({
        wpm: nextStats.wpm,
        accuracy: nextStats.accuracy,
        stars,
        difficulty: activeLevel.difficulty as 'Easy' | 'Medium' | 'Hard',
        isDaily,
      });
      const newTotalXp = totalXp + gain.total;
      const prevRank = getHeroRank(totalXp);
      const newRank = getHeroRank(newTotalXp);
      const rankUp = newRank.level > prevRank.level ? newRank : null;
      const { streak: newStreak, lastPlayedDate: newLastPlayed } = computeStreak({ lastPlayedDate, currentStreak: streak });
      const newDailyDone = isDaily ? new Date().toISOString().slice(0, 10) : dailyChallengeDoneDate;
      setTotalXp(newTotalXp);
      setStreak(newStreak);
      setLastPlayedDate(newLastPlayed);
      setDailyChallengeDoneDate(newDailyDone);
      setXpGain(gain);
      if (rankUp) setLeveledUp(rankUp);
      
      // Calculate challenge outcome if active
      if (challengeData) {
        setChallengeResult({
          won: nextStats.wpm >= challengeData.wpm,
          challengerWpm: challengeData.wpm,
          challengerAccuracy: challengeData.accuracy,
          challengerName: challengeData.challengerName,
          playerWpm: nextStats.wpm,
          playerAccuracy: nextStats.accuracy,
        });
      } else {
        setChallengeResult(null);
      }
      // ─────────────────────────────────────────────────────────────────

      void persistProgress(nextCompleted, nextResults, activeLevel.id, {
        xp: newTotalXp, streak: newStreak, lastPlayedDate: newLastPlayed, dailyChallengeDoneDate: newDailyDone,
      });

      // ── Leaderboard Submission with Anti-cheat ───────────────────────
      void (async () => {
        try {
          await fetch('http://localhost:4000/api/leaderboard/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              levelId: activeLevel.id,
              wpm: nextStats.wpm,
              accuracy: nextStats.accuracy,
              elapsedMs: currentElapsed,
              passage,
              stars,
              logs: keystrokeLogsRef.current,
              username: user?.username || 'Guest Hero',
              avatarId: user?.avatarId || 'knight',
            }),
          });
        } catch (err) {
          console.error('Failed to submit score to leaderboard:', err);
        }
      })();

      const nextLevelNumber = activeLevel.id + 1;
      if (!generatedLevelIdsRef.current.has(nextLevelNumber)) {
        void generateChallenge(nextLevelNumber).then((gen) => { if (gen) setPendingNextChallenge(gen); });
      }
    }
  };


  const togglePause = () => {
    if (status === 'running') {
      setElapsedMs(Date.now() - (startedAt ?? Date.now()));
      setIsRunning(false);
      setStatus('paused');
      return;
    }
    setStartedAt(Date.now() - elapsedMs);
    setIsRunning(true);
    setStatus('running');
  };

  // ─── Current level's victory stats (for popup) ───────────────────────────
  const currentResult = levelResults[activeLevel.id];
  const victoryStats = {
    wpm: currentResult?.wpm ?? stats.wpm,
    netWpm: currentResult?.netWpm ?? stats.netWpm,
    accuracy: currentResult?.accuracy ?? stats.accuracy,
    stars: currentResult?.stars ?? getLevelStars({ accuracy: stats.accuracy, wpm: stats.wpm, level: activeLevel.id }),
  };

  // ─── M3 derived values ────────────────────────────────────────────────────
  const dailyLevelId = getDailyLevelId(challengePool.length);
  const dailyLevel = challengePool.find((l) => l.id === dailyLevelId) ?? challengePool[0];
  const dailyDone = isDailyDone(dailyChallengeDoneDate);
  const streakAtRisk = isStreakAtRisk(lastPlayedDate);
  const heroRank = getHeroRank(totalXp);

  if (currentPage === 'achievements') {
    return (
      <AchievementsPage
        achievements={achievements}
        completedLevels={completedLevels.length}
        totalLevels={challengePool.length}
        onBack={() => setCurrentPage('arena')}
      />
    );
  }

  return (
    <>
    <div ref={dashboardRef} className="relative min-h-screen overflow-hidden text-slate-100 grid-bg" style={{ background: '#050711' }}>
      {/* Ambient orbs */}
      <div className="ambient-orb pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)' }} />
      <div className="ambient-orb-2 pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(191,95,255,0.08) 0%, transparent 70%)' }} />

      {/* Victory popup */}
      <VictoryPopup
        visible={showVictoryPopup}
        levels={challengePool}
        completedLevels={completedLevels}
        levelResults={levelResults}
        activeLevelId={activeLevelId}
        stats={victoryStats}
        onClose={handleVictoryClose}
        onSelectLevel={handleSelectLevel}
        challengeResult={challengeResult}
      />

      {/* World map drawer */}
      {showWorldMap && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-end p-4 pt-20"
          style={{ background: 'rgba(5,7,14,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowWorldMap(false)}
        >
          <div
            className="h-[80vh] w-full max-w-sm overflow-hidden rounded-2xl"
            style={{ background: 'rgba(8,12,22,0.98)', border: '1px solid rgba(0,245,255,0.15)', boxShadow: '0 0 60px rgba(0,245,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
              <div className="flex items-center gap-2">
                <span>🗺</span>
                <span className="text-sm font-bold text-white">World Map</span>
              </div>
              <button onClick={() => setShowWorldMap(false)} className="text-xs text-slate-500 hover:text-slate-300">✕ Close</button>
            </div>
            <div className="h-[calc(80vh-3rem)] overflow-y-auto p-3">
              <WorldMap
                levels={challengePool}
                completedLevels={completedLevels}
                levelResults={levelResults}
                activeLevelId={activeLevelId}
                onSelectLevel={handleSelectLevel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Win burst overlay */}
      {showWinBurst && status === 'finished' ? (
        <div ref={winRef} className="pointer-events-none absolute inset-x-0 top-24 z-40 mx-auto flex w-full justify-center opacity-0">
          <div className="rounded-2xl px-10 py-5 text-center backdrop-blur-xl"
            style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.3)', boxShadow: '0 0 60px rgba(0,245,255,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: '#00f5ff' }}>⚡ Victory</p>
            <p className="mt-2 text-4xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>Level Complete!</p>
            {newPB && <p className="mt-1 text-sm font-bold" style={{ color: '#ffb703', textShadow: '0 0 10px rgba(255,183,3,0.5)' }}>🏆 New Personal Best!</p>}
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ─── HEADER ─── */}
        <header className="relative mb-5 overflow-hidden rounded-2xl p-5"
          style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(0,245,255,0.1)', backdropFilter: 'blur(24px)', boxShadow: '0 0 60px rgba(0,245,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.5), rgba(191,95,255,0.4), transparent)' }} />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(191,95,255,0.1))', border: '1px solid rgba(0,245,255,0.25)', boxShadow: '0 0 20px rgba(0,245,255,0.15)' }}>
                ⌨️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#00f5ff', textShadow: '0 0 8px rgba(0,245,255,0.5)' }}>TypingHero</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ background: 'rgba(191,95,255,0.12)', border: '1px solid rgba(191,95,255,0.3)', color: '#bf5fff' }}>Battle Arena</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #39ff14' }} />
                  <span className="text-xs text-slate-500">{isSavingProgress ? 'Saving...' : 'Live · Synced'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Achievement badges */}
              {achievements.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {achievements.slice(0, 4).map((ach) => (
                    <div
                      key={ach.id}
                      title={`${ach.title}: ${ach.description}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm cursor-help"
                      style={{ background: `${achievementStateColor[ach.state]}15`, border: `1px solid ${achievementStateColor[ach.state]}40`, boxShadow: `0 0 8px ${achievementStateColor[ach.state]}30` }}
                    >
                      {ach.icon}
                    </div>
                  ))}
                  {achievements.length > 4 && (
                    <span className="text-xs text-slate-500">+{achievements.length - 4}</span>
                  )}
                </div>
              )}

              {/* Milestone counter */}
              <div className="rounded-xl px-4 py-2.5 text-center" style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Progress</p>
                <p className="mt-0.5 text-xl font-black tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00f5ff', textShadow: '0 0 12px rgba(0,245,255,0.5)' }}>
                  {completedLevels.length}<span className="text-base text-slate-600"> / {challengePool.length}</span>
                </p>
              </div>

              {/* M3: streak compact badge */}
              <StreakBadge streak={streak} atRisk={streakAtRisk} compact />

              {/* M3: hero rank chip */}
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ background: `${heroRank.color}12`, border: `1px solid ${heroRank.color}35` }}
              >
                <span style={{ fontSize: '0.85rem' }}>{heroRank.icon}</span>
                <span className="text-[10px] font-bold" style={{ color: heroRank.color }}>{heroRank.title}</span>
              </div>

              <PrimaryButton onClick={() => setShowWorldMap(true)} variant="purple">🗺 World Map</PrimaryButton>
              <PrimaryButton onClick={() => setCurrentPage('achievements')} variant="dark">📈 Achievements</PrimaryButton>
            </div>
          </div>
        </header>

        {/* ─── MAIN GRID ─── */}
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* ─── LEFT COLUMN ─── */}
          <div className="flex flex-col gap-4">
            {/* Friend Challenge Active Banner */}
            {challengeData && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3 border border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚔️</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      Challenge Active: Beat {challengeData.challengerName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Target: <span className="text-indigo-400 font-bold font-mono">{challengeData.wpm} WPM</span> at {challengeData.accuracy}% accuracy.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setChallengeData(null);
                    setChallengeResult(null);
                  }}
                  className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Status bar: tier row */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(10,14,28,0.7)', border: '1px solid rgba(30,41,59,0.8)' }}>
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Arena</p>
                <span className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: activeLevel.difficulty === 'Easy' ? 'rgba(57,255,20,0.1)' : activeLevel.difficulty === 'Hard' ? 'rgba(255,60,172,0.1)' : 'rgba(0,245,255,0.1)', border: `1px solid ${activeLevel.difficulty === 'Easy' ? 'rgba(57,255,20,0.3)' : activeLevel.difficulty === 'Hard' ? 'rgba(255,60,172,0.3)' : 'rgba(0,245,255,0.3)'}`, color: activeLevel.difficulty === 'Easy' ? '#39ff14' : activeLevel.difficulty === 'Hard' ? '#ff3cac' : '#00f5ff' }}>
                  {activeLevel.difficulty}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">Lv.{activeLevel.id} · {activeLevel.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {(['Champion', 'Elite', 'Pro', 'Rookie'] as const).map((tier) => {
                  const t = tierConfig[tier];
                  const isCurrent = rank === tier;
                  return (
                    <div key={tier} className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-300"
                      style={{ background: isCurrent ? t.bg : 'transparent', border: `1px solid ${isCurrent ? t.border : 'rgba(30,41,59,0.4)'}`, color: isCurrent ? t.color : 'rgba(100,116,139,0.3)', boxShadow: isCurrent ? `0 0 10px ${t.bg}` : 'none' }}>
                      {isCurrent && <span>{t.icon}</span>}
                      {tier}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metrics: 5 tiles — WPM, Net WPM, Accuracy, Errors, Progress */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              <MetricTile label="WPM" value={stats.wpm} accent="cyan" subtitle="Gross" />
              <MetricTile label="Net WPM" value={stats.netWpm} accent="violet" subtitle="Adjusted" />
              <MetricTile label="Accuracy" value={`${stats.accuracy}%`} accent="emerald" subtitle="Precision" />
              <MetricTile label="Errors" value={stats.incorrectChars} accent="rose" subtitle="Mistakes" />
              <MetricTile label="Progress" value={`${progress}%`} accent="amber" subtitle="Completion" />
            </div>

            {/* Progress + Combo row */}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="rounded-xl p-4" style={{ background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(30,41,59,0.7)' }}>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Power Gauge — {activeLevel.title}</span>
                  <span className="text-xs text-slate-500 tabular-nums">{typed.length}/{passage.length}</span>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.5)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(progress, 2)}%`, background: progress >= 90 ? 'linear-gradient(90deg, #ff3cac, #ffb703)' : progress >= 50 ? 'linear-gradient(90deg, #00f5ff, #bf5fff)' : 'linear-gradient(90deg, #00f5ff, #0ea5e9)', boxShadow: progress > 0 ? '0 0 8px rgba(0,245,255,0.4)' : 'none' }} />
                  {isRunning && progress > 0 && (
                    <div className="absolute inset-0 rounded-full opacity-30" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }} />
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-600">
                  {status === 'finished' ? '✅ Challenge complete!' : status === 'running' ? '⚡ Keep going!' : status === 'paused' ? '⏸ Paused — resume when ready' : 'Start typing to begin the race'}
                </p>
              </div>
              <div className="flex min-w-[110px] flex-col items-center justify-center rounded-xl p-4 text-center"
                style={{ background: isComboHigh ? 'rgba(255,183,3,0.06)' : 'rgba(10,14,28,0.8)', border: `1px solid ${isComboHigh ? 'rgba(255,183,3,0.25)' : 'rgba(30,41,59,0.7)'}`, boxShadow: isComboHigh ? '0 0 20px rgba(255,183,3,0.15)' : 'none' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Combo</p>
                <p className={`text-4xl font-black tabular-nums ${isComboHigh ? 'combo-active' : ''}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: isComboHigh ? '#ffb703' : '#bf5fff', textShadow: isComboHigh ? '0 0 15px rgba(255,183,3,0.7)' : '0 0 10px rgba(191,95,255,0.5)' }}>
                  {combo}x
                </p>
                <p className="mt-1 text-[10px] text-slate-600">{isComboHigh ? '🔥 On fire!' : 'multiplier'}</p>
              </div>
            </div>

            {/* ─── TYPING ARENA ─── */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(8,12,22,0.95)', border: '1px solid rgba(0,245,255,0.1)', boxShadow: isRunning ? '0 0 30px rgba(0,245,255,0.06), inset 0 0 30px rgba(0,245,255,0.02)' : 'none', transition: 'box-shadow 0.5s' }}>
              {/* Arena header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full"
                    style={{ background: status === 'running' ? '#39ff14' : status === 'paused' ? '#ffb703' : status === 'finished' ? '#00f5ff' : '#475569', boxShadow: status === 'running' ? '0 0 8px #39ff14' : status === 'paused' ? '0 0 8px #ffb703' : 'none' }} />
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {isGeneratingActive ? 'Generating challenge...' : unlocked ? 'Active Challenge' : 'Locked'}
                  </span>
                </div>
                {status === 'running' && (
                  <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', animation: 'live-pulse 1.2s ease-in-out infinite' }}>
                    ● LIVE
                  </span>
                )}
              </div>

              {/* ─── Character-level word display ─── */}
              <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(5,8,16,0.8)', border: '1px solid rgba(30,41,59,0.5)', minHeight: '5.5rem' }}>
                <p className="flex flex-wrap gap-x-2 gap-y-2 leading-8" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem' }}>
                  {charFeedback.map((segment, wIdx) => {
                    const isActiveWord = segment.active;

                    if (isActiveWord || segment.wordState === 'correct' || segment.wordState === 'incorrect') {
                      // Render character-by-character
                      return (
                        <span
                          key={`w-${wIdx}`}
                          className="inline-flex items-center rounded-lg border px-1.5 py-0.5 transition-all duration-100"
                          style={{
                            borderColor: segment.wordState === 'correct' ? 'rgba(57,255,20,0.2)' : segment.wordState === 'incorrect' && !isActiveWord ? 'rgba(255,68,68,0.3)' : isActiveWord && segment.wordState === 'incorrect' ? 'rgba(255,68,68,0.3)' : isActiveWord ? 'rgba(191,95,255,0.25)' : 'transparent',
                            background: segment.wordState === 'correct' ? 'rgba(57,255,20,0.05)' : segment.wordState === 'incorrect' && !isActiveWord ? 'rgba(255,68,68,0.08)' : isActiveWord ? 'rgba(191,95,255,0.07)' : 'transparent',
                          }}
                        >
                          {'chars' in segment && segment.chars.map((c, ci) => {
                            const isAtCursor = isActiveWord && 'cursorPos' in segment && ci === segment.cursorPos;
                            return (
                              <span key={ci} style={{ position: 'relative', display: 'inline-block' }}>
                                {isAtCursor && (
                                  <span style={{ position: 'absolute', left: 0, top: '10%', width: '2px', height: '80%', background: '#00f5ff', boxShadow: '0 0 6px #00f5ff', borderRadius: '1px', animation: 'cursor-blink 1s ease-in-out infinite' }} />
                                )}
                                <span style={{
                                  color: c.state === 'correct' ? '#39ff14' : c.state === 'incorrect' ? '#ff4444' : isActiveWord && ci >= (('cursorPos' in segment && segment.cursorPos) || 0) ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.4)',
                                  textShadow: c.state === 'correct' ? '0 0 6px rgba(57,255,20,0.5)' : c.state === 'incorrect' ? '0 0 6px rgba(255,68,68,0.5)' : 'none',
                                  marginLeft: isAtCursor ? '2px' : '0',
                                }}>
                                  {c.ch}
                                </span>
                              </span>
                            );
                          })}
                        </span>
                      );
                    }

                    // Pending words
                    return (
                      <span key={`w-${wIdx}`} className="rounded-lg border border-transparent px-1.5 py-0.5" style={{ color: 'rgba(100,116,139,0.4)' }}>
                        {segment.word}
                      </span>
                    );
                  })}
                </p>
              </div>

              {/* Textarea — disabled when paused */}
              <textarea
                ref={textareaRef}
                value={typed}
                onChange={handleInput}
                placeholder={
                  isGeneratingActive ? '⏳ AI is preparing this challenge...'
                  : !unlocked ? '🔒 Complete the previous level to unlock.'
                  : status === 'paused' ? '⏸ Paused — click Resume to continue...'
                  : '▶ Start typing here...'
                }
                disabled={!unlocked || isGeneratingActive || status === 'paused'}
                className="typing-area"
                spellCheck={false}
                autoFocus
              />

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <PrimaryButton onClick={togglePause} disabled={!unlocked} variant="cyan">
                  {status === 'running' ? '⏸ Pause' : status === 'paused' ? '▶ Resume' : '▶ Start'}
                </PrimaryButton>
                <PrimaryButton onClick={resetRun} variant="dark" disabled={!unlocked && status !== 'finished'}>
                  ↺ Reset
                </PrimaryButton>
                <PrimaryButton onClick={() => void handleGoToNext()} variant="purple" disabled={isGeneratingNext || !completedLevels.includes(activeLevel.id)}>
                  {isGeneratingNext ? '⏳ Generating...' : '⚡ Next Level'}
                </PrimaryButton>
                {newPB && (
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)', color: '#ffb703', animation: 'live-pulse 1.5s ease-in-out infinite' }}>
                    🏆 New Personal Best!
                  </span>
                )}
              </div>
            </div>

            {/* Battle pass summary */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(10,14,28,0.7)', border: '1px solid rgba(30,41,59,0.7)' }}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Battle Pass</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Best Stars', value: `★ ${currentResult?.stars ?? 0}`, color: '#ffb703', glow: 'rgba(255,183,3,0.3)', bg: 'rgba(255,183,3,0.06)', border: 'rgba(255,183,3,0.15)' },
                  { label: 'Levels Done', value: completedLevels.length, color: '#00f5ff', glow: 'rgba(0,245,255,0.3)', bg: 'rgba(0,245,255,0.06)', border: 'rgba(0,245,255,0.15)' },
                  { label: 'Best WPM', value: currentResult?.wpm ? `${currentResult.wpm}` : '—', color: '#bf5fff', glow: 'rgba(191,95,255,0.3)', bg: 'rgba(191,95,255,0.06)', border: 'rgba(191,95,255,0.15)' },
                  { label: 'Achievements', value: achievements.length, color: '#ff3cac', glow: 'rgba(255,60,172,0.3)', bg: 'rgba(255,60,172,0.06)', border: 'rgba(255,60,172,0.15)' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                    <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.6)' }}>{item.label}</p>
                    <p className="mt-1 text-xl font-black tabular-nums" style={{ color: item.color, textShadow: `0 0 10px ${item.glow}`, fontFamily: "'JetBrains Mono', monospace" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="flex flex-col gap-4">
            {/* Orbital Stage */}
            <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(191,95,255,0.15)', boxShadow: '0 0 30px rgba(191,95,255,0.08)' }}>
              <OrbitalStage />
            </div>

            {/* M3: XP Bar */}
            <XPBar totalXp={totalXp} justEarned={xpGain?.total ?? 0} leveledUp={leveledUp} />

            {/* M3: Streak + Arena Status side by side */}
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <StreakBadge streak={streak} atRisk={streakAtRisk} compact={false} />
              <div className="rounded-2xl p-4" style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(30,41,59,0.7)' }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Arena Status</p>
                <div className="mb-3 rounded-xl p-3 text-center" style={{ background: tc.bg, border: `1px solid ${tc.border}`, boxShadow: `0 0 20px ${tc.bg}` }}>
                  <div className="mb-1 text-2xl">{tc.icon}</div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Rank</p>
                  <p className="mt-0.5 text-2xl font-black" style={{ color: tc.color, textShadow: `0 0 12px ${tc.color}` }}>{rank}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.1)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Next Unlock</p>
                  <p className="mt-1 text-sm font-semibold text-white">{nextLevelTitle}</p>
                </div>
              </div>
            </div>

            {/* M3: Daily Challenge */}
            <DailyChallenge
              level={dailyLevel}
              isDone={dailyDone}
              onStart={() => { handleSelectLevel(dailyLevelId); }}
            />

            {/* Heat bar */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(10,14,28,0.7)', border: '1px solid rgba(30,41,59,0.7)' }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Heat Level</p>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: progress >= 90 ? 'rgba(255,60,172,0.1)' : progress >= 60 ? 'rgba(255,183,3,0.1)' : 'rgba(30,41,59,0.5)', border: `1px solid ${progress >= 90 ? 'rgba(255,60,172,0.3)' : progress >= 60 ? 'rgba(255,183,3,0.3)' : 'rgba(30,41,59,0.5)'}`, color: progress >= 90 ? '#ff3cac' : progress >= 60 ? '#ffb703' : '#475569' }}>
                  {progress >= 90 ? '🔥 Overdrive' : progress >= 60 ? '⚡ Locked In' : '❄️ Warm-up'}
                </span>
              </div>
              <div className="grid grid-cols-10 gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="h-2 rounded-sm transition-all duration-300"
                    style={{ background: i < Math.round(progress / 10) ? (i >= 8 ? '#ff3cac' : i >= 5 ? '#ffb703' : '#00f5ff') : 'rgba(30,41,59,0.5)', boxShadow: i < Math.round(progress / 10) ? '0 0 4px currentColor' : 'none' }} />
                ))}
              </div>
            </div>

            {/* Achievements panel */}
            {achievements.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(10,14,28,0.7)', border: '1px solid rgba(30,41,59,0.7)' }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Achievements</p>
                <div className="space-y-2">
                  {achievements.map((ach) => (
                    <div key={ach.id} className="flex items-center gap-3 rounded-xl p-2.5"
                      style={{ background: `${achievementStateColor[ach.state]}08`, border: `1px solid ${achievementStateColor[ach.state]}20` }}>
                      <span className="text-lg">{ach.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{ach.title}</p>
                          <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase"
                            style={{ background: `${achievementStateColor[ach.state]}15`, color: achievementStateColor[ach.state] }}>
                            {ach.state}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 truncate">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* M3: XP Toast */}
    <XPToast
      gain={xpGain}
      leveledUp={leveledUp}
      onDone={() => { setXpGain(null); setLeveledUp(null); }}
    />

    {/* M3: Welcome-back modal */}
    {showWelcomeBack && welcomeBackType && (
      <WelcomeBackModal
        type={welcomeBackType}
        streak={streak}
        totalXp={totalXp}
        onDismiss={() => setShowWelcomeBack(false)}
      />
    )}
  </>
  );
}

export default DashboardPage;






