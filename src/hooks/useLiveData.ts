import { useEffect, useRef, useState } from 'react';
import { GAS_FEES, YIELD_POOLS } from '../data';
import type {
  Address,
  ChainId,
  GasFee,
  TokenApproval,
  YieldPool,
} from '../types';
import { loadCache, saveCache } from '../lib/cache';
import {
  fetchLiveApprovals,
  fetchLiveGas,
  fetchLivePrices,
  fetchLiveYields,
  fetchNativeBalances,
  fetchTokenBalances,
  type TokenBalance,
} from '../lib/live';

export interface LiveData {
  /** Live USD prices by symbol, null until the first successful fetch. */
  prices: Record<string, number> | null;
  /** Live 24h changes in percent by symbol. */
  changes: Record<string, number> | null;
  /** Gas rows: live rows replace seed per chain, failures keep seed. */
  gas: GasFee[];
  gasLive: boolean;
  yields: YieldPool[];
  yieldsLive: boolean;
  /** Live approvals; null until the first fetch (then [] means truly none). */
  approvals: TokenApproval[] | null;
  approvalsLive: boolean;
  /** Native balances per EVM chain for the active wallet; null = no wallet. */
  nativeBalances: { chain: ChainId; balance: bigint }[] | null;
  /** ERC-20 balances for the watchlist tokens; null = no wallet. */
  tokenBalances: TokenBalance[] | null;
  lastUpdated: Date | null;
  /** True when at least one live source has answered. */
  live: boolean;
  /** True when prices currently come from the localStorage cache (rate-limit / offline). */
  pricesCached: boolean;
  /** True when gas rows currently come from the localStorage cache. */
  gasCached: boolean;
}

/**
 * Polls every live source on its own cadence:
 * prices 30s · gas 15s · yields 5m · approvals 60s · balances 60s.
 * Wallet-scoped reads (approvals, balances) only run when a visitor
 * has entered a wallet address. Any failure keeps the previous value,
 * falls back to the localStorage cache (15m prices / 10m gas), and
 * only then to the public seed — the app never goes blank.
 */
export function useLiveData(wallet: Address | null): LiveData {
  const [prices, setPrices] = useState<Record<string, number> | null>(null);
  const [changes, setChanges] = useState<Record<string, number> | null>(
    null,
  );
  const [gas, setGas] = useState<GasFee[]>([...GAS_FEES]);
  const [gasLive, setGasLive] = useState(false);
  const [yields, setYields] = useState<YieldPool[]>([...YIELD_POOLS]);
  const [yieldsLive, setYieldsLive] = useState(false);
  const [approvals, setApprovals] = useState<TokenApproval[] | null>(null);
  const [approvalsLive, setApprovalsLive] = useState(false);
  const [nativeBalances, setNativeBalances] = useState<
    { chain: ChainId; balance: bigint }[] | null
  >(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[] | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pricesCached, setPricesCached] = useState(false);
  const [gasCached, setGasCached] = useState(false);
  const pricesRef = useRef<{ prices: Record<string, number> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const every = (fn: () => void, ms: number) => {
      void fn();
      timers.push(window.setInterval(fn, ms));
    };

    // A new wallet means new on-chain reads — drop the old ones.
    setApprovals(null);
    setApprovalsLive(false);
    setNativeBalances(null);
    setTokenBalances(null);

    async function refreshPrices(): Promise<void> {
      try {
        const p = await fetchLivePrices();
        if (cancelled) return;
        pricesRef.current = p;
        setPrices(p.prices);
        setChanges(p.changes);
        setPricesCached(false);
        saveCache('web3hub-cache-prices', {
          prices: p.prices,
          changes: p.changes,
        });
        setLastUpdated(new Date());
      } catch {
        // Rate-limit / offline: serve the cached value (15 min TTL).
        const cached = loadCache<{
          prices: Record<string, number>;
          changes: Record<string, number>;
        }>('web3hub-cache-prices', 15 * 60 * 1000);
        if (cached && !cancelled) {
          pricesRef.current = cached;
          setPrices(cached.prices);
          setChanges(cached.changes);
          setPricesCached(true);
          setLastUpdated(new Date());
        }
        // otherwise keep previous prices / seed
      }
    }

    async function refreshGas(): Promise<void> {
      const p = pricesRef.current?.prices;
      if (!p) return; // need native prices before gas USD math
      try {
        const live = await fetchLiveGas(p);
        if (cancelled || live.length === 0) return;
        setGas((prev) => {
          const byChain = new Map(live.map((f) => [f.chain, f]));
          return prev.map((f) => byChain.get(f.chain) ?? f);
        });
        setGasLive(true);
        setGasCached(false);
        saveCache('web3hub-cache-gas', live);
        setLastUpdated(new Date());
      } catch {
        // Rate-limit / offline: serve the cached rows (10 min TTL).
        const cached = loadCache<GasFee[]>('web3hub-cache-gas', 10 * 60 * 1000);
        if (cached && cached.length > 0 && !cancelled) {
          setGas((prev) => {
            const byChain = new Map(cached.map((f) => [f.chain, f]));
            return prev.map((f) => byChain.get(f.chain) ?? f);
          });
          setGasLive(true);
          setGasCached(true);
          setLastUpdated(new Date());
        }
        // otherwise keep seed gas rows
      }
    }

    async function refreshYields(): Promise<void> {
      try {
        const y = await fetchLiveYields();
        if (cancelled || y.length === 0) return;
        setYields(y);
        setYieldsLive(true);
        setLastUpdated(new Date());
      } catch {
        // keep seed pools
      }
    }

    async function refreshApprovals(): Promise<void> {
      if (!wallet) return;
      try {
        const a = await fetchLiveApprovals(wallet);
        if (cancelled) return;
        setApprovals(a);
        setApprovalsLive(true);
        setLastUpdated(new Date());
      } catch {
        // RPC unreachable — empty list, never seed rows.
        if (!cancelled) setApprovals([]);
      }
    }

    async function refreshBalances(): Promise<void> {
      if (!wallet) return;
      try {
        const b = await fetchNativeBalances(wallet);
        if (cancelled) return;
        setNativeBalances(b);
        setLastUpdated(new Date());
      } catch {
        // keep previous balances
      }
    }

    async function refreshTokenBalances(): Promise<void> {
      if (!wallet) return;
      try {
        const b = await fetchTokenBalances(wallet);
        if (cancelled) return;
        setTokenBalances(b);
        setLastUpdated(new Date());
      } catch {
        // keep previous balances
      }
    }

    every(refreshPrices, 30000);
    every(refreshGas, 15000);
    every(refreshYields, 300000);
    every(refreshApprovals, 60000);
    every(refreshBalances, 60000);
    every(refreshTokenBalances, 60000);

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearInterval(t));
    };
  }, [wallet]);

  return {
    prices,
    changes,
    gas,
    gasLive,
    yields,
    yieldsLive,
    approvals,
    approvalsLive,
    nativeBalances,
    tokenBalances,
    lastUpdated,
    live: prices !== null || gasLive || yieldsLive || approvalsLive,
    pricesCached,
    gasCached,
  };
}
