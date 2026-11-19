import type { ReactNode } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
}

/**
 * Pure-CSS tooltip (group-hover). Keep labels short — one line of
 * explanation, never a paragraph.
 */
export default function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
