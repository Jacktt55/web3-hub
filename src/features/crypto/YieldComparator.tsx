import { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { chainInfo } from '../../data';
import { formatCompact } from '../../lib/format';
import type { YieldPool } from '../../types';
import Badge from '../../components/ui/Badge';

type SortKey = 'apy' | 'tvl';
type SortDir = 'desc' | 'asc';

const RISK_BADGE = {
  low: 'green',
  medium: 'amber',
  high: 'red',
} as const;

interface YieldComparatorProps {
  pools: readonly YieldPool[];
  live?: boolean;
  /** Topbar search query — filters by protocol or pair. */
  query?: string;
}

/** DeFi yield comparison table, sortable by APY or TVL. */
export default function YieldComparator({
  pools,
  live = false,
  query = '',
}: YieldComparatorProps) {
  const [sortKey, setSortKey] = useState<SortKey>('apy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const q = query.trim().toLowerCase();
  const filtered = pools.filter(
    (p) =>
      q === '' ||
      p.protocol.toLowerCase().includes(q) ||
      p.pair.toLowerCase().includes(q),
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const diff = sortKey === 'apy' ? a.apy - b.apy : a.tvlUsd - b.tvlUsd;
      return sortDir === 'desc' ? -diff : diff;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function sortIcon(key: SortKey) {
    if (key !== sortKey) return null;
    return sortDir === 'desc' ? (
      <ArrowDownWideNarrow className="inline h-3.5 w-3.5" />
    ) : (
      <ArrowUpNarrowWide className="inline h-3.5 w-3.5" />
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">DeFi Yield Comparator</h2>
        {live ? (
          <Badge variant="green">Live · DefiLlama</Badge>
        ) : (
          <Badge variant="blue">Seed Nov 2026</Badge>
        )}
      </div>
      <p className="mb-4 text-sm text-muted">
        Bandingkan APY antar protokol — klik header untuk mengurutkan.
        {live &&
          ' Risiko & kategori diturunkan dari APY (DefiLlama tidak memberi skor risiko).'}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2.5 pr-2 font-semibold">Protokol / Pair</th>
              <th className="pb-2.5 pr-2 font-semibold">Chain</th>
              <th className="pb-2.5 pr-2 font-semibold">Kategori</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">
                <button
                  onClick={() => toggleSort('apy')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  APY {sortIcon('apy')}
                </button>
              </th>
              <th className="pb-2.5 pr-2 text-right font-semibold">
                <button
                  onClick={() => toggleSort('tvl')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  TVL {sortIcon('tvl')}
                </button>
              </th>
              <th className="pb-2.5 text-right font-semibold">Risiko</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const chain = chainInfo(p.chain);
              return (
                <tr
                  key={p.id}
                  className="border-b border-line/70 last:border-0 hover:bg-surface-2/60"
                >
                  <td className="py-3 pr-2">
                    <span className="block font-semibold text-white">
                      {p.protocol}
                    </span>
                    <span className="block font-mono text-xs text-muted">
                      {p.pair}
                    </span>
                  </td>
                  <td className="py-3 pr-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <i
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chain.color }}
                      />
                      {chain.name}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-xs capitalize text-muted">
                    {p.category}
                  </td>
                  <td className="py-3 pr-2 text-right font-mono font-bold tabular-nums text-profit">
                    {p.apy.toFixed(1)}%
                  </td>
                  <td className="py-3 pr-2 text-right font-mono tabular-nums">
                    ${formatCompact(p.tvlUsd)}
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant={RISK_BADGE[p.risk]}>{p.risk}</Badge>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  Tidak ada pool yang cocok dengan “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
