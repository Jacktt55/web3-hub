import type { ChainInfo, GasFee } from '../types';

/**
 * Public reference data — chains and gas snapshot rows.
 * No personal data lives here: the app has no default wallet and no
 * seeded holdings. Prices / gas are replaced live at runtime
 * (CoinGecko + public RPCs); the snapshot rows are the fallback.
 */

export const CHAINS: readonly ChainInfo[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    color: '#627eea',
    explorer: 'https://etherscan.io',
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    nativeSymbol: 'BNB',
    color: '#f0b90b',
    explorer: 'https://bscscan.com',
  },
  {
    id: 'base',
    name: 'Base',
    nativeSymbol: 'ETH',
    color: '#0052ff',
    explorer: 'https://basescan.org',
  },
  {
    id: 'solana',
    name: 'Solana',
    nativeSymbol: 'SOL',
    color: '#14f195',
    explorer: 'https://solscan.io',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    nativeSymbol: 'ETH',
    color: '#28a0f0',
    explorer: 'https://arbiscan.io',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    nativeSymbol: 'POL',
    color: '#8247e5',
    explorer: 'https://polygonscan.com',
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    nativeSymbol: 'BTC',
    color: '#f7931a',
    explorer: 'https://mempool.space',
  },
] as const;

export function chainInfo(chain: ChainInfo['id']): ChainInfo {
  const found = CHAINS.find((c) => c.id === chain);
  if (!found) throw new Error(`Unknown chain: ${chain}`);
  return found;
}

export const GAS_FEES: readonly GasFee[] = [
  {
    chain: 'ethereum',
    gasPriceGwei: 0.15,
    transferUsd: 0.0121,
    swapUsd: 0.048,
    updatedAt: '2026-11-19T07:00:00.000Z',
    status: 'snapshot',
  },
  {
    chain: 'bsc',
    gasPriceGwei: 0.05,
    transferUsd: 0.0011,
    swapUsd: 0.0044,
    updatedAt: '2026-11-19T07:00:00.000Z',
    status: 'snapshot',
  },
  {
    chain: 'base',
    gasPriceGwei: 0.006,
    transferUsd: 0.0007,
    swapUsd: 0.0028,
    updatedAt: '2026-11-19T07:00:00.000Z',
    status: 'snapshot',
  },
  {
    chain: 'arbitrum',
    gasPriceGwei: 0.02,
    transferUsd: 0.0009,
    swapUsd: 0.0036,
    updatedAt: '2026-11-19T07:00:00.000Z',
    status: 'snapshot',
  },
  {
    chain: 'polygon',
    gasPriceGwei: 120,
    transferUsd: 0.00063,
    swapUsd: 0.0025,
    updatedAt: '2026-11-19T07:00:00.000Z',
    status: 'snapshot',
  },
  {
    chain: 'solana',
    gasPriceGwei: 0.00025,
    transferUsd: 0.00002,
    swapUsd: 0.00008,
    updatedAt: '2026-11-19T07:00:00.000Z',
    status: 'estimate',
  },
  {
    chain: 'bitcoin',
    gasPriceGwei: 0,
    transferUsd: 0.42,
    swapUsd: 0,
    updatedAt: '2026-11-19T07:00:00.000Z',
    status: 'estimate',
  },
] as const;

/** Cheapest chain for a plain transfer, by USD cost. */
export function cheapestGas(
  fees: readonly GasFee[],
): GasFee | undefined {
  return [...fees]
    .filter((f) => f.transferUsd > 0)
    .sort((a, b) => a.transferUsd - b.transferUsd)[0];
}
