import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { loadProgress } from './lib/progressApi';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import MultiplayerPage from './pages/MultiplayerPage';
import { useEffect } from 'react';



function ProfileWrapper() {
  const { user, token } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await loadProgress(user?.id || 'hero-user', token);
        setProgress(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <span className="animate-pulse text-xs font-bold tracking-widest uppercase">Loading Profile...</span>
        </div>
      </div>
    );
  }

  const payload = progress || { completedLevels: [], levelResults: {}, streak: 0, xp: 0 };
  return (
    <ProfilePage
      completedLevels={payload.completedLevels}
      levelResults={payload.levelResults}
      streak={payload.streak}
      totalXp={payload.xp}
    />
  );
}

const AVATAR_EMOJIS: Record<string, string> = {
  knight: '🛡️',
  wizard: '🔮',
  rogue: '🗡️',
  ranger: '🏹',
  cleric: '❇️',
};

function NavigationLayout() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'arena' | 'leaderboards' | 'multiplayer' | 'profile'>('arena');

  const handleTabClick = (tab: 'arena' | 'leaderboards' | 'multiplayer' | 'profile') => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center text-cyan-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <span className="animate-pulse text-xs font-bold tracking-widest uppercase">Initializing Hero Session...</span>
          </div>
        </div>
      );
    }

    if (!user && (activeTab === 'arena' || activeTab === 'multiplayer' || activeTab === 'profile')) {
      return <AuthPage />;
    }

    switch (activeTab) {
      case 'arena':
        return <DashboardPage />;
      case 'leaderboards':
        return <LeaderboardPage />;
      case 'multiplayer':
        return <MultiplayerPage />;
      case 'profile':
        return <ProfileWrapper />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-[15%] h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[80px]" />
        <div className="absolute top-0 left-[15%] h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-900 bg-[#0a0e1c]/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('arena')}>
            <span className="text-xl">🛡️</span>
            <span className="font-black uppercase tracking-wider text-white text-sm bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              TypingHero
            </span>
          </div>

          {/* Navigation Links */}
          {(user || loading) && (
            <nav className="flex items-center gap-1.5 md:gap-4">
              {[
                { id: 'arena', label: 'Arena', icon: '🎮' },
                { id: 'leaderboards', label: 'Leaderboards', icon: '🏆' },
                { id: 'multiplayer', label: 'Multiplayer', icon: '⚔️' },
                { id: 'profile', label: 'Profile', icon: '👤' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as any)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 border border-slate-800 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          )}

          {/* Auth Button */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-7 w-24 animate-pulse rounded-xl bg-slate-900/80 border border-slate-800" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
                  <span className="text-sm">{AVATAR_EMOJIS[user.avatarId] || '🛡️'}</span>
                  <span className="text-xs font-bold text-slate-300 font-mono hidden md:inline">{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="cursor-pointer rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleTabClick('profile')}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.98]"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow py-6">
        <div className="mx-auto max-w-7xl px-4">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NavigationLayout />
    </AuthProvider>
  );
}

export default App;
