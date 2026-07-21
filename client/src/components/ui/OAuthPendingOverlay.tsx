/**
 * OAuthPendingOverlay
 *
 * Full-screen loading overlay shown after the OAuth popup closes while
 * the server API call is still in-flight. Keeps users informed so they
 * don't think authentication failed during the pending request.
 *
 * Usage:
 *   {oauthPending && <OAuthPendingOverlay provider="Google" />}
 */

type OAuthPendingOverlayProps = {
  /** Display name of the OAuth provider (e.g. "Google") */
  provider?: string;
};

export default function OAuthPendingOverlay({ provider = 'Google' }: OAuthPendingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070f]/85 backdrop-blur-md">
      {/* Ambient glow orbs */}
      <div className="absolute top-[30%] left-[35%] h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px] animate-pulse" />
      <div className="absolute bottom-[30%] right-[35%] h-72 w-72 rounded-full bg-indigo-500/15 blur-[100px] animate-pulse [animation-delay:0.5s]" />

      <div className="relative flex flex-col items-center gap-7">
        {/* Triple-ring spinner */}
        <div className="relative h-24 w-24">
          {/* Outer static track */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
          {/* Primary forward-spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-indigo-400 animate-spin" />
          {/* Secondary counter-spinning inner ring */}
          <div className="absolute inset-[8px] rounded-full border-[3px] border-transparent border-b-purple-400 border-l-cyan-500/50 animate-spin [animation-direction:reverse] [animation-duration:1.4s]" />
          {/* Shield icon center */}
          <div className="absolute inset-0 flex items-center justify-center text-3xl select-none">
            🛡️
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-1.5">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400 animate-pulse">
            Authenticating…
          </p>
          <p className="text-xs text-slate-500 tracking-wider">
            Verifying your {provider} identity
          </p>
        </div>

        {/* Staggered bouncing dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
