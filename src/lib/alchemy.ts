import type { AlchemyNft, AlchemyTokenBalance } from '../types';

/**
 * Alchemy read-only API — real ERC-20 balances and NFTs for a
 * connected wallet. Active ONLY when a real wallet is connected AND
 * VITE_ALCHEMY_API_KEY is present (set in Vercel env vars); otherwise
 * the app falls back to demo data and the direct-RPC watchlist.
 * The key is a public client key inlined at build time by Vite; it
 * is never pasted into chat, files, or memory.
 */

export function getAlchemyKey(): string | null {
  const key = import.meta.env.VITE_ALCHEMY_API_KEY as string | undefined;
  return key && key.length > 0 ? key : null;
}

/** wagmi chain id → Alchemy network subdomain. */
export function alchemySubdomain(chainId: number): string | null {
  switch (chainId) {
    case 1:
      return 'eth-mainnet';
    case 8453:
      return 'base-mainnet';
    case 42161:
      return 'arb-mainnet';
    case 137:
      return 'polygon-mainnet';
    case 56:
      return 'bnb-mainnet';
    default:
      return null;
  }
}

interface TokenBalanceEntry {
  contractAddress?: unknown;
  tokenBalance?: unknown;
  error?: unknown;
}

interface TokenMetadata {
  name?: unknown;
  symbol?: unknown;
  decimals?: unknown;
}

/**
 * Real ERC-20 balances via alchemy_getTokenBalances (+ metadata per
 * token). Returns only non-zero balances, capped at 12 tokens.
 */
export async function fetchAlchemyTokenBalances(
  address: string,
  chainId: number,
): Promise<AlchemyTokenBalance[]> {
  const key = getAlchemyKey();
  const network = alchemySubdomain(chainId);
  if (!key || !network) return [];
  const url = `https://${network}.g.alchemy.com/v2/${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenBalances',
      params: [address, 'erc20'],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Alchemy HTTP ${res.status}`);
  const json = (await res.json()) as {
    result?: { tokenBalances?: TokenBalanceEntry[] };
    error?: { message?: string };
  };
  if (json.error) throw new Error(json.error.message ?? 'Alchemy error');
  const entries = (json.result?.tokenBalances ?? []).filter(
    (e) =>
      typeof e.contractAddress === 'string' &&
      typeof e.tokenBalance === 'string' &&
      e.tokenBalance !== '0x0' &&
      e.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000' &&
      !e.error,
  ) as { contractAddress: string; tokenBalance: string }[];
  const out: AlchemyTokenBalance[] = [];
  for (const e of entries.slice(0, 12)) {
    try {
      const metaRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'alchemy_getTokenMetadata',
          params: [e.contractAddress],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!metaRes.ok) continue;
      const metaJson = (await metaRes.json()) as { result?: TokenMetadata };
      const meta = metaJson.result ?? {};
      const symbol = typeof meta.symbol === 'string' ? meta.symbol : '';
      const decimals =
        typeof meta.decimals === 'number' ? meta.decimals : 18;
      if (symbol === '') continue;
      out.push({
        contractAddress: e.contractAddress,
        symbol,
        name: typeof meta.name === 'string' ? meta.name : symbol,
        decimals,
        balance: BigInt(e.tokenBalance),
        chainId,
      });
    } catch {
      // one bad metadata lookup must not kill the whole list
    }
  }
  return out;
}

interface AlchemyNftRaw {
  contract?: { address?: unknown };
  tokenId?: unknown;
  name?: unknown;
  collection?: { name?: unknown };
  image?: { cachedUrl?: unknown; originalUrl?: unknown };
  raw?: { metadata?: { attributes?: unknown } };
}

/**
 * Real NFTs via getNFTsForOwner (Alchemy NFT API v3, with metadata).
 * Image falls back to the raw image URL, then to a generative SVG
 * in the UI when the URL is missing or fails to load.
 */
export async function fetchAlchemyNfts(
  address: string,
  chainId: number,
): Promise<AlchemyNft[]> {
  const key = getAlchemyKey();
  const network = alchemySubdomain(chainId);
  if (!key || !network) return [];
  const url =
    `https://${network}.g.alchemy.com/nft/v3/${key}/getNFTsForOwner` +
    `?owner=${address}&withMetadata=true&pageSize=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Alchemy NFT HTTP ${res.status}`);
  const json = (await res.json()) as { ownedNfts?: AlchemyNftRaw[] };
  return (json.ownedNfts ?? [])
    .filter(
      (n) =>
        typeof n.contract?.address === 'string' &&
        typeof n.tokenId === 'string',
    )
    .map((n) => {
      const attrs = n.raw?.metadata?.attributes;
      const traits: { trait: string; value: string }[] = Array.isArray(attrs)
        ? attrs
            .filter(
              (a): a is { trait_type?: unknown; value?: unknown } =>
                typeof a === 'object' && a !== null,
            )
            .map((a) => ({
              trait: String(a.trait_type ?? 'Trait'),
              value: String(a.value ?? '—'),
            }))
            .slice(0, 6)
        : [];
      const imageUrl =
        typeof n.image?.cachedUrl === 'string'
          ? n.image.cachedUrl
          : typeof n.image?.originalUrl === 'string'
            ? n.image.originalUrl
            : null;
      return {
        contractAddress: n.contract!.address as string,
        tokenId: n.tokenId as string,
        title:
          typeof n.name === 'string' && n.name !== ''
            ? n.name
            : `#${n.tokenId}`,
        collection:
          typeof n.collection?.name === 'string' && n.collection.name !== ''
            ? n.collection.name
            : 'Unknown Collection',
        imageUrl,
        traits,
      };
    });
}
