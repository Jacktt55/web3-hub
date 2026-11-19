import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { chainInfo } from '../../data';
import { formatPct, formatUsd } from '../../lib/format';
import type { Address, ChainId } from '../../types';
import Badge from '../../components/ui/Badge';
import SkeletonRow from '../../components/ui/SkeletonRow';

export interface PortfolioRow {
  id: string;
  symbol: string;
  name: string;
  chain: ChainId;
  /** Amount held, in token units. */
  balance: number;
  /** Price per token in USD (undefined while prices load). */
  priceUsd?: number;
  /** 24h price change in percent. */
  change24h?: number;
  /** ERC-20 contract address; undefined for native assets. */
  contract?: Address;
}

interface PortfolioTableProps {
  /** Active wallet, null when none is entered yet. */
  wallet: Address | null;
  /** Merged native + token rows; null while the first read is pending. */
  rows: readonly PortfolioRow[] | null;
  /** Topbar search query — filters by symbol or name. */
  query: string;
  live?: boolean;
  /** Opens the token detail drawer. */
  onSelect: (row: PortfolioRow) => void;
  onConnect: () => void;
}

/**
 * Multi-chain token portfolio for the visitor's own wallet:
 * native balances + ERC-20 watchlist balances, read live on-chain.
 * No seeded holdings — without a wallet the table shows an empty state.
 */
export default function PortfolioTable({
  wallet,
  rows,
  query,
  live = false,
  onSelect,
  onConnect,
}: PortfolioTableProps) {
  const [hideSmall, setHideSmall] = useState(false);

  if (!wallet) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-6 text-center">
        <h2 className="text-lg font-bold text-white">Token Portfolio</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Masukkan alamat wallet kamu untuk melihat saldo token per chain,
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

  if (rows === null) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Token Portfolio</h2>
        <div className="space-y-2.5">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <p className="pt-1 text-center text-xs text-muted">
            Membaca saldo on-chain…
          </p>
        </div>
      </section>
    );
  }

  const q = query.trim().toLowerCase();
  const valued = rows.map((r) => ({
    ...r,
    value: r.priceUsd !== undefined ? r.balance * r.priceUsd : undefined,
  }));
  const shown = valued.filter((r) => {
    if (
      q !== '' &&
      !r.symbol.toLowerCase().includes(q) &&
      !r.name.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (hideSmall && (r.value ?? 0) < 10) return false;
    return true;
  });
  const total = valued.reduce((sum, r) => sum + (r.value ?? 0), 0);
  const hasPrice = valued.some((r) => r.priceUsd !== undefined);

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-white">
            Token Portfolio
            {live ? (
              <Badge variant="green">LIVE · DefiLlama</Badge>
            ) : (
              <Badge variant="blue">Menunggu harga live</Badge>
            )}
          </h2>
          <p className="text-sm text-muted">
            {rows.length} aset · {shown.length} ditampilkan · klik baris
            untuk detail
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-right">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Total Nilai
            </span>
            <span className="font-mono text-xl font-bold tabular-nums text-white">
              {hasPrice ? formatUsd(total) : '—'}
            </span>
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-300">
            <input
              type="checkbox"
              checked={hideSmall}
              onChange={(e) => setHideSmall(e.target.checked)}
              className="h-4 w-4 accent-[#3B82F6]"
            />
            Hide small balances (&lt;$10)
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2.5 pr-2 font-semibold">Asset</th>
              <th className="pb-2.5 pr-2 font-semibold">Chain</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Price</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Balance</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Value</th>
              <th className="pb-2.5 text-right font-semibold">24h %</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const chain = chainInfo(r.chain);
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-surface-2/60"
                >
                  <td className="py-3 pr-2">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: chain.color }}
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-2.5 py-1 text-[11px] font-medium text-slate-300">
                      <i
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chain.color }}
                      />
                      {chain.name}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right font-mono tabular-nums">
                    {r.priceUsd !== undefined ? formatUsd(r.priceUsd) : '—'}
                  </td>
                  <td className="py-3 pr-2 text-right font-mono tabular-nums">
                    {r.balance.toLocaleString('en-US', {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="py-3 pr-2 text-right">
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
                  <td
                    className={`py-3 text-right font-mono tabular-nums ${
                      r.change24h === undefined
                        ? 'text-muted'
                        : r.change24h >= 0
                          ? 'text-profit'
                          : 'text-loss'
                    }`}
                  >
                    {r.change24h !== undefined
                      ? formatPct(r.change24h)
                      : '—'}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  {q !== ''
                    ? `Tidak ada aset yang cocok dengan “${query}”.`
                    : 'Tidak ada aset yang ditampilkan — coba matikan filter saldo kecil.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
