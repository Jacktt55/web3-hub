import { useState, type ReactNode } from 'react';

interface TooltipProps {
  /** Plain-language explanation, 1–2 short sentences — never a paragraph. */
  text: string;
  children: ReactNode;
}

/**
 * Small "?" tooltip — opens on hover (desktop) or click/tap (touch).
 * The popover wraps to a readable width; click toggles it so mobile
 * users can read it without hovering.
 */
export default function Tooltip({ text, children }: TooltipProps) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const visible = hover || open;

  return (
    <span
      className="group relative inline-flex"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex cursor-help"
        role="button"
        tabIndex={0}
        aria-label="Penjelasan"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        {children}
      </span>
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-left text-xs font-normal leading-relaxed text-slate-200 shadow-xl transition-opacity duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {text}
      </span>
    </span>
  );
}
