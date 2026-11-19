import { useState } from 'react';
import { DEMO_ACTIVITY, type ActivityKind } from '../../data/activity';
import Badge from '../../components/ui/Badge';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'swap', label: 'Swap' },
  { id: 'mint', label: 'Mint' },
  { id: 'stake', label: 'Stake' },
  { id: 'revoke', label: 'Revoke' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const KIND_BADGE = {
  swap: 'blue',
  mint: 'green',
  stake: 'amber',
  revoke: 'red',
} as const;

const STATUS_BADGE = {
  success: 'green',
  pending: 'amber',
  failed: 'red',
} as const;

const STATUS_LABEL = {
  success: 'Berhasil',
  pending: 'Tertunda',
  failed: 'Gagal',
} as const;

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

/** Filterable transaction history (demo rows, clearly labelled). */
export default function ActivityLog() {
  const [filter, setFilter] = useState<FilterId>('all');
  const shown =
    filter === 'all'
      ? DEMO_ACTIVITY
      : DEMO_ACTIVITY.filter(
          (a) => a.kind === (filter as ActivityKind),
        );

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Activity Log</h2>
        <Badge variant="blue">Data contoh (demo)</Badge>
      </div>
      <p className="mb-4 text-sm text-muted">
        Riwayat contoh untuk menguji filter — bukan transaksi nyata siapa
        pun. Riwayat asli ada di tautan explorer di bawah.
      </p>

      <div
        className="mb-4 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter aktivitas"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.id
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'border border-line bg-bg text-slate-300 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2.5 pr-2 font-semibold">Hash</th>
              <th className="pb-2.5 pr-2 font-semibold">Aktivitas</th>
              <th className="pb-2.5 pr-2 font-semibold">Jenis</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Nilai</th>
              <th className="pb-2.5 pl-3 pr-2 font-semibold">Waktu</th>
              <th className="pb-2.5 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr
                key={a.hash}
                className="border-b border-line/70 last:border-0 hover:bg-surface-2/60"
              >
                <td className="py-3 pr-2 font-mono text-xs text-accent">
                  {truncateHash(a.hash)}
                </td>
                <td className="py-3 pr-2 font-medium text-white">
                  {a.summary}
                </td>
                <td className="py-3 pr-2">
                  <Badge variant={KIND_BADGE[a.kind]}>
                    {a.kind.charAt(0).toUpperCase() + a.kind.slice(1)}
                  </Badge>
                </td>
                <td className="py-3 pr-2 text-right font-mono tabular-nums text-white">
                  {a.value}
                </td>
                <td className="py-3 pl-3 pr-2 whitespace-nowrap text-slate-300">
                  {a.time}
                </td>
                <td className="py-3 text-right">
                  <Badge variant={STATUS_BADGE[a.status]}>
                    {STATUS_LABEL[a.status]}
                  </Badge>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  Tidak ada aktivitas untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
