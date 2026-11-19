import { chainInfo, holdingValue } from '../../data';
import { formatPct, formatUsd } from '../../lib/format';
import type { TokenHolding } from '../../types';
import Badge from '../../components/ui/Badge';

interface PortfolioTableProps {
  holdings: readonly TokenHolding[];
  /** Topbar search query — filters by symbol or name. */
  query: string;
  /** Live USD prices by symbol (CoinGecko); falls back to seed prices. */
  livePrices?: Record<string, number> | null;
  /** Live 24h changes in percent by symbol. */
  liveChanges?: Record<string, number> | null;
  live?: boolean;
}

export default function PortfolioTable({
  holdings,
  query,
  livePrices = null,
  liveChanges = null,
  live = false,
}: PortfolioTableProps) {
  const q = query.trim().toLowerCase();
  const priced = holdings.map((h) => ({
    ...h,
    priceUsd: livePrices?.[h.symbol] ?? h.priceUsd,
    change24h: liveChanges?.[h.symbol] ?? h.change24h,
  }));
  const rows = priced.filter(
    (h) =>
      q === '' ||
      h.symbol.toLowerCase().includes(q) ||
      h.name.toLowerCase().includes(q),
  );
  const total = priced.reduce((sum, h) => sum + holdingValue(h), 0);

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-white">
            Portofolio
            {live ? (
              <Badge variant="green">LIVE · CoinGecko</Badge>
            ) : (
              <Badge variant="blue">Snapshot 19 Nov 2026</Badge>
            )}
          </h2>
          <p className="text-sm text-muted">
            {holdings.length} aset · {rows.length} ditampilkan
          </p>
        </div>
        <p className="text-right">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Total Nilai
          </span>
          <span className="font-mono text-xl font-bold text-white">
            {formatUsd(total)}
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2.5 pr-2 font-semibold">Aset</th>
              <th className="pb-2.5 pr-2 font-semibold">Chain</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Saldo</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Harga</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">24j</th>
              <th className="pb-2.5 text-right font-semibold">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => {
              const value = holdingValue(h);
              const share = total > 0 ? (value / total) * 100 : 0;
              const chain = chainInfo(h.chain);
              return (
                <tr
                  key={h.id}
                  className="border-b border-line/70 last:border-0 hover:bg-surface-2/60"
                >
                  <td className="py-3 pr-2">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: h.logoColor }}
                      >
                        {h.symbol.slice(0, 2)}
                      </span>
                      <span>
                        <span className="block font-semibold text-white">
                          {h.symbol}
                        </span>
                        <span className="block text-xs text-muted">
                          {h.name}
                        </span>
                      </span>
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
                  <td className="py-3 pr-2 text-right font-mono tabular-nums">
                    {h.balance.toLocaleString('en-US')}
                  </td>
                  <td className="py-3 pr-2 text-right font-mono tabular-nums">
                    {formatUsd(h.priceUsd)}
                  </td>
                  <td
                    className={`py-3 pr-2 text-right font-mono tabular-nums ${
                      h.change24h >= 0 ? 'text-profit' : 'text-loss'
                    }`}
                  >
                    {formatPct(h.change24h)}
                  </td>
                  <td className="py-3 text-right">
                    <span className="block font-mono font-semibold tabular-nums text-white">
                      {formatUsd(value)}
                    </span>
                    <span className="mt-1 block h-1 w-20 overflow-hidden rounded-full bg-surface-2 ml-auto">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                        style={{ width: `${Math.max(share, 2)}%` }}
                      />
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  Tidak ada aset yang cocok dengan “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
