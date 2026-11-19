import { useState } from 'react';
import { chainInfo } from '../../data';
import { formatCompact } from '../../lib/format';
import type { YieldPool } from '../../types';
import Badge from '../../components/ui/Badge';
import Tooltip from '../../components/ui/Tooltip';

/**
 * Protocols whose audits are published and widely referenced.
 * A pool only gets the green "Audited • Low Risk" badge when its
 * protocol is on this list AND its APY-derived risk is low; everything
 * else gets the amber badge. This is a heuristic, not a full audit
 * report — the drawer says so.
 */
const AUDITED_PROTOCOLS = new Set([
  'aave',
  'lido',
  'venus',
  'kamino',
  'gmx',
  'compound',
  'morpho',
  'spark',
  'uniswap',
  'pancakeswap',
  'aerodrome',
  'quickswap',
  'curve',
  'balancer',
  'yearn',
  'rocket-pool',
  'jito',
  'marinade',
]);

export function poolAuditBadge(pool: YieldPool): {
  variant: 'green' | 'amber';
  label: string;
} {
  // Protocol names carry suffixes ("Aave V3", "Rocket Pool"), so match
  // on the base name, not the full display string.
  const name = pool.protocol.toLowerCase();
  const audited = [...AUDITED_PROTOCOLS].some(
    (p) =>
      name === p ||
      name.startsWith(`${p} `) ||
      name.startsWith(`${p}-`) ||
      name.replace(/\s+/g, '-') === p,
  );
  if (audited && pool.risk === 'low') {
    return { variant: 'green', label: 'Audited • Low Risk' };
  }
  return { variant: 'amber', label: 'Unaudited • Medium Risk' };
}

const RISK_BADGE = {
  low: 'green',
  medium: 'amber',
  high: 'red',
} as const;

/** Compact deposit calculator inside a pool card (simulation only). */
function DepositCalculator({ apy }: { apy: number }) {
  const [amount, setAmount] = useState('1000');
  const value = Number.parseFloat(amount);
  const valid = Number.isFinite(value) && value > 0;
  const yearly = valid ? (value * apy) / 100 : 0;
  return (
    <div
      className="mt-4 rounded-xl border border-line bg-bg p-3.5"
      onClick={(e) => e.stopPropagation()}
    >
      <label
        htmlFor={`deposit-${apy}`}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted"
      >
        Kalkulator deposit (simulasi)
      </label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted">$</span>
        <input
          id={`deposit-${apy}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          aria-label="Jumlah deposit dalam USD"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink focus:border-accent focus:outline-none"
        />
      </div>
      {valid ? (
        <p className="mt-2 font-mono text-xs tabular-nums text-slate-300">
          ≈{' '}
          <b className="text-profit">
            ${yearly.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </b>{' '}
          / tahun · $
          {(yearly / 12).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
          / bulan
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">
          Masukkan jumlah deposit untuk melihat estimasi hasil.
        </p>
      )}
    </div>
  );
}

interface YieldGridProps {
  pools: readonly YieldPool[];
  live?: boolean;
  /** Topbar search query — filters by protocol or pair. */
  query?: string;
  /** Opens the pool detail drawer. */
  onSelect: (pool: YieldPool) => void;
}

/** DeFi yield & risk comparator — 3-column card grid. */
export default function YieldGrid({
  pools,
  live = false,
  query = '',
  onSelect,
}: YieldGridProps) {
  const q = query.trim().toLowerCase();
  const shown = pools.filter(
    (p) =>
      q === '' ||
      p.protocol.toLowerCase().includes(q) ||
      p.pair.toLowerCase().includes(q),
  );

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          DeFi Yield &amp; Risk Comparator
          <Tooltip text="TVL (Total Value Locked) = total dana yang disimpan semua orang di pool ini. TVL besar biasanya berarti pool lebih ramai dan likuid.">
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-line bg-surface-2 text-[10px] font-bold text-muted hover:border-accent hover:text-white">
              ?
            </span>
          </Tooltip>
        </h2>
        {live ? (
          <Badge variant="green">Live · DefiLlama</Badge>
        ) : (
          <Badge variant="blue">Seed Nov 2026</Badge>
        )}
      </div>
      <p className="mb-4 text-sm text-muted">
        Bandingkan APY antar pool — klik kartu untuk detail &amp; simulasi.
        {live &&
          ' Risiko & kategori diturunkan dari APY (DefiLlama tidak memberi skor risiko).'}
      </p>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Tidak ada pool yang cocok dengan “{query}”.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const chain = chainInfo(p.chain);
            const badge = poolAuditBadge(p);
            return (
              <article
                key={p.id}
                className="flex flex-col rounded-2xl border border-line bg-bg p-5 transition-colors hover:border-accent/40"
              >
                <button
                  onClick={() => onSelect(p)}
                  className="flex flex-1 flex-col text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {p.protocol}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-muted">
                        {p.pair}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-slate-300">
                      <i
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chain.color }}
                      />
                      {chain.name}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        APY
                      </p>
                      <p className="font-mono text-2xl font-bold tabular-nums text-profit">
                        {p.apy.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        TVL
                      </p>
                      <p className="font-mono text-sm font-semibold tabular-nums text-white">
                        ${formatCompact(p.tvlUsd)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <Badge variant={RISK_BADGE[p.risk]}>{p.risk}</Badge>
                    <span className="text-[11px] capitalize text-muted">
                      {p.category}
                    </span>
                  </div>
                </button>

                <DepositCalculator apy={p.apy} />
              </article>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        Badge audit = gabungan daftar protokol utama beraudit + skor risiko
        turunan APY — bukan laporan audit lengkap. Selalu cek sendiri sebelum
        deposit.
      </p>
    </section>
  );
}
