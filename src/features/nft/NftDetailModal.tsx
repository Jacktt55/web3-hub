import { X } from 'lucide-react';
import { chainInfo } from '../../data';
import { formatDateTime, formatUsd } from '../../lib/format';
import type { NftItem } from '../../types';
import Badge from '../../components/ui/Badge';
import CopyAddressButton from '../../components/ui/CopyAddressButton';

interface NftDetailModalProps {
  nft: NftItem | null;
  onClose: () => void;
}

export default function NftDetailModal({
  nft,
  onClose,
}: NftDetailModalProps) {
  if (!nft) return null;
  const chain = chainInfo(nft.chain);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={nft.name}
    >
      <button
        aria-label="Tutup detail"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="relative">
          <img
            src={nft.image}
            alt={nft.name}
            className="aspect-square w-full object-cover"
          />
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white backdrop-blur hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{nft.name}</h2>
              <p className="text-sm text-muted">
                {nft.collection} · Token #{nft.tokenId} · {chain.name}
              </p>
            </div>
            <Badge variant="blue">{nft.class}</Badge>
          </div>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Kontrak</dt>
              <dd>
                {nft.contract ? (
                  <CopyAddressButton address={nft.contract} />
                ) : (
                  <span className="text-muted">Tidak tercatat</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Floor</dt>
              <dd className="font-mono font-semibold text-white">
                {nft.floorUsd !== undefined
                  ? formatUsd(nft.floorUsd)
                  : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Diperoleh</dt>
              <dd className="text-slate-300">
                {formatDateTime(nft.acquiredAt)}
              </dd>
            </div>
          </dl>

          <h3 className="mb-2 mt-5 text-sm font-bold text-white">Traits</h3>
          <div className="grid grid-cols-2 gap-2">
            {nft.traits.map((t) => (
              <div
                key={`${t.trait_type}-${t.value}`}
                className="rounded-xl border border-line bg-bg px-3 py-2.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {t.trait_type}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-white">
                  {t.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
