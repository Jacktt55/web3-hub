import { chainInfo, cheapestGas } from '../../data';
import { formatUsd } from '../../lib/format';
import type { GasFee } from '../../types';
import Badge from '../../components/ui/Badge';
import Tooltip from '../../components/ui/Tooltip';

interface GasTrackerProps {
  fees: readonly GasFee[];
  /** True when at least one row comes from a live RPC read. */
  live?: boolean;
  /** True when rows come from the localStorage cache (rate-limit). */
  cached?: boolean;
  /** Topbar search query — filters by chain name. */
  query?: string;
}

/** Per-chain gas comparison bars with the cheapest transfer highlighted. */
export default function GasTracker({
  fees,
  live = false,
  cached = false,
  query = '',
}: GasTrackerProps) {
  const q = query.trim().toLowerCase();
  const shown = fees.filter(
    (f) => q === '' || chainInfo(f.chain).name.toLowerCase().includes(q),
  );
  const cheapest = cheapestGas(shown.length > 0 ? shown : fees);
  const maxCost = Math.max(...fees.map((f) => f.transferUsd), 0.0001);

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          Gas Tracker
          <Tooltip text="Gas fee = biaya untuk menjalankan transaksi di blockchain. Makin ramai jaringan, makin mahal. Biaya ini dibayar ke validator, bukan ke TrashGod Vault.">
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-line bg-surface-2 text-[10px] font-bold text-muted hover:border-accent hover:text-white">
              ?
            </span>
          </Tooltip>
        </h2>
        {cached ? (
          <Badge variant="amber">Cache · RPC rate-limit</Badge>
        ) : live ? (
          <Badge variant="green">LIVE · RPC 15 dtk</Badge>
        ) : (
          <Badge variant="blue">Snapshot 19 Nov 2026</Badge>
        )}
      </div>
      <p className="mb-4 text-sm text-muted">
        Biaya transfer native per chain — bar lebih pendek = lebih murah.
      </p>
      <div>
        {shown.map((f) => {
          const chain = chainInfo(f.chain);
          const isCheapest = cheapest?.chain === f.chain;
          const width = Math.max((f.transferUsd / maxCost) * 100, 1.5);
          return (
            <div
              key={f.chain}
              className="grid grid-cols-[168px_1fr_92px] items-center gap-2.5 border-b border-dashed border-line py-2 text-sm last:border-0 max-sm:grid-cols-[88px_1fr_78px]"
            >
              <span className="flex items-center gap-2 font-medium">
                <i
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: chain.color }}
                />
                <span className="truncate">{chain.name}</span>
                {isCheapest && (
                  <Badge variant="green" className="max-sm:hidden">
                    TERMURAH
                  </Badge>
                )}
              </span>
              <span className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                <span
                  className={`block h-full rounded-full ${
                    isCheapest
                      ? 'bg-gradient-to-r from-accent to-accent-2'
                      : f.transferUsd > maxCost * 0.5
                        ? 'bg-loss'
                        : f.transferUsd > maxCost * 0.1
                          ? 'bg-amber'
                          : 'bg-gradient-to-r from-accent to-accent-2'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className="text-right font-mono text-xs tabular-nums">
                <span className="block font-semibold text-white">
                  {formatUsd(f.transferUsd)}
                </span>
                <span className="block text-muted">
                  {f.gasPriceGwei > 0
                    ? `${f.gasPriceGwei} gwei`
                    : 'fee market'}
                </span>
              </span>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            Tidak ada chain yang cocok dengan “{query}”.
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">
        {live
          ? 'Sumber: eth_gasPrice dari RPC publik tiap chain, refresh 15 detik. Baris tanpa data live memakai snapshot.'
          : 'Snapshot 19 Nov 2026 — data live tampil otomatis begitu RPC menjawab.'}
      </p>
    </section>
  );
}
