import { useState } from 'react';
import type { MintPass } from '../../types';
import Badge from '../../components/ui/Badge';

const STATUS_BADGE = {
  live: 'green',
  upcoming: 'blue',
  soldout: 'red',
} as const;

const STATUS_LABEL = {
  live: 'Live',
  upcoming: 'Segera',
  soldout: 'Habis',
} as const;

interface MintPassCardProps {
  pass: MintPass;
  onPreview?: (pass: MintPass) => void;
  /** Fired after a simulated mint (local counter only). */
  onMinted?: (pass: MintPass) => void;
}

/**
 * No-code mint / event pass preview card.
 * "Mint (Simulasi)" increments a LOCAL counter and progress bar only —
 * no contract, no transaction. The parent shows a toast confirming
 * the simulation.
 */
export default function MintPassCard({
  pass,
  onPreview,
  onMinted,
}: MintPassCardProps) {
  const [minted, setMinted] = useState(pass.minted);
  const [myMints, setMyMints] = useState(0);
  const pct =
    pass.supply > 0 ? Math.min((minted / pass.supply) * 100, 100) : 0;
  const soldOut = minted >= pass.supply;

  function handleMint(): void {
    if (pass.status !== 'live' || soldOut) return;
    setMinted((m) => m + 1);
    setMyMints((n) => n + 1);
    onMinted?.(pass);
  }

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">{pass.title}</h3>
          <p className="mt-0.5 text-sm text-muted">{pass.event}</p>
        </div>
        <Badge variant={STATUS_BADGE[pass.status]}>
          {STATUS_LABEL[pass.status]}
        </Badge>
      </div>

      <dl className="mb-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Jadwal</dt>
          <dd className="font-medium text-slate-300">{pass.date}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Harga</dt>
          <dd className="font-mono font-semibold text-white">{pass.price}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Terbit</dt>
          <dd className="font-mono text-slate-300">
            {minted.toLocaleString('en-US')} /{' '}
            {pass.supply.toLocaleString('en-US')}
          </dd>
        </div>
      </dl>

      <div className="mb-1.5 flex justify-between text-xs text-muted">
        <span>Progress suplai</span>
        <span className="font-mono tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      {myMints > 0 && (
        <p className="mb-3 text-xs font-medium text-profit">
          ✓ Kamu mencetak {myMints} (simulasi — bukan NFT asli)
        </p>
      )}

      <button
        onClick={() => {
          if (pass.status === 'live') handleMint();
          else onPreview?.(pass);
        }}
        disabled={pass.status === 'soldout' || soldOut}
        className="mt-auto rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pass.status === 'soldout' || soldOut
          ? 'Sudah Habis'
          : pass.status === 'live'
            ? 'Mint (Simulasi)'
            : 'Ingatkan Saya'}
      </button>
    </article>
  );
}
