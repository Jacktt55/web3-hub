import { chainInfo } from '../../data';
import type { NftItem } from '../../types';
import Badge from '../../components/ui/Badge';

const CLASS_BADGE = {
  Scoop: 'blue',
  Legend: 'amber',
  Platinum: 'green',
  Jade: 'green',
  Common: 'muted',
} as const;

interface NftGridProps {
  nfts: readonly NftItem[];
  /** Topbar search query — filters by name, collection, or token id. */
  query: string;
  onSelect: (nft: NftItem) => void;
  /** Real artwork resolved via tokenURI, keyed by NFT id. */
  images?: Record<string, string>;
}

export default function NftGrid({
  nfts,
  query,
  onSelect,
  images = {},
}: NftGridProps) {
  const q = query.trim().toLowerCase();
  const rows = nfts.filter(
    (n) =>
      q === '' ||
      n.name.toLowerCase().includes(q) ||
      n.collection.toLowerCase().includes(q) ||
      n.tokenId.includes(q),
  );

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Galeri NFT</h2>
        <p className="text-sm text-muted">
          {rows.length} dari {nfts.length} NFT
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
          Tidak ada NFT yang cocok dengan “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {rows.map((n) => {
            const chain = chainInfo(n.chain);
            return (
              <button
                key={n.id}
                onClick={() => onSelect(n)}
                className="group overflow-hidden rounded-2xl border border-line bg-surface text-left transition-colors hover:border-accent/50"
              >
                <span className="relative block aspect-square overflow-hidden bg-surface-2">
                  <img
                    src={images[n.id] ?? n.image}
                    alt={n.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-2.5 top-2.5">
                    <Badge variant={CLASS_BADGE[n.class]}>{n.class}</Badge>
                  </span>
                </span>
                <span className="block p-3.5">
                  <span className="block truncate text-sm font-semibold text-white">
                    {n.name}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
                    <span className="truncate">{n.collection}</span>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <i
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chain.color }}
                      />
                      {chain.name}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
