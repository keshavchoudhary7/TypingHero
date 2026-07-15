import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'cyan' | 'purple' | 'green' | 'dark';
};

const variantClass: Record<NonNullable<PrimaryButtonProps['variant']>, string> = {
  cyan: 'btn-neon',
  purple: 'btn-neon btn-neon-purple',
  green: 'btn-neon btn-neon-green',
  dark: 'btn-neon btn-neon-dark',
};

export default function PrimaryButton({ children, className = '', variant = 'cyan', ...props }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 ${variantClass[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
