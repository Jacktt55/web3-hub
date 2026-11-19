import { useState } from 'react';
import { AlertTriangle, Check, Copy, Info, X } from 'lucide-react';
import { chainInfo } from '../../data';
import type { PreparedTx } from '../../types';
import CopyAddressButton from '../ui/CopyAddressButton';

interface TxPreviewModalProps {
  tx: PreparedTx | null;
  onClose: () => void;
  onCopied: () => void;
}

/**
 * Transaction preview modal — PREVIEW ONLY.
 * The app never signs or broadcasts. To execute, the user copies the
 * one-line summary into the chat and confirms; Guts executes it there.
 */
export default function TxPreviewModal({
  tx,
  onClose,
  onCopied,
}: TxPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  if (!tx) return null;
  const chain = chainInfo(tx.chain);

  async function copySummary(): Promise<void> {
    if (!tx) return;
    try {
      await navigator.clipboard.writeText(tx.summary);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tx.summary;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    onCopied();
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${tx.title}`}
    >
      <button
        aria-label="Tutup preview"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-white">{tx.title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3.5 text-sm text-slate-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
            <p>
              Ini <b className="text-white">preview saja</b> — tidak ada
              transaksi yang dikirim dari aplikasi ini. Eksekusi dilakukan
              Guts setelah kamu konfirmasi di chat.
            </p>
          </div>

          {tx.note && (
            <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/10 p-3.5 text-sm text-amber">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{tx.note}</p>
            </div>
          )}

          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Chain</dt>
              <dd className="flex items-center gap-1.5 font-medium text-white">
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: chain.color }}
                />
                {chain.name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">From</dt>
              <dd>
                <CopyAddressButton address={tx.from} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">To (kontrak)</dt>
              <dd>
                <CopyAddressButton address={tx.to} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Fungsi</dt>
              <dd className="font-mono text-white">{tx.functionName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Value</dt>
              <dd className="font-mono font-semibold text-white">
                {tx.value}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Estimasi gas</dt>
              <dd className="font-mono text-white">
                {tx.gasEstimate !== null
                  ? tx.gasEstimate.toString()
                  : '— (belum diestimasi)'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Fee</dt>
              <dd className="font-mono text-white">
                {tx.feeNative} {tx.feeUsd !== '—' && `(${tx.feeUsd})`}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Calldata</dt>
              <dd className="max-w-[260px] truncate">
                <CopyAddressButton address={tx.calldata} />
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={() => void copySummary()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600"
            >
              {copied ? (
                <Check className="h-4 w-4 text-profit" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Disalin!' : 'Salin ringkasan'}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            >
              Tutup
            </button>
          </div>
          <p className="text-center text-xs text-muted">
            Tempel ringkasan di chat dan tulis “ya, eksekusi” — Guts yang
            mengeksekusi setelah konfirmasi kamu.
          </p>
        </div>
      </div>
    </div>
  );
}
