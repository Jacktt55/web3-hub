import { useState } from 'react';
import { ScanLine, ShieldAlert, ShieldCheck } from 'lucide-react';
import { CHAINS } from '../../data';
import { scanContractLive } from '../../lib/live';
import type { LiveScanResult } from '../../lib/live';
import type { ChainId } from '../../types';
import Badge from '../../components/ui/Badge';
import SkeletonCard from '../../components/ui/SkeletonCard';

const RISK_BADGE = {
  low: 'green',
  medium: 'amber',
  high: 'red',
  critical: 'red',
} as const;

type ScanOutcome =
  | { kind: 'live'; result: LiveScanResult; address: string; chain: ChainId }
  | { kind: 'none' };

/**
 * Token / contract risk scanner.
 * LIVE check — bytecode presence (eth_getCode) + source verification
 * (Sourcify v2). v1 does not simulate honeypots; that limit is
 * labelled in the UI. No local database, no seeded results.
 */
export default function ContractScanner() {
  const [input, setInput] = useState('');
  const [chain, setChain] = useState<ChainId>('bsc');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  async function scan(): Promise<void> {
    const address = input.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      setError('Alamat tidak valid — harus 0x diikuti 40 karakter hex.');
      setOutcome(null);
      return;
    }
    setError('');
    setScanning(true);
    try {
      const result = await scanContractLive(address, chain);
      setOutcome(
        result.hasCode
          ? { kind: 'live', result, address, chain }
          : { kind: 'none' },
      );
    } catch {
      setError('Pemeriksaan live gagal — RPC / Sourcify tidak menjawab.');
      setOutcome(null);
    } finally {
      setScanning(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <ScanLine className="h-5 w-5 text-accent-2" />
        <h2 className="text-lg font-bold text-white">Contract Scanner</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Tempel alamat kontrak untuk memeriksa skor risiko — pemeriksaan live
        (bytecode + verifikasi source).
      </p>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value as ChainId)}
          aria-label="Chain"
          className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
        >
          {CHAINS.filter((c) =>
            ['ethereum', 'bsc', 'base', 'arbitrum', 'polygon'].includes(c.id),
          ).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void scan();
          }}
          type="text"
          spellCheck={false}
          placeholder="0x…"
          aria-label="Alamat kontrak"
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <button
          onClick={() => void scan()}
          disabled={scanning}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
        >
          {scanning ? 'Memindai…' : 'Pindai'}
        </button>
      </div>
      {error !== '' && <p className="mt-2 text-sm text-loss">{error}</p>}

      {scanning && (
        <div className="mt-5">
          <SkeletonCard lines={3} />
        </div>
      )}

      {outcome?.kind === 'live' && (
        <div className="mt-5 rounded-xl border border-line bg-bg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold text-white">
              {outcome.address}
            </p>
            <Badge variant={RISK_BADGE[outcome.result.risk]}>
              Risiko {outcome.result.risk} · Skor {outcome.result.score}/100
            </Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <span
              className={`block h-full rounded-full ${
                outcome.result.risk === 'low'
                  ? 'bg-profit'
                  : outcome.result.risk === 'medium'
                    ? 'bg-amber'
                    : 'bg-loss'
              }`}
              style={{ width: `${outcome.result.score}%` }}
            />
          </div>
          {outcome.result.flags.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              {outcome.result.flags.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-start gap-2 text-sm text-profit">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Source terverifikasi di Sourcify — tidak ada temuan.
            </p>
          )}
          <p className="mt-3 text-xs text-muted">
            Pemeriksaan live: eth_getCode + Sourcify v2 · v1 hanya memeriksa
            verifikasi & bytecode, bukan simulasi honeypot.
          </p>
        </div>
      )}

      {outcome?.kind === 'none' && (
        <div className="mt-5 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-amber">
          Alamat ini bukan kontrak (EOA atau belum deploy) — tidak ada
          bytecode di alamat tersebut.
        </div>
      )}
    </section>
  );
}
