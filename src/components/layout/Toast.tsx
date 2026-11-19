import { CheckCircle2, Info } from 'lucide-react';

export interface ToastData {
  id: number;
  message: string;
  kind: 'success' | 'info';
}

interface ToastProps {
  toast: ToastData | null;
}

/** Bottom-right toast — rendered by App, auto-dismissed by the caller. */
export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[calc(100%-40px)] max-w-sm flex-col gap-2.5">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-2xl shadow-black/50">
        {toast.kind === 'success' ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-profit" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
        )}
        <span className="leading-snug">{toast.message}</span>
      </div>
    </div>
  );
}
