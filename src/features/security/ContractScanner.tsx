import { useState } from 'react';
import { ScanLine, ShieldAlert, ShieldCheck } from 'lucide-react';
import { CHAINS } from '../../data';
import { scanContractRisk } from '../../lib/live';
import type { ContractRiskResult } from '../../lib/live';
import { shortenAddress } from '../../lib/format';
import type { ChainId } from '../../types';
import Badge from '../../components/ui/Badge';
import SkeletonCard from '../../components/ui/SkeletonCard';

const SAMPLES: { label: string; chain: ChainId; address: string }[] = [
  {
    label: 'USDT · BSC',
    chain: 'bsc',
    address: '0x55d398326f99059fF775485246999027B3197955',
  },
  {
    label: 'USDC · Ethereum',
    chain: 'ethereum',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  {
    label: 'WBNB · BSC',
    chain: 'bsc',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  },
];

type Tone = 'green' | 'red' | 'amber' | 'grey';

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-profit',
  red: 'text-loss',
  amber: 'text-amber',
  grey: 'text-muted',
};

const TONE_DOT: Record<Tone, string> = {
  green: 'bg-profit',
  red: 'bg-loss',
  amber: 'bg-amber',
  grey: 'bg-slate-500',
};

function RiskPill({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: Tone;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <i className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
        {label}
      </p>
      <p className={`mt-1.5 text-sm font-bold ${TONE_TEXT[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

function taxTone(tax: number | null): Tone {
  if (tax === null) return 'grey';
  if (tax <= 5) return 'green';
  if (tax <= 10) return 'amber';
  return 'red';
}

type ScanOutcome =
  | { kind: 'risk'; result: ContractRiskResult }
  | { kind: 'none' };

/**
 * Token / contract risk checker.
 * Live: bytecode + Sourcify verification (RPC) + owner() call, plus
 * GoPlus token_security (honeypot, buy/sell tax, DEX presence,
 * locked-holder share). A pill that cannot be verified shows
 * "Tidak diketahui" — never a guessed green/red.
 */
export default function ContractScanner() {
  const [input, setInput] = useState('');
  const [chain, setChain] = useState<ChainId>('bsc');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  async function scan(addressInput?: string, chainInput?: ChainId): Promise<void> {
    const address = (addressInput ?? input).trim();
    const targetChain = chainInput ?? chain;
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      setError('Alamat tidak valid — harus 0x diikuti 40 karakter hex.');
      setOutcome(null);
      return;
    }
    setError('');
    setScanning(true);
    try {
      const result = await scanContractRisk(address, targetChain);
      setOutcome(
        result.hasCode ? { kind: 'risk', result } : { kind: 'none' },
      );
    } catch {
      setError('Pemeriksaan live gagal — RPC / API tidak menjawab.');
      setOutcome(null);
    } finally {
      setScanning(false);
    }
  }

  const result = outcome?.kind === 'risk' ? outcome.result : null;
  const gp = result?.goplus ?? null;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const owner = result?.owner ?? gp?.ownerAddress ?? null;
  const ownerRenounced =
    owner !== null && owner.toLowerCase() === zeroAddress;

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <ScanLine className="h-5 w-5 text-accent-2" />
        <h2 className="text-lg font-bold text-white">Contract Risk Checker</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Tempel alamat kontrak untuk memeriksa risiko honeypot, pajak
        beli/jual, likuiditas, dan ownership — live via RPC, Sourcify,
        dan GoPlus.
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Contoh:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            onClick={() => {
              setInput(s.address);
              setChain(s.chain);
              void scan(s.address, s.chain);
            }}
            disabled={scanning}
            className="rounded-full border border-line bg-bg px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:border-accent hover:text-white disabled:opacity-60"
          >
            {s.label}
          </button>
        ))}
      </div>
      {error !== '' && <p className="mt-2 text-sm text-loss">{error}</p>}

      {scanning && (
        <div className="mt-5">
          <SkeletonCard lines={3} />
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold break-all text-white">
              {result.address}
            </p>
            <Badge variant={result.verified ? 'green' : 'amber'}>
              {result.verified
                ? 'Source terverifikasi · Sourcify'
                : 'Source tidak terverifikasi'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <RiskPill
              label="Honeypot"
              value={
                gp?.isHoneypot === true
                  ? 'Honeypot terdeteksi'
                  : gp?.isHoneypot === false
                    ? 'Bukan honeypot'
                    : 'Tidak diketahui'
              }
              tone={
                gp?.isHoneypot === true
                  ? 'red'
                  : gp?.isHoneypot === false
                    ? 'green'
                    : 'grey'
              }
              hint={
                gp?.cannotBuy === true
                  ? 'Token ini tidak bisa dibeli.'
                  : gp?.cannotSellAll === true
                    ? 'Tidak semua token bisa dijual.'
                    : 'Data: GoPlus'
              }
            />
            <RiskPill
              label="Buy Tax"
              value={
                gp?.buyTax !== null && gp?.buyTax !== undefined
                  ? `${gp.buyTax}%`
                  : 'Tidak diketahui'
              }
              tone={taxTone(gp?.buyTax ?? null)}
              hint="Pajak saat membeli token."
            />
            <RiskPill
              label="Sell Tax"
              value={
                gp?.sellTax !== null && gp?.sellTax !== undefined
                  ? `${gp.sellTax}%`
                  : 'Tidak diketahui'
              }
              tone={taxTone(gp?.sellTax ?? null)}
              hint="Pajak saat menjual token."
            />
            <RiskPill
              label="Likuiditas"
              value={
                gp === null
                  ? 'Tidak diketahui'
                  : gp.lockedLpPercent !== null && gp.lockedLpPercent > 0
                    ? `Terkunci ${gp.lockedLpPercent.toFixed(1)}%`
                    : gp.isInDex === true
                      ? 'Di DEX, kunci belum terverifikasi'
                      : 'Tidak ada di DEX'
              }
              tone={
                gp === null
                  ? 'grey'
                  : gp.lockedLpPercent !== null && gp.lockedLpPercent > 0
                    ? 'green'
                    : gp.isInDex === true
                      ? 'amber'
                      : 'red'
              }
              hint="Bagian holder teratas yang terkunci (GoPlus)."
            />
            <RiskPill
              label="Ownership"
              value={
                ownerRenounced
                  ? 'Renounced'
                  : gp?.canTakeBackOwnership === true
                    ? 'Owner bisa ambil alih'
                    : owner !== null
                      ? `Owner aktif`
                      : 'Tidak diketahui'
              }
              tone={
                ownerRenounced
                  ? 'green'
                  : gp?.canTakeBackOwnership === true
                    ? 'red'
                    : owner !== null
                      ? 'amber'
                      : 'grey'
              }
              hint={
                ownerRenounced
                  ? 'Owner = 0x000…000, tidak bisa diubah lagi.'
                  : owner !== null
                    ? `Owner: ${shortenAddress(owner)}`
                    : 'owner() tidak menjawab (bukan Ownable?).'
              }
            />
            <RiskPill
              label="Source Code"
              value={
                result.verified
                  ? 'Terverifikasi'
                  : 'Tidak terverifikasi'
              }
              tone={result.verified ? 'green' : 'red'}
              hint="Verifikasi source di Sourcify v2."
            />
          </div>

          {gp === null && (
            <p className="rounded-xl border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
              GoPlus tidak menjawab saat ini — pill honeypot, pajak, dan
              likuiditas menampilkan "Tidak diketahui". Pemeriksaan
              bytecode, verifikasi, dan owner() di atas tetap live dari
              RPC.
            </p>
          )}
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            {result.verified ? (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-profit" />
            ) : (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
            )}
            Skor risiko dihitung dari bytecode + verifikasi; honeypot
            tidak bisa dibuktikan 100% dari data statis — selalu cek
            sendiri sebelum berinteraksi dengan token baru.
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
