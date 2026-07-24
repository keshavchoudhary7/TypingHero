type TypingPromptProps = {
  passage: string;
  typed: string;
  onFocusRequest: () => void;
};

export default function TypingPrompt({ passage, typed, onFocusRequest }: TypingPromptProps) {
  const safePassage = passage || 'Deep in the Whispering Woods, a rogue shadows the sleeping dragon, waiting for the crystal to glow.';

  return (
    <div
      onClick={onFocusRequest}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className="relative rounded-2xl bg-[#060a17]/95 border border-slate-800/90 p-7 font-mono text-xl md:text-2xl leading-relaxed tracking-wide select-none shadow-[0_0_35px_rgba(0,0,0,0.6)] backdrop-blur-xl cursor-text transition-all hover:border-slate-700 font-medium"
    >
      <div className="absolute top-2.5 right-4 text-[9px] font-bold font-mono text-slate-600 uppercase tracking-widest pointer-events-none">
        CLICKS ARENA TO FOCUS
      </div>

      <div className="flex flex-wrap items-baseline gap-y-2">
        {safePassage.split('').map((char, index) => {
          let charState: 'untyped' | 'correct' | 'incorrect' = 'untyped';
          const isTyped = index < typed.length;

          if (isTyped) {
            charState = typed[index] === char ? 'correct' : 'incorrect';
          }

          const isCaret = index === typed.length;

          return (
            <span key={index} className="relative inline-block">
              {/* Animated Caret Indicator */}
              {isCaret && (
                <span className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.9)] animate-pulse z-10" />
              )}

              {/* Character Render */}
              <span
                className={`transition-colors duration-100 ${
                  charState === 'correct'
                    ? 'text-emerald-400 font-bold bg-emerald-500/10 rounded-sm shadow-[0_0_8px_rgba(52,211,153,0.25)]'
                    : charState === 'incorrect'
                    ? 'text-rose-400 bg-rose-500/25 font-bold rounded-sm underline decoration-rose-500/80 animate-pulse'
                    : 'text-slate-400/75'
                }`}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
