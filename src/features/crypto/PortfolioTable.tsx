import { Wallet } from 'lucide-react';
import { chainInfo } from '../../data';
import { formatPct, formatUnits, formatUsd } from '../../lib/format';
import type { Address, ChainId } from '../../types';
import Badge from '../../components/ui/Badge';
import SkeletonRow from '../../components/ui/SkeletonRow';

export interface NativeBalanceRow {
  chain: ChainId;
  balance: bigint;
}

interface PortfolioTableProps {
  /** Active wallet, null when none is entered yet. */
  wallet: Address | null;
  /** Live native balances, null while the first read is pending. */
  balances: readonly NativeBalanceRow[] | null;
  /** Live USD prices by native symbol (CoinGecko). */
  livePrices?: Record<string, number> | null;
  /** Live 24h changes in percent by native symbol. */
  liveChanges?: Record<string, number> | null;
  onConnect: () => void;
}

/**
 * Native balances of the visitor's own wallet, read live on-chain.
 * No seeded holdings — without a wallet the table shows an empty state.
 */
export default function PortfolioTable({
  wallet,
  balances,
  livePrices = null,
  liveChanges = null,
  onConnect,
}: PortfolioTableProps) {
  if (!wallet) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-6 text-center">
        <h2 className="text-lg font-bold text-white">Saldo Wallet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Masukkan alamat wallet kamu untuk melihat saldo native per chain,
          dibaca langsung dari RPC publik. Tidak ada koneksi wallet dan tidak
          ada data yang disimpan di server.
        </p>
        <button
          onClick={onConnect}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600"
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </button>
      </section>
    );
  }

  if (balances === null) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Saldo Wallet</h2>
        <div className="space-y-2.5">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <p className="pt-1 text-center text-xs text-muted">
            Membaca saldo native on-chain…
          </p>
        </div>
      </section>
    );
  }

  const rows = balances.map((b) => {
    const chain = chainInfo(b.chain);
    const symbol = chain.nativeSymbol;
    const amount = Number(formatUnits(b.balance, 18));
    const price = livePrices?.[symbol];
    const change = liveChanges?.[symbol];
    return {
      chain: b.chain,
      symbol,
      name: chain.name,
      color: chain.color,
      amount,
      price,
      change,
      value: price !== undefined ? amount * price : undefined,
    };
  });
  const total = rows.reduce((sum, r) => sum + (r.value ?? 0), 0);
  const hasPrice = rows.some((r) => r.price !== undefined);

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-white">
            Saldo Wallet
            {hasPrice ? (
              <Badge variant="green">LIVE · CoinGecko</Badge>
            ) : (
              <Badge variant="blue">Menunggu harga live</Badge>
            )}
          </h2>
          <p className="font-mono text-xs text-muted">
            {wallet.slice(0, 6)}…{wallet.slice(-4)} · {rows.length} chain
          </p>
        </div>
        <p className="text-right">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Total Nilai
          </span>
          <span className="font-mono text-xl font-bold text-white">
            {hasPrice ? formatUsd(total) : '—'}
          </span>
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Saldo tidak terbaca — RPC tidak menjawab. Coba segarkan halaman.
        </p>
      ) : (
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
              {rows.map((r) => (
                <tr
                  key={r.chain}
                  className="border-b border-line/70 last:border-0 hover:bg-surface-2/60"
                >
                  <td className="py-3 pr-2">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: r.color }}
                      >
                        {r.symbol.slice(0, 2)}
                      </span>
                      <span>
                        <span className="block font-semibold text-white">
                          {r.symbol}
                        </span>
                        <span className="block text-xs text-muted">
                          {r.name}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <i
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      {r.name}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right font-mono tabular-nums">
                    {r.amount.toLocaleString('en-US', {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="py-3 pr-2 text-right font-mono tabular-nums">
                    {r.price !== undefined ? formatUsd(r.price) : '—'}
                  </td>
                  <td
                    className={`py-3 pr-2 text-right font-mono tabular-nums ${
                      r.change === undefined
                        ? 'text-muted'
                        : r.change >= 0
                          ? 'text-profit'
                          : 'text-loss'
                    }`}
                  >
                    {r.change !== undefined ? formatPct(r.change) : '—'}
                  </td>
                  <td className="py-3 text-right">
                    <span className="block font-mono font-semibold tabular-nums text-white">
                      {r.value !== undefined ? formatUsd(r.value) : '—'}
                    </span>
                    {r.value !== undefined && total > 0 && (
                      <span className="mt-1 ml-auto block h-1 w-20 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                          style={{
                            width: `${Math.max((r.value / total) * 100, 2)}%`,
                          }}
                        />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
