import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Percent,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useAccount,
  useDisconnect,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { erc20Abi } from 'viem';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import DetailDrawer from './components/layout/DetailDrawer';
import Toast from './components/layout/Toast';
import type { ToastData } from './components/layout/Toast';
import TxPreviewModal from './components/layout/TxPreviewModal';
import WalletModal from './components/layout/WalletModal';
import Badge from './components/ui/Badge';
import CopyAddressButton from './components/ui/CopyAddressButton';
import SkeletonRow from './components/ui/SkeletonRow';
import Tooltip from './components/ui/Tooltip';
import PortfolioTable, {
  type PortfolioRow,
} from './features/crypto/PortfolioTable';
import GasTracker from './features/crypto/GasTracker';
import YieldGrid, { poolAuditBadge } from './features/crypto/YieldGrid';
import NftGrid from './features/nft/NftGrid';
import NftLookup from './features/nft/NftLookup';
import MintPassCard from './features/nft/MintPassCard';
import ContractScanner from './features/security/ContractScanner';
import ApprovalList from './features/security/ApprovalList';
import ActivityLog from './features/activity/ActivityLog';
import { useLiveData } from './hooks/useLiveData';
import { CHAINS, DEMO_NFTS, MINT_PASSES, bestApy, chainInfo } from './data';
import {
  formatCompact,
  formatPct,
  formatUnits,
  formatUsd,
  isAddress,
  shortenAddress,
} from './lib/format';
import { findWatch, prepareRevokeTx } from './lib/live';
import { CHAIN_ID_NUMBERS } from './lib/rpc';
import { chainIdToName } from './lib/wagmi';
import type { TxSendState } from './components/layout/TxPreviewModal';
import { generativeArt } from './lib/generativeArt';
import { getViewMeta } from './lib/router';
import type {
  Address,
  AlchemyTokenBalance,
  ChainId,
  DemoNft,
  MintPass,
  PreparedTx,
  TokenApproval,
  View,
  YieldPool,
} from './types';

const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  USDT: 'Tether',
  ARB: 'Arbitrum',
};

const APY_INFO =
  'APY (Annual Percentage Yield) = perkiraan hasil setahun kalau dana disimpan di pool, sudah termasuk bunga berbunga. Bukan jaminan — APY bisa berubah sewaktu-waktu.';

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  /** Plain-language "?" explanation shown next to the label. */
  info?: string;
}

function KpiCard({ label, value, sub, icon: Icon, info }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line/80">
      <p className="flex items-center gap-2 text-xs font-medium text-muted">
        <Icon className="h-4 w-4 text-accent-2" />
        {label}
        {info && (
          <Tooltip text={info}>
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-line bg-surface-2 text-[10px] font-bold text-muted hover:border-accent hover:text-white">
              ?
            </span>
          </Tooltip>
        )}
      </p>
      <p className="mt-2.5 truncate font-mono text-base font-bold tabular-nums text-white sm:text-xl xl:text-2xl">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{sub}</p>
    </div>
  );
}

