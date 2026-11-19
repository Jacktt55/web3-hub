import type { ReactNode } from 'react';

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'muted';

const STYLES: Record<BadgeVariant, string> = {
  green: 'bg-profit/15 text-profit',
  amber: 'bg-amber/15 text-amber',
  red: 'bg-loss/15 text-loss',
  blue: 'bg-accent/15 text-accent',
  muted: 'bg-surface-2 text-muted',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'muted',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
