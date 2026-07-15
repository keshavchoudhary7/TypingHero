import { type ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
  accentColor?: string;
};

export default function SectionCard({ title, subtitle, className = '', children, accentColor }: SectionCardProps) {
  return (
    <section
      className={`hero-card relative overflow-hidden p-5 ${className}`}
    >
      {/* Top accent line */}
      {accentColor && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: accentColor }}
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: 'rgba(148,163,184,0.6)' }}
        >
          {title}
        </h3>
        {subtitle ? (
          <span
            className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(0,245,255,0.08)',
              border: '1px solid rgba(0,245,255,0.15)',
              color: '#00f5ff',
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
