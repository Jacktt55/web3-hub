import { useEffect, useRef, useState } from 'react';
import { GAS_FEES, NFTS, TOKEN_APPROVALS, YIELD_POOLS } from '../data';
import type { Address, GasFee, TokenApproval, YieldPool } from '../types';
import {
  fetchAugentStatus,
  fetchLiveApprovals,
  fetchLiveGas,
  fetchLivePrices,
  fetchLiveYields,
  resolveNftImage,
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
  /** Resolved real artwork, keyed by NFT id. */
  nftImages: Record<string, string>;
  augentPhase: number | null;
  augentClaimable: bigint | null;
  lastUpdated: Date | null;
  /** True when at least one live source has answered. */
  live: boolean;
}

/**
 * Polls every live source on its own cadence:
 * prices 30s · gas 15s · yields 5m · approvals 60s · AUGENT 60s ·
 * NFT artwork once on mount. Any failure keeps the previous value
 * (or the seed) — the app never goes blank.
 */
export function useLiveData(wallet: Address): LiveData {
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
  const [nftImages, setNftImages] = useState<Record<string, string>>({});
  const [augentPhase, setAugentPhase] = useState<number | null>(null);
  const [augentClaimable, setAugentClaimable] = useState<bigint | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
    setAugentPhase(null);
    setAugentClaimable(null);

    async function refreshPrices(): Promise<void> {
      try {
        const p = await fetchLivePrices();
        if (cancelled) return;
        pricesRef.current = p;
        setPrices(p.prices);
        setChanges(p.changes);
        setLastUpdated(new Date());
      } catch {
        // keep previous prices / seed
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
        setLastUpdated(new Date());
      } catch {
        // keep seed gas rows
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
      try {
        const a = await fetchLiveApprovals(wallet);
        if (cancelled) return;
        setApprovals(a);
        setApprovalsLive(true);
        setLastUpdated(new Date());
      } catch {
        // RPC unreachable — fall back to the seed list, labelled Seed.
        if (!cancelled) setApprovals([...TOKEN_APPROVALS]);
      }
    }

    async function refreshAugent(): Promise<void> {
      const s = await fetchAugentStatus(wallet);
      if (cancelled || !s) return;
      setAugentPhase(s.phase);
      setAugentClaimable(s.claimable);
      setLastUpdated(new Date());
    }

    async function refreshNftImages(): Promise<void> {
      for (const nft of NFTS) {
        if (cancelled) return;
        const img = await resolveNftImage(nft);
        if (cancelled) return;
        if (img) setNftImages((prev) => ({ ...prev, [nft.id]: img }));
      }
    }

    every(refreshPrices, 30000);
    every(refreshGas, 15000);
    every(refreshYields, 300000);
    every(refreshApprovals, 60000);
    every(refreshAugent, 60000);
    void refreshNftImages();

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
    nftImages,
    augentPhase,
    augentClaimable,
    lastUpdated,
    live: prices !== null || gasLive || yieldsLive || approvalsLive,
  };
}
