import { useState } from 'react';
import { Image as ImageIcon, Search } from 'lucide-react';
import { CHAINS, chainInfo } from '../../data';
import { fetchNftMetadata, type NftMetadata } from '../../lib/live';
import { isAddress } from '../../lib/format';
import type { ChainId } from '../../types';
import CopyAddressButton from '../../components/ui/CopyAddressButton';
import DetailDrawer from '../../components/layout/DetailDrawer';

interface LookupResult {
  meta: NftMetadata;
  contract: string;
  tokenId: string;
  chain: ChainId;
}

/**
 * Public NFT lookup — any visitor can check any ERC-721 by pasting its
 * contract address + token ID. Metadata is read on-chain (tokenURI)
 * and fetched from its metadata URL. Nothing here is a personal gallery.
 */
export default function NftLookup() {
  const [chain, setChain] = useState<ChainId>('bsc');
  const [contract, setContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function lookup(): Promise<void> {
    const c = contract.trim();
    const t = tokenId.trim();
    if (!isAddress(c)) {
      setError('Alamat kontrak tidak valid — harus 0x diikuti 40 karakter hex.');
      setResult(null);
      return;
    }
    if (!/^\d+$/.test(t)) {
      setError('Token ID harus angka.');
      setResult(null);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const meta = await fetchNftMetadata(chain, c, t);
      if (!meta) {
        setError(
          'Metadata tidak ditemukan — pastikan kontrak ini ERC-721 dan token ID-nya ada.',
        );
        setResult(null);
        return;
      }
      setResult({ meta, contract: c, tokenId: t, chain });
    } catch {
      setError('Gagal membaca metadata — RPC / IPFS tidak menjawab.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <Search className="h-5 w-5 text-accent-2" />
        <h2 className="text-lg font-bold text-white">Cek NFT</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Tempel alamat kontrak ERC-721 dan token ID — metadata dibaca
        on-chain (tokenURI) lalu ditampilkan di bawah.
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
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void lookup();
          }}
          type="text"
          spellCheck={false}
          placeholder="Alamat kontrak 0x…"
          aria-label="Alamat kontrak"
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <input
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void lookup();
          }}
          type="text"
          inputMode="numeric"
          placeholder="Token ID"
          aria-label="Token ID"
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 sm:w-32"
        />
        <button
          onClick={() => void lookup()}
          disabled={loading}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? 'Membaca…' : 'Lihat NFT'}
        </button>
      </div>
      {error !== '' && <p className="mt-2 text-sm text-loss">{error}</p>}

      {result && (
        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-line bg-bg p-4 sm:flex-row">
          <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2">
            {result.meta.image ? (
              <img
                src={result.meta.image}
                alt={result.meta.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-white">
              {result.meta.name}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Token #{result.tokenId} · {chainInfo(result.chain).name}
            </p>
            {result.meta.description !== '' && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-300">
                {result.meta.description}
              </p>
            )}
            {result.meta.attributes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.meta.attributes.slice(0, 8).map((a) => (
                  <span
                    key={`${a.trait_type}-${a.value}`}
                    className="rounded-lg border border-line bg-surface px-2 py-1 text-[11px] text-slate-300"
                  >
                    <span className="text-muted">{a.trait_type}: </span>
                    {a.value}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CopyAddressButton address={result.contract} />
              <button
                onClick={() => setDrawerOpen(true)}
                className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-white"
              >
                Lihat detail
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={result?.meta.name ?? 'Detail NFT'}
      >
        {result && (
          <div className="space-y-4 text-sm">
            <p className="leading-relaxed text-slate-300">
              Metadata dibaca on-chain via tokenURI — bukan data contoh.
            </p>
            <dl className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Kontrak</dt>
                <dd>
                  <CopyAddressButton address={result.contract} />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Token ID</dt>
                <dd className="font-mono text-white">{result.tokenId}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Chain</dt>
                <dd className="font-medium text-white">
                  {chainInfo(result.chain).name}
                </dd>
              </div>
              {result.meta.attributes.length > 0 && (
                <div>
                  <dt className="mb-1.5 text-muted">Traits</dt>
                  <dd className="space-y-1.5">
                    {result.meta.attributes.map((a) => (
                      <p
                        key={`${a.trait_type}-${a.value}`}
                        className="flex justify-between gap-3 rounded-lg border border-line bg-bg px-3 py-2"
                      >
                        <span className="text-muted">{a.trait_type}</span>
                        <span className="text-white">{a.value}</span>
                      </p>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </DetailDrawer>
    </section>
  );
}