type DrawerState =
  | { kind: 'token'; row: PortfolioRow }
  | { kind: 'pool'; pool: YieldPool }
  | { kind: 'nft'; nft: DemoNft }
  | null;

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [pendingTx, setPendingTx] = useState<PreparedTx | null>(null);
  /** Revoke target (token contract + spender + chain) for the real send. */
  const [revokeTarget, setRevokeTarget] = useState<{
    tokenAddress: Address;
    spenderAddress: Address;
    chain: ChainId;
    token: string;
    spender: string;
  } | null>(null);
  const [revokeSend, setRevokeSend] = useState<TxSendState>({
    status: 'idle',
  });
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [cryptoTab, setCryptoTab] = useState<'portfolio' | 'yields'>(
    'portfolio',
  );
  const [nftTab, setNftTab] = useState<'collection' | 'mint'>(
    'collection',
  );
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [tokenSimAmount, setTokenSimAmount] = useState('1');
  const [poolSimAmount, setPoolSimAmount] = useState('1000');
  const [poolSimMonths, setPoolSimMonths] = useState(12);
  /**
   * Active wallet — the VISITOR's own address, saved in this browser
   * only. Null = no wallet entered yet. The app has no default wallet
   * and no personal data: it is a public tool.
   */
  const [wallet, setWallet] = useState<Address | null>(() => {
    const saved =
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem('web3hub-wallet');
    return isAddress(saved) ? (saved as Address) : null;
  });

  /** Real connected wallet (wagmi) — takes precedence over manual. */
  const {
    address: wagmiAddress,
    chainId: wagmiChainId,
    isConnected,
  } = useAccount();
  const { disconnect } = useDisconnect();
  const activeWallet: Address | null =
    (wagmiAddress as Address | undefined) ?? wallet;

  const live = useLiveData(activeWallet, {
    connected: isConnected,
    chainId: wagmiChainId,
  });
  const lastConnectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isConnected && wagmiAddress && lastConnectedRef.current !== wagmiAddress) {
      lastConnectedRef.current = wagmiAddress;
      showToast(
        `Wallet terhubung: ${shortenAddress(wagmiAddress)}${wagmiChainId ? ` · ${chainIdToName(wagmiChainId) ?? `chain ${wagmiChainId}`}` : ''}.`,
        'success',
      );
    }
    if (!isConnected) lastConnectedRef.current = null;
  }, [isConnected, wagmiAddress, wagmiChainId]);

  /**
   * Real revoke send (wagmi/viem writeContract). The visitor already
   * saw the full preview in TxPreviewModal; their wallet still asks
   * for the final signature. Only runs when a real wallet is
   * connected — demo mode stays preview-only.
   */
  const {
    writeContract,
    data: revokeHash,
    isPending: isRevokePending,
    error: revokeWriteError,
  } = useWriteContract();
  const { isLoading: isRevokeConfirming, isSuccess: isRevokeConfirmed } =
    useWaitForTransactionReceipt({ hash: revokeHash });

  useEffect(() => {
    if (isRevokePending) {
      setRevokeSend({ status: 'pending' });
    } else if (isRevokeConfirming && revokeHash) {
      setRevokeSend({ status: 'confirming', hash: revokeHash });
    }
  }, [isRevokePending, isRevokeConfirming, revokeHash]);

  useEffect(() => {
    if (isRevokeConfirmed && revokeHash) {
      setRevokeSend({ status: 'success', hash: revokeHash });
      showToast(
        `Revoke terkirim: ${revokeHash.slice(0, 10)}…${revokeHash.slice(-8)}.`,
        'success',
      );
      live.refreshApprovals();
      window.setTimeout(() => setPendingTx(null), 2500);
    }
  }, [isRevokeConfirmed, revokeHash]);

  useEffect(() => {
    if (revokeWriteError) {
      const msg =
        revokeWriteError.message.includes('User rejected') ||
        revokeWriteError.message.includes('denied')
          ? 'Transaksi dibatalkan di wallet.'
          : 'Gagal mengirim transaksi — periksa chain dan saldo gas.';
      setRevokeSend({ status: 'error', error: msg });
      showToast(msg);
    }
  }, [revokeWriteError]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /** 800ms skeleton transition when switching tabs or hitting Refresh. */
  useEffect(() => {
    setTabLoading(true);
    const t = window.setTimeout(() => setTabLoading(false), 800);
    return () => window.clearTimeout(t);
  }, [cryptoTab, refreshKey]);

  function showToast(message: string, kind: ToastData['kind'] = 'info'): void {
    setToast({ id: Date.now(), message, kind });
  }

  /** Merged portfolio rows: native balances + ERC-20 watchlist balances. */
  const portfolioRows = useMemo<PortfolioRow[]>(() => {
    if (!activeWallet) return [];
    const rows: PortfolioRow[] = [];
    for (const b of live.nativeBalances ?? []) {
      const chain = chainInfo(b.chain);
      const symbol = chain.nativeSymbol;
      rows.push({
        id: `native-${b.chain}`,
        symbol,
        name: `${chain.name} (native)`,
        chain: b.chain,
        balance: Number(formatUnits(b.balance, 18)),
        priceUsd: live.prices?.[symbol],
        change24h: live.changes?.[symbol],
      });
    }
    for (const t of live.tokenBalances ?? []) {
      const isStable = t.token === 'USDT' || t.token === 'USDC';
      const priceSymbol = t.token === 'WETH' ? 'ETH' : t.token;
      rows.push({
        id: `token-${t.token}-${t.chain}`,
        symbol: t.token,
        name:
          t.token === 'WETH'
            ? 'Wrapped Ether'
            : t.token === 'USDT'
              ? 'Tether'
              : t.token === 'USDC'
                ? 'USD Coin'
                : t.token,
        chain: t.chain,
        balance: Number(formatUnits(t.balance, t.decimals)),
        priceUsd: isStable
          ? (live.prices?.USDT ?? 1)
          : live.prices?.[priceSymbol],
        change24h: isStable
          ? (live.changes?.USDT ?? 0)
          : live.changes?.[priceSymbol],
        contract: t.tokenAddress as Address,
      });
    }
    // Real Alchemy balances (connected wallet + key only): overlay the
    // watchlist rows by contract, keep only tokens with a known price.
    const seenContracts = new Set(
      rows
        .map((r) => r.contract?.toLowerCase())
        .filter((c): c is string => Boolean(c)),
    );
    const alchemyRows = (live.alchemyTokens ?? [])
      .map((t) => {
        const priceUsd = live.prices?.[t.symbol.toUpperCase()];
        return { t, priceUsd };
      })
      .filter(
        (x): x is { t: AlchemyTokenBalance; priceUsd: number } =>
          x.priceUsd !== undefined &&
          !seenContracts.has(x.t.contractAddress.toLowerCase()),
      )
      .map(({ t, priceUsd }) => ({
        id: `alchemy-${t.contractAddress.toLowerCase()}`,
        symbol: t.symbol,
        name: t.name,
        chain: (t.chainId === 1
          ? 'ethereum'
          : t.chainId === 8453
            ? 'base'
            : t.chainId === 42161
              ? 'arbitrum'
              : t.chainId === 137
                ? 'polygon'
                : 'bsc') as ChainId,
        balance: Number(formatUnits(t.balance, t.decimals)),
        priceUsd,
        change24h: live.changes?.[t.symbol.toUpperCase()],
        contract: t.contractAddress as Address,
      }))
      .sort((a, b) => b.balance * (b.priceUsd ?? 0) - a.balance * (a.priceUsd ?? 0))
      .slice(0, 12);
    rows.push(...alchemyRows);
    return rows;
  }, [
    activeWallet,
    live.nativeBalances,
    live.tokenBalances,
    live.alchemyTokens,
    live.prices,
    live.changes,
  ]);

  /** Null while the first wallet read is still pending. */
  const tableRows =
    activeWallet === null
      ? []
      : live.nativeBalances === null && live.tokenBalances === null
        ? null
        : portfolioRows;

  const portfolioStats = useMemo(() => {
    const valued = portfolioRows.filter(
      (r) => r.priceUsd !== undefined && r.change24h !== undefined,
    );
    const total = portfolioRows.reduce(
      (s, r) => s + (r.priceUsd !== undefined ? r.balance * r.priceUsd : 0),
      0,
    );
    const denom = valued.reduce(
      (s, r) => s + r.balance * (r.priceUsd ?? 0),
      0,
    );
    const weighted = valued.reduce(
      (s, r) => s + r.balance * (r.priceUsd ?? 0) * (r.change24h ?? 0),
      0,
    );
    return {
      total,
      changePct: denom > 0 ? weighted / denom : undefined,
      changeUsd: weighted / 100,
      assetCount: portfolioRows.length,
      chainCount: new Set(portfolioRows.map((r) => r.chain)).size,
      hasPrice: portfolioRows.some((r) => r.priceUsd !== undefined),
    };
  }, [portfolioRows]);

  const bestPool = useMemo(() => bestApy(live.yields), [live.yields]);

  /** Health score from live approvals: 100 minus penalties. */
  const securityScore = useMemo(() => {
    if (!activeWallet || !live.approvalsLive || live.approvals === null) {
      return null;
    }
    let score = 100;
    for (const a of live.approvals) {
      if (a.allowance === 'Unlimited') score -= 20;
      if (a.risk === 'medium') score -= 10;
      if (a.risk === 'high' || a.risk === 'critical') score -= 25;
    }
    return Math.max(0, score);
  }, [activeWallet, live.approvals, live.approvalsLive]);

  const riskyApprovals = useMemo(
    () =>
      (live.approvals ?? []).filter(
        (a) =>
          a.risk === 'medium' || a.risk === 'high' || a.risk === 'critical',
      ).length,
    [live.approvals],
  );

  function handleApplyWallet(address: Address): void {
    setWallet(address);
    window.localStorage.setItem('web3hub-wallet', address);
    setWalletModalOpen(false);
    showToast(
      `Wallet aktif: ${address.slice(0, 6)}…${address.slice(-4)}.`,
      'success',
    );
  }

  function handleDisconnectWallet(): void {
    if (isConnected) disconnect();
    setWallet(null);
    window.localStorage.removeItem('web3hub-wallet');
    setWalletModalOpen(false);
    showToast('Wallet diputuskan.');
  }

  async function handleRevokeRequest(
    approval: TokenApproval,
  ): Promise<void> {
    if (!activeWallet) {
      showToast('Masukkan alamat wallet dulu.');
      return;
    }
    const watch = findWatch(approval.token, approval.spender);
    if (!watch) {
      showToast('Approval ini tidak ada di watchlist live.');
      return;
    }
    try {
      const nativePrice =
        live.prices?.[watch.chain === 'bsc' ? 'BNB' : 'ETH'] ?? 0;
      const tx = await prepareRevokeTx(watch, nativePrice, activeWallet);
      setRevokeTarget({
        tokenAddress: watch.tokenAddress as Address,
        spenderAddress: watch.spenderAddress as Address,
        chain: watch.chain,
        token: approval.token,
        spender: approval.spender,
      });
      setRevokeSend({ status: 'idle' });
      setPendingTx(tx);
      showToast(
        `Preview revoke ${approval.token} → ${approval.spender} disiapkan — cek modal untuk detail.`,
      );
    } catch {
      showToast('Gagal menyiapkan preview revoke — RPC tidak menjawab.');
    }
  }

  /** Sends the real approve(spender, 0) from the connected wallet. */
  function handleSendRevoke(): void {
    if (!revokeTarget || !isConnected) return;
    const neededChain = CHAIN_ID_NUMBERS[revokeTarget.chain];
    if (wagmiChainId !== neededChain) {
      showToast(
        `Ganti network wallet ke ${chainInfo(revokeTarget.chain).name} dulu (saat ini ${chainIdToName(wagmiChainId) ?? 'unknown'}).`,
      );
      return;
    }
    setRevokeSend({ status: 'pending' });
    writeContract({
      address: revokeTarget.tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [revokeTarget.spenderAddress, 0n],
      chainId: neededChain,
    });
  }

  function handleMintPreview(pass: MintPass): void {
    showToast(
      `“${pass.title}” adalah pass contoh (demo) — belum ada kontrak live untuk mint ini.`,
    );
  }

  function openTokenDrawer(row: PortfolioRow): void {
    setTokenSimAmount('1');
    setDrawer({ kind: 'token', row });
  }

  function openPoolDrawer(pool: YieldPool): void {
    setPoolSimAmount('1000');
    setPoolSimMonths(12);
    setDrawer({ kind: 'pool', pool });
  }

  function openNftDrawer(nft: DemoNft): void {
    setDrawer({ kind: 'nft', nft });
  }

  const meta = getViewMeta(view);
  const q = query.trim();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        view={view}
        onNavigate={setView}
        walletAddress={activeWallet}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSecondary={(label) => showToast(`${label} — segera hadir.`)}
        onWalletClick={() => setWalletModalOpen(true)}
      />

      <div className="lg:pl-60">
        <Topbar
          view={view}
          query={query}
          onQueryChange={setQuery}
          gasFees={live.gas}
          wallet={activeWallet}
          chainName={chainIdToName(wagmiChainId)}
          onWalletClick={() => setWalletModalOpen(true)}
          onRefresh={() => {
            setRefreshKey((k) => k + 1);
            showToast(
              'Menyegarkan tampilan — data live menyusul otomatis (harga 30 dtk, gas 15 dtk).',
            );
          }}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="mx-auto max-w-[1440px] px-4 pb-14 pt-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {meta.label}
            </h1>
            <p className="mt-1 text-sm text-muted">{meta.description}</p>
            <p className="mt-2 flex items-center gap-2 text-xs font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  live.live ? 'bg-profit' : 'bg-amber'
                }`}
              />
              {live.live
                ? `LIVE · terakhir diperbarui ${live.lastUpdated?.toLocaleTimeString('en-GB') ?? '—'}`
                : live.pricesCached || live.gasCached
                  ? 'CACHE · data tersimpan dipakai (rate-limit / offline)'
                  : 'SNAPSHOT — menunggu data live pertama…'}
            </p>
          </header>

          {view === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <KpiCard
                  label="Total Net Worth"
                  value={
                    activeWallet === null
                      ? '—'
                      : portfolioStats.hasPrice
                        ? formatUsd(portfolioStats.total)
                        : '—'
                  }
                  sub={
                    activeWallet === null
                      ? 'Masukkan wallet untuk melihat nilai'
                      : `${portfolioStats.assetCount} aset · ${portfolioStats.chainCount} chain`
                  }
                  icon={Wallet}
                />
                <KpiCard
                  label="24h Portfolio Change"
                  value={
                    portfolioStats.changePct !== undefined
                      ? formatPct(portfolioStats.changePct)
                      : '—'
                  }
                  sub={
                    portfolioStats.changePct !== undefined
                      ? `≈ ${formatUsd(portfolioStats.changeUsd)} dalam 24j`
                      : 'Masukkan wallet untuk melihat perubahan'
                  }
                  icon={TrendingUp}
                />
                <KpiCard
                  label="Estimated Annual Yield (APY)"
                  value={bestPool ? `${bestPool.apy.toFixed(1)}%` : '—'}
                  sub={
                    bestPool
                      ? `Pool terbaik · ${bestPool.protocol} · ${bestPool.pair}`
                      : 'Tidak ada pool'
                  }
                  icon={Percent}
                  info={APY_INFO}
                />
                <KpiCard
                  label="Security Health Score"
                  value={
                    securityScore !== null ? `${securityScore}/100` : '—'
                  }
                  sub={
                    securityScore === null
                      ? 'Masukkan wallet untuk skor'
                      : securityScore >= 80
                        ? 'Baik — approval terpantau bersih'
                        : securityScore >= 50
                          ? 'Cukup — ada approval berisiko'
                          : 'Perlu perhatian — banyak approval berisiko'
                  }
                  icon={ShieldCheck}
                />
              </div>

              <div className="grid items-start gap-5 xl:grid-cols-[1.55fr_1fr]">
                <GasTracker
                  fees={live.gas}
                  live={live.gasLive}
                  cached={live.gasCached}
                  query={q}
                />
                <section className="rounded-2xl border border-line bg-surface p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      Harga Live
                    </h2>
                    {live.prices ? (
                      live.pricesCached ? (
                        <Badge variant="amber">Cache · DefiLlama</Badge>
                      ) : (
                        <Badge variant="green">DefiLlama</Badge>
                      )
                    ) : (
                      <Badge variant="blue">Menunggu…</Badge>
                    )}
                  </div>
                  {live.prices ? (
                    <ul className="space-y-2.5">
                      {(
                        ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'ARB'] as const
                      )
                        .filter((s) => live.prices?.[s] !== undefined)
                        .map((s) => {
                          const change = live.changes?.[s];
                          return (
                            <li
                              key={s}
                              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3"
                            >
                              <span className="text-sm font-semibold text-white">
                                {s}{' '}
                                <span className="text-xs font-normal text-muted">
                                  {COIN_NAMES[s]}
                                </span>
                              </span>
                              <span className="text-right">
                                <span className="block font-mono font-semibold tabular-nums text-white">
                                  {formatUsd(live.prices?.[s] ?? 0)}
                                </span>
                                <span
                                  className={`block font-mono text-xs tabular-nums ${
                                    change === undefined
                                      ? 'text-muted'
                                      : change >= 0
                                        ? 'text-profit'
                                        : 'text-loss'
                                  }`}
                                >
                                  {change !== undefined
                                    ? `24j ${formatPct(change)}`
                                    : '—'}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">
                      Menunggu data DefiLlama…
                    </p>
                  )}
                </section>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6">
                <h2 className="mb-1 text-lg font-bold text-white">
                  Peringatan Keamanan
                </h2>
                <p className="text-sm text-muted">
                  {wallet === null
                    ? 'Masukkan alamat wallet kamu di Security Scanner untuk memeriksa approval berisiko.'
                    : riskyApprovals === 0
                      ? 'Tidak ada approval berisiko dari watchlist token × spender untuk wallet ini.'
                      : `${riskyApprovals} approval berisiko di wallet ini — periksa di Security Scanner.`}
                </p>
              </div>
            </div>
          )}

          {view === 'crypto' && (
            <div className="space-y-5">
              <div
                className="flex gap-2"
                role="tablist"
                aria-label="Crypto workspace"
              >
                <button
                  role="tab"
                  aria-selected={cryptoTab === 'portfolio'}
                  onClick={() => setCryptoTab('portfolio')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    cryptoTab === 'portfolio'
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'border border-line bg-surface text-slate-300 hover:text-white'
                  }`}
                >
                  Token Portfolio
                </button>
                <button
                  role="tab"
                  aria-selected={cryptoTab === 'yields'}
                  onClick={() => setCryptoTab('yields')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    cryptoTab === 'yields'
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'border border-line bg-surface text-slate-300 hover:text-white'
                  }`}
                >
                  DeFi Yield &amp; Risk
                </button>
              </div>

              {tabLoading ? (
                <section className="rounded-2xl border border-line bg-surface p-6">
                  <div className="space-y-2.5">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <p className="pt-1 text-center text-xs text-muted">
                      Memuat…
                    </p>
                  </div>
                </section>
              ) : cryptoTab === 'portfolio' ? (
                <PortfolioTable
                  wallet={activeWallet}
                  rows={tableRows}
                  query={q}
                  live={live.prices !== null}
                  onSelect={openTokenDrawer}
                  onConnect={() => setWalletModalOpen(true)}
                />
              ) : (
                <YieldGrid
                  pools={live.yields}
                  live={live.yieldsLive}
                  query={q}
                  onSelect={openPoolDrawer}
                />
              )}

              <GasTracker
                fees={live.gas}
                live={live.gasLive}
                cached={live.gasCached}
                query={q}
              />
            </div>
          )}

          {view === 'nft' && (
            <div className="space-y-5">
              <div
                className="flex gap-2"
                role="tablist"
                aria-label="NFT Hub"
              >
                <button
                  role="tab"
                  aria-selected={nftTab === 'collection'}
                  onClick={() => setNftTab('collection')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    nftTab === 'collection'
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'border border-line bg-surface text-slate-300 hover:text-white'
                  }`}
                >
                  My Collection
                </button>
                <button
                  role="tab"
                  aria-selected={nftTab === 'mint'}
                  onClick={() => setNftTab('mint')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    nftTab === 'mint'
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'border border-line bg-surface text-slate-300 hover:text-white'
                  }`}
                >
                  Event &amp; Utility Mint
                </button>
              </div>

              {nftTab === 'collection' ? (
                <>
                  <section>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-bold text-white">
                        My Collection
                      </h2>
                      {live.alchemyNfts !== null ? (
                        <Badge variant="green">
                          NFT asli · Alchemy (
                          {chainIdToName(wagmiChainId) ?? 'Ethereum'})
                        </Badge>
                      ) : (
                        <Badge variant="blue">
                          Koleksi contoh (demo) — bukan NFT asli
                        </Badge>
                      )}
                    </div>
                    {live.alchemyNftsLoading ? (
                      <div className="space-y-2.5">
                        <SkeletonRow />
                        <SkeletonRow />
                        <p className="pt-1 text-center text-xs text-muted">
                          Memuat NFT asli dari Alchemy…
                        </p>
                      </div>
                    ) : live.alchemyNfts !== null ? (
                      live.alchemyNfts.length === 0 ? (
                        <div className="rounded-xl border border-line bg-surface p-6 text-center">
                          <p className="text-sm font-semibold text-white">
                            Tidak ada NFT di wallet ini (
                            {chainIdToName(wagmiChainId) ?? 'chain ini'}).
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            NFT di chain lain tidak terbaca dari chain yang
                            aktif — ganti network di Connect Wallet.
                          </p>
                        </div>
                      ) : (
                        <NftGrid
                          items={live.alchemyNfts.map((n) => ({
                            id: `alchemy-${n.contractAddress.toLowerCase()}-${n.tokenId}`,
                            title: n.title,
                            collection: n.collection,
                            floorEth: null,
                            tokenId: n.tokenId,
                            rarityRank: 0,
                            rarityTotal: 0,
                            traits: n.traits,
                            source: 'alchemy' as const,
                            artwork: n.imageUrl ?? undefined,
                          }))}
                          onSelect={openNftDrawer}
                        />
                      )
                    ) : (
                      <NftGrid items={DEMO_NFTS} onSelect={openNftDrawer} />
                    )}
                    <p className="mt-3 text-xs text-muted">
                      {live.alchemyNfts !== null
                        ? 'NFT asli wallet yang terhubung, dibaca lewat Alchemy (chain aktif). Klik kartu untuk traits dan token ID.'
                        : 'Koleksi di atas adalah contoh dengan artwork SVG generatif — klik kartu untuk traits, rarity rank, dan token ID. Hubungkan wallet untuk melihat NFT asli kamu, atau cek lewat "Cek NFT" di bawah.'}
                    </p>
                  </section>
                  <NftLookup />
                </>
              ) : (
                <section>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-white">
                      Event &amp; Utility Mint
                    </h2>
                    <Badge variant="blue">
                      Simulasi — bukan mint asli
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {MINT_PASSES.map((p) => (
                      <MintPassCard
                        key={p.id}
                        pass={p}
                        onPreview={handleMintPreview}
                        onMinted={(pass) =>
                          showToast(
                            `Simulasi mint berhasil — 1 “${pass.title}” dicetak (demo, bukan NFT asli).`,
                            'success',
                          )
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Tombol "Mint (Simulasi)" hanya menambah penghitung lokal
                    dan progress bar — tidak ada kontrak, tidak ada transaksi.
                  </p>
                </section>
              )}
            </div>
          )}

          {view === 'security' && (
            <div className="grid items-start gap-5 xl:grid-cols-2">
              <ContractScanner />
              {activeWallet ? (
                <ApprovalList
                  approvals={live.approvals}
                  approvalsLive={live.approvalsLive}
                  onRevokeRequest={(a) => void handleRevokeRequest(a)}
                />
              ) : (
                <section className="rounded-2xl border border-line bg-surface p-6 text-center">
                  <h2 className="text-lg font-bold text-white">
                    Approval Checker
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                    Masukkan alamat wallet kamu untuk memeriksa approval token
                    ke spender — dibaca langsung dari chain.
                  </p>
                  <button
                    onClick={() => setWalletModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </button>
                </section>
              )}
            </div>
          )}

          {view === 'activity' && (
            <div className="space-y-5">
              <ActivityLog />
              <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="mb-1 text-lg font-bold text-white">
                Riwayat di Explorer
              </h2>
              <p className="mb-4 text-sm text-muted">
                TrashGod Vault tidak menyimpan riwayat transaksi — riwayat lengkap
                alamat ini ada di explorer tiap chain.
              </p>
              {activeWallet ? (
                <ul className="space-y-2.5">
                  {CHAINS.filter((c) =>
                    ['ethereum', 'bsc', 'base', 'arbitrum', 'polygon'].includes(
                      c.id,
                    ),
                  ).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        <i
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                      <a
                        href={`${c.explorer}/address/${activeWallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        Lihat di {new URL(c.explorer).hostname} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted">
                    Masukkan alamat wallet untuk melihat tautan explorer-nya.
                  </p>
                  <button
                    onClick={() => setWalletModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </button>
                </div>
              )}
            </section>
            </div>
          )}
        </main>
      </div>

      <WalletModal
        open={walletModalOpen}
        current={activeWallet}
        onClose={() => setWalletModalOpen(false)}
        onApply={handleApplyWallet}
        onDisconnect={handleDisconnectWallet}
      />

      <TxPreviewModal
        tx={pendingTx}
        canSend={isConnected}
        sendState={revokeSend}
        onSend={handleSendRevoke}
        onClose={() => {
          setPendingTx(null);
          setRevokeTarget(null);
          setRevokeSend({ status: 'idle' });
        }}
        onCopied={() =>
          showToast(
            'Ringkasan disalin — eksekusi dari wallet kamu sendiri.',
            'success',
          )
        }
      />

      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={
          drawer?.kind === 'token'
            ? `${drawer.row.symbol} — ${drawer.row.name}`
            : drawer?.kind === 'pool'
              ? `${drawer.pool.protocol} — ${drawer.pool.pair}`
              : drawer?.kind === 'nft'
                ? drawer.nft.source === 'alchemy'
                  ? `${drawer.nft.title} (NFT asli)`
                  : `${drawer.nft.title} (Demo)`
                : 'Detail'
        }
      >
        {drawer?.kind === 'token' && (
          <div className="space-y-4 text-sm">
            <dl className="space-y-2.5">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Chain</dt>
                <dd className="font-medium text-white">
                  {chainInfo(drawer.row.chain).name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Kontrak</dt>
                <dd>
                  {drawer.row.contract ? (
                    <CopyAddressButton address={drawer.row.contract} />
                  ) : (
                    <span className="text-slate-300">
                      Native token — tidak ada alamat kontrak
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Saldo</dt>
                <dd className="font-mono tabular-nums text-white">
                  {drawer.row.balance.toLocaleString('en-US', {
                    maximumFractionDigits: 6,
                  })}{' '}
                  {drawer.row.symbol}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Harga</dt>
                <dd className="font-mono tabular-nums text-white">
                  {drawer.row.priceUsd !== undefined
                    ? formatUsd(drawer.row.priceUsd)
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Nilai</dt>
                <dd className="font-mono tabular-nums text-white">
                  {drawer.row.priceUsd !== undefined
                    ? formatUsd(drawer.row.balance * drawer.row.priceUsd)
                    : '—'}
                </dd>
              </div>
            </dl>
            {drawer.row.contract && (
              <a
                href={`${chainInfo(drawer.row.chain).explorer}/token/${drawer.row.contract}`}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-xs font-semibold text-accent hover:underline"
              >
                Lihat kontrak di explorer ↗
              </a>
            )}
            <div className="rounded-xl border border-line bg-bg p-3.5">
              <label
                htmlFor="drawer-swap-amount"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted"
              >
                Simulasi swap (bukan transaksi)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="drawer-swap-amount"
                  value={tokenSimAmount}
                  onChange={(e) =>
                    setTokenSimAmount(e.target.value.replace(/[^0-9.]/g, ''))
                  }
                  inputMode="decimal"
                  aria-label={`Jumlah ${drawer.row.symbol}`}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink focus:border-accent focus:outline-none"
                />
                <span className="font-mono text-sm text-muted">
                  {drawer.row.symbol}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs tabular-nums text-slate-300">
                ≈{' '}
                {drawer.row.priceUsd !== undefined &&
                Number.parseFloat(tokenSimAmount) > 0
                  ? formatUsd(
                      Number.parseFloat(tokenSimAmount) *
                        drawer.row.priceUsd,
                    )
                  : '—'}{' '}
                USD
              </p>
            </div>
          </div>
        )}

        {drawer?.kind === 'pool' && (
          <div className="space-y-4 text-sm">
            <dl className="space-y-2.5">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Chain</dt>
                <dd className="font-medium text-white">
                  {chainInfo(drawer.pool.chain).name}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">APY</dt>
                <dd className="font-mono font-bold tabular-nums text-profit">
                  {drawer.pool.apy.toFixed(1)}%
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">TVL</dt>
                <dd className="font-mono tabular-nums text-white">
                  ${formatCompact(drawer.pool.tvlUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Risiko</dt>
                <dd className="font-medium capitalize text-white">
                  {drawer.pool.risk}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Kategori</dt>
                <dd className="font-medium capitalize text-white">
                  {drawer.pool.category}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Audit</dt>
                <dd>
                  <Badge variant={poolAuditBadge(drawer.pool).variant}>
                    {poolAuditBadge(drawer.pool).label}
                  </Badge>
                </dd>
              </div>
            </dl>
            <p className="leading-relaxed text-slate-300">
              Ringkasan audit: badge di atas adalah gabungan daftar protokol
              utama beraudit + skor risiko turunan APY — bukan laporan audit
              lengkap. APY tinggi biasanya berarti risiko lebih tinggi.
              Selalu cek audit resmi protokol sebelum deposit.
            </p>
            <div className="rounded-xl border border-line bg-bg p-3.5">
              <label
                htmlFor="drawer-deposit-amount"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted"
              >
                Simulasi stake (bukan transaksi)
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted">$</span>
                <input
                  id="drawer-deposit-amount"
                  value={poolSimAmount}
                  onChange={(e) =>
                    setPoolSimAmount(e.target.value.replace(/[^0-9.]/g, ''))
                  }
                  inputMode="decimal"
                  aria-label="Jumlah deposit dalam USD"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink focus:border-accent focus:outline-none"
                />
                <select
                  value={poolSimMonths}
                  onChange={(e) =>
                    setPoolSimMonths(Number.parseInt(e.target.value, 10))
                  }
                  aria-label="Durasi simulasi"
                  className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  <option value={1}>1 bulan</option>
                  <option value={3}>3 bulan</option>
                  <option value={6}>6 bulan</option>
                  <option value={12}>1 tahun</option>
                </select>
              </div>
              <p className="mt-2 font-mono text-xs tabular-nums text-slate-300">
                Estimasi hasil:{' '}
                {Number.parseFloat(poolSimAmount) > 0 ? (
                  <b className="text-profit">
                    $
                    {(
                      (Number.parseFloat(poolSimAmount) *
                        drawer.pool.apy) /
                      100 *
                      (poolSimMonths / 12)
                    ).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </b>
                ) : (
                  '—'
                )}{' '}
                · APY bisa berubah
              </p>
            </div>
          </div>
        )}

        {drawer?.kind === 'nft' && (
          <div className="space-y-4 text-sm">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface-2">
              <img
                src={drawer.nft.artwork ?? generativeArt(drawer.nft.id)}
                alt={drawer.nft.title}
                className="aspect-square h-full w-full object-cover"
              />
            </div>
            <p className="leading-relaxed text-slate-300">
              {drawer.nft.source === 'alchemy'
                ? 'NFT asli dari wallet yang terhubung, dibaca lewat Alchemy. Floor price tidak tersedia dari API ini.'
                : 'Item demo — artwork SVG generatif, bukan NFT asli. NFT asli bisa dicek lewat "Cek NFT" di tab My Collection.'}
            </p>
            <dl className="space-y-2.5">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Koleksi</dt>
                <dd className="font-medium text-white">
                  {drawer.nft.collection}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Token ID</dt>
                <dd className="font-mono text-white">
                  #{drawer.nft.tokenId}
                </dd>
              </div>
              {drawer.nft.rarityTotal > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Rarity Rank</dt>
                  <dd className="font-mono tabular-nums text-white">
                    #{drawer.nft.rarityRank} / {drawer.nft.rarityTotal}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Floor Price</dt>
                <dd className="font-mono tabular-nums text-white">
                  {drawer.nft.floorEth === null
                    ? '—'
                    : `${drawer.nft.floorEth} ETH`}
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-muted">Traits</dt>
                <dd className="space-y-1.5">
                  {drawer.nft.traits.map((t) => (
                    <p
                      key={t.trait}
                      className="flex justify-between gap-3 rounded-lg border border-line bg-bg px-3 py-2"
                    >
                      <span className="text-muted">{t.trait}</span>
                      <span className="text-white">{t.value}</span>
                    </p>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </DetailDrawer>

      <Toast toast={toast} />
    </div>
  );
}
