import { useRef, useState, type ReactNode } from 'react';

interface TooltipProps {
  /** Plain-language explanation, 1–2 short sentences — never a paragraph. */
  text: string;
  children: ReactNode;
}

/**
 * Small "?" tooltip — opens on hover (desktop) or click/tap (touch).
 * The popover wraps to a readable width and flips its horizontal
 * alignment to the trigger's side of the screen, so it never spills
 * past the viewport edge on mobile.
 */
export default function Tooltip({ text, children }: TooltipProps) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const visible = hover || open;

  function measure(): void {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setAlignRight(rect.left + rect.width / 2 > window.innerWidth / 2);
  }

  return (
    <span
      className="group relative inline-flex"
      onMouseEnter={() => {
        measure();
        setHover(true);
      }}
      onMouseLeave={() => setHover(false)}
    >
      <span
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          measure();
          setOpen((o) => !o);
        }}
        className="inline-flex cursor-help"
        role="button"
        tabIndex={0}
        aria-label="Penjelasan"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            measure();
            setOpen((o) => !o);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        {children}
      </span>
      {visible && (
        <span
          className={`pointer-events-none absolute bottom-full z-50 mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface-2 px-3 py-2 text-left text-xs font-normal leading-relaxed text-slate-200 shadow-xl ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
