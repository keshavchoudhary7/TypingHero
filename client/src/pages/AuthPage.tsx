import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';

const AVAILABLE_AVATARS = [
  { id: 'knight', emoji: '🛡️', name: 'Knight', desc: 'The Valiant Defender' },
  { id: 'wizard', emoji: '🔮', name: 'Wizard', desc: 'The Arcane Master' },
  { id: 'rogue', emoji: '🗡️', name: 'Rogue', desc: 'The Shadow Blade' },
  { id: 'ranger', emoji: '🏹', name: 'Ranger', desc: 'The Swift Tracker' },
  { id: 'cleric', emoji: '❇️', name: 'Cleric', desc: 'The Divine Healer' },
];

export default function AuthPage() {
  const { login, register, loginWithOAuth, registerWithOAuth, error, clearError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('knight');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google') => {
    setFormError(null);
    clearError();
    try {
      if (isRegistering) {
        await registerWithOAuth(provider, selectedAvatar);
      } else {
        await loginWithOAuth(provider);
      }
    } catch (err: any) {
      setFormError(err.message || 'OAuth authentication failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (username.trim().length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (isRegistering) {
      await register(username, password, selectedAvatar);
    } else {
      await login(username, password);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070f] p-4 text-white">
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[30%] h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[30%] h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0e1c]/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Game Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent uppercase drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            🛡️ TypingHero
          </h1>
          <p className="mt-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            {isRegistering ? 'Choose your path & begin' : 'Return to the Arena'}
          </p>
        </div>

        {/* Errors */}
        {(error || formError) && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-center text-xs font-semibold text-red-400">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Hero Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Secret Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Avatar Selection (Registration only) */}
          {isRegistering && (
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Choose Hero Class Avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    title={`${av.name}: ${av.desc}`}
                    className={`flex flex-col items-center justify-center rounded-xl p-2 border transition-all cursor-pointer ${
                      selectedAvatar === av.id
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="mt-1 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                      {av.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {isRegistering ? 'Begin Adventure' : 'Enter Arena'}
          </button>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative bg-[#0a0e1c] px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Or Choose Social Path
            </span>
          </div>

          {/* Social OAuth Buttons */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/50 py-3 text-sm font-semibold text-slate-300 hover:border-red-500/50 hover:bg-red-500/5 transition-all cursor-pointer"
            >
              <span className="text-red-500">🔴</span> Sign in with Google
            </button>
          </div>
        </form>

        {/* Toggle Switch */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormError(null);
              clearError();
            }}
            className="cursor-pointer text-xs font-semibold text-cyan-400 hover:underline"
          >
            {isRegistering
              ? 'Already have a Hero account? Login'
              : "New to TypingHero? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
