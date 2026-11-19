import { useState } from 'react';
import { generativeArt } from '../../lib/generativeArt';
import type { DemoNft } from '../../types';

interface NftGridProps {
  items: readonly DemoNft[];
  /** Opens the NFT detail drawer. */
  onSelect: (nft: DemoNft) => void;
}

/**
 * Strict 1:1 grid — every artwork container is aspect-square with
 * object-cover, so the grid never breaks on a missing image.
 * Demo items use deterministic generative SVG (data URI, never a
 * hotlink); real Alchemy NFTs use their own image URL, falling back
 * to generative art when the URL is missing or fails to load.
 * Card shows ONLY artwork, title, collection, floor price.
 */
export default function NftGrid({ items, onSelect }: NftGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((nft) => (
        <NftCard key={nft.id} nft={nft} onSelect={onSelect} />
      ))}
    </div>
  );
}

function NftCard({
  nft,
  onSelect,
}: {
  nft: DemoNft;
  onSelect: (nft: DemoNft) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const src =
    nft.artwork && !imgFailed ? nft.artwork : generativeArt(nft.id);
  return (
    <button
      onClick={() => onSelect(nft)}
      className="group overflow-hidden rounded-2xl border border-line bg-surface text-left transition-colors hover:border-accent/40"
    >
      <div className="aspect-square w-full overflow-hidden bg-surface-2">
        <img
          src={src}
          alt={nft.title}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-bold text-white">
          {nft.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted">
          {nft.collection}
        </p>
        <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-white">
          {nft.floorEth === null ? (
            '—'
          ) : (
            <>
              {nft.floorEth} ETH{' '}
              <span className="text-xs font-normal text-muted">floor</span>
            </>
          )}
        </p>
      </div>
    </button>
  );
}
