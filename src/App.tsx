import { useEffect, useMemo, useState } from 'react';
import {
  Bitcoin,
  Coins,
  Flame,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Toast from './components/layout/Toast';
import type { ToastData } from './components/layout/Toast';
import TxPreviewModal from './components/layout/TxPreviewModal';
import WalletModal from './components/layout/WalletModal';
import Badge from './components/ui/Badge';
import PortfolioTable from './features/crypto/PortfolioTable';
import GasTracker from './features/crypto/GasTracker';
import YieldComparator from './features/crypto/YieldComparator';
import NftLookup from './features/nft/NftLookup';
import MintPassCard from './features/nft/MintPassCard';
import ContractScanner from './features/security/ContractScanner';
import ApprovalList from './features/security/ApprovalList';
import { useLiveData } from './hooks/useLiveData';
import {
  CHAINS,
  MINT_PASSES,
  bestApy,
  chainInfo,
  cheapestGas,
} from './data';
import { formatPct, formatUsd, isAddress } from './lib/format';
import { findWatch, prepareRevokeTx } from './lib/live';
import { getViewMeta } from './lib/router';
import type {
  Address,
  MintPass,
  PreparedTx,
  TokenApproval,
  View,
} from './types';

const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  USDT: 'Tether',
};

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}

function KpiCard({ label, value, sub, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line/80">
      <p className="flex items-center gap-2 text-xs font-medium text-muted">
        <Icon className="h-4 w-4 text-accent-2" />
        {label}
      </p>
      <p className="mt-2.5 truncate font-mono text-base font-bold tabular-nums text-white sm:text-xl xl:text-2xl">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{sub}</p>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [pendingTx, setPendingTx] = useState<PreparedTx | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
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

  const live = useLiveData(wallet);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  function showToast(message: string, kind: ToastData['kind'] = 'info'): void {
    setToast({ id: Date.now(), message, kind });
  }

  const cheapest = useMemo(() => cheapestGas(live.gas), [live.gas]);
  const bestPool = useMemo(() => bestApy(live.yields), [live.yields]);
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
    setWallet(null);
    window.localStorage.removeItem('web3hub-wallet');
    setWalletModalOpen(false);
    showToast('Wallet diputuskan.');
  }

  async function handleRevokeRequest(
    approval: TokenApproval,
  ): Promise<void> {
    if (!wallet) {
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
      const tx = await prepareRevokeTx(watch, nativePrice, wallet);
      setPendingTx(tx);
    } catch {
      showToast('Gagal menyiapkan preview revoke — RPC tidak menjawab.');
    }
  }

  function handleMintPreview(pass: MintPass): void {
    showToast(
      `“${pass.title}” adalah pass contoh (demo) — belum ada kontrak live untuk mint ini.`,
    );
  }

  const meta = getViewMeta(view);
  const q = query.trim();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        view={view}
        onNavigate={setView}
        walletAddress={wallet}
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
          wallet={wallet}
          onWalletClick={() => setWalletModalOpen(true)}
          onRefresh={() =>
            showToast(
              'Data live menyegarkan otomatis (harga 30 dtk, gas 15 dtk).',
            )
          }
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
                : 'SNAPSHOT — menunggu data live pertama…'}
            </p>
          </header>

          {view === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <KpiCard
                  label="Harga BTC"
                  value={
                    live.prices?.BTC ? formatUsd(live.prices.BTC) : '—'
                  }
                  sub={
                    live.changes?.BTC !== undefined
                      ? `24j ${formatPct(live.changes.BTC)}`
                      : 'CoinGecko · 30 dtk'
                  }
                  icon={Bitcoin}
                />
                <KpiCard
                  label="Harga ETH"
                  value={
                    live.prices?.ETH ? formatUsd(live.prices.ETH) : '—'
                  }
                  sub={
                    live.changes?.ETH !== undefined
                      ? `24j ${formatPct(live.changes.ETH)}`
                      : 'CoinGecko · 30 dtk'
                  }
                  icon={Coins}
                />
                <KpiCard
                  label="Gas Termurah"
                  value={
                    cheapest ? formatUsd(cheapest.transferUsd) : '—'
                  }
                  sub={
                    cheapest
                      ? `Transfer native termurah · ${chainInfo(cheapest.chain).name}`
                      : 'Biaya transfer native terendah'
                  }
                  icon={Flame}
                />
                <KpiCard
                  label="Yield Terbaik"
                  value={bestPool ? `${bestPool.apy.toFixed(1)}% APY` : '—'}
                  sub={
                    bestPool
                      ? `${bestPool.protocol} · ${bestPool.pair}`
                      : 'Tidak ada pool'
                  }
                  icon={TrendingUp}
                />
              </div>

              <div className="grid items-start gap-5 xl:grid-cols-[1.55fr_1fr]">
                <GasTracker fees={live.gas} live={live.gasLive} query={q} />
                <section className="rounded-2xl border border-line bg-surface p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      Harga Live
                    </h2>
                    {live.prices ? (
                      <Badge variant="green">CoinGecko</Badge>
                    ) : (
                      <Badge variant="blue">Menunggu…</Badge>
                    )}
                  </div>
                  {live.prices ? (
                    <ul className="space-y-2.5">
                      {(['BTC', 'ETH', 'BNB', 'SOL', 'USDT'] as const)
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
                      Menunggu data CoinGecko…
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
              <PortfolioTable
                wallet={wallet}
                balances={live.nativeBalances}
                livePrices={live.prices}
                liveChanges={live.changes}
                onConnect={() => setWalletModalOpen(true)}
              />
              <div className="grid items-start gap-5 xl:grid-cols-2">
                <GasTracker fees={live.gas} live={live.gasLive} query={q} />
                <YieldComparator
                  pools={live.yields}
                  live={live.yieldsLive}
                  query={q}
                />
              </div>
            </div>
          )}

          {view === 'nft' && (
            <div className="space-y-8">
              <section>
                <h2 className="mb-4 text-lg font-bold text-white">
                  Mint &amp; Event Pass
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {MINT_PASSES.map((p) => (
                    <MintPassCard
                      key={p.id}
                      pass={p}
                      onPreview={handleMintPreview}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">
                  Pass di atas adalah demo tampilan — belum ada kontrak live.
                </p>
              </section>
              <NftLookup />
            </div>
          )}

          {view === 'security' && (
            <div className="grid items-start gap-5 xl:grid-cols-2">
              <ContractScanner />
              {wallet ? (
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
            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="mb-1 text-lg font-bold text-white">
                Riwayat di Explorer
              </h2>
              <p className="mb-4 text-sm text-muted">
                Web3 Hub tidak menyimpan riwayat transaksi — riwayat lengkap
                alamat ini ada di explorer tiap chain.
              </p>
              {wallet ? (
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
                        href={`${c.explorer}/address/${wallet}`}
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
          )}
        </main>
      </div>

      <WalletModal
        open={walletModalOpen}
        current={wallet}
        onClose={() => setWalletModalOpen(false)}
        onApply={handleApplyWallet}
        onDisconnect={handleDisconnectWallet}
      />

      <TxPreviewModal
        tx={pendingTx}
        onClose={() => setPendingTx(null)}
        onCopied={() =>
          showToast(
            'Ringkasan disalin — eksekusi dari wallet kamu sendiri.',
            'success',
          )
        }
      />

      <Toast toast={toast} />
    </div>
  );
}
