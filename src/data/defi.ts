import type { YieldPool } from '../types';

/**
 * Seed DeFi pools — representative rates, Nov 2026.
 * Replace with a live yield API (e.g. DefiLlama) in phase 2.
 */
export const YIELD_POOLS: readonly YieldPool[] = [
  {
    id: 'aave-usdc-eth',
    protocol: 'Aave V3',
    pair: 'USDC',
    chain: 'ethereum',
    apy: 4.2,
    tvlUsd: 1_200_000_000,
    risk: 'low',
    category: 'lending',
  },
  {
    id: 'lido-steth',
    protocol: 'Lido',
    pair: 'stETH',
    chain: 'ethereum',
    apy: 3.1,
    tvlUsd: 14_000_000_000,
    risk: 'low',
    category: 'staking',
  },
  {
    id: 'venus-usdt-bsc',
    protocol: 'Venus',
    pair: 'USDT',
    chain: 'bsc',
    apy: 6.8,
    tvlUsd: 210_000_000,
    risk: 'low',
    category: 'lending',
  },
  {
    id: 'pancake-cake-bnb',
    protocol: 'PancakeSwap',
    pair: 'CAKE-BNB',
    chain: 'bsc',
    apy: 18.4,
    tvlUsd: 84_000_000,
    risk: 'medium',
    category: 'lp',
  },
  {
    id: 'aerodrome-weth-usdc',
    protocol: 'Aerodrome',
    pair: 'WETH-USDC',
    chain: 'base',
    apy: 22.1,
    tvlUsd: 46_000_000,
    risk: 'medium',
    category: 'lp',
  },
  {
    id: 'kamino-sol',
    protocol: 'Kamino',
    pair: 'SOL',
    chain: 'solana',
    apy: 7.9,
    tvlUsd: 890_000_000,
    risk: 'low',
    category: 'lending',
  },
  {
    id: 'gmx-glp-arb',
    protocol: 'GMX',
    pair: 'GLP',
    chain: 'arbitrum',
    apy: 12.6,
    tvlUsd: 320_000_000,
    risk: 'medium',
    category: 'vault',
  },
  {
    id: 'quickswap-matic-usdc',
    protocol: 'QuickSwap',
    pair: 'MATIC-USDC',
    chain: 'polygon',
    apy: 9.3,
    tvlUsd: 38_000_000,
    risk: 'high',
    category: 'lp',
  },
] as const;

export function bestApy(
  pools: readonly YieldPool[],
): YieldPool | undefined {
  return [...pools].sort((a, b) => b.apy - a.apy)[0];
}
