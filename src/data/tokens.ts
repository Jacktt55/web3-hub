import type { ChainInfo, GasFee, TokenHolding } from '../types';

/**
 * Seed data — snapshot 19 Nov 2026.
 * Prices / gas are the verified snapshot values from the dashboard;
 * the live layer (CoinGecko + public RPCs) replaces these at runtime.
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

/** Wallet used across the app (user's Binance Agentic Wallet). */
export const WALLET_ADDRESS = '0xDf0bD911CFA8698d65e56c5E60B6591DA80B58ff' as const;

export const HOLDINGS: readonly TokenHolding[] = [
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    chain: 'bitcoin',
    balance: 0.25,
    priceUsd: 64912,
    change24h: 0.07,
    logoColor: '#f7931a',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    chain: 'ethereum',
    balance: 4.2,
    priceUsd: 1824,
    change24h: 0.23,
    logoColor: '#627eea',
  },
  {
    id: 'eth-base',
    symbol: 'ETH',
    name: 'Ethereum (Base)',
    chain: 'base',
    balance: 1.4,
    priceUsd: 1824,
    change24h: 0.23,
    logoColor: '#0052ff',
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    chain: 'bsc',
    balance: 1.6,
    priceUsd: 597.73,
    change24h: 1.06,
    logoColor: '#f0b90b',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    chain: 'solana',
    balance: 24,
    priceUsd: 74.94,
    change24h: 0.04,
    logoColor: '#14f195',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    chain: 'bsc',
    balance: 4450,
    priceUsd: 1,
    change24h: 0,
    logoColor: '#26a17b',
  },
] as const;

export function holdingValue(h: TokenHolding): number {
  return h.balance * h.priceUsd;
}

export function portfolioTotal(holdings: readonly TokenHolding[]): number {
  return holdings.reduce((sum, h) => sum + holdingValue(h), 0);
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
