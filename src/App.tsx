import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Flame,
  Gift,
  Image as ImageIcon,
  Repeat,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import DetailDrawer from './components/layout/DetailDrawer';
import Toast from './components/layout/Toast';
import type { ToastData } from './components/layout/Toast';
import TxPreviewModal from './components/layout/TxPreviewModal';
import CopyAddressButton from './components/ui/CopyAddressButton';
import PortfolioTable from './features/crypto/PortfolioTable';
import GasTracker from './features/crypto/GasTracker';
import YieldComparator from './features/crypto/YieldComparator';
import NftGrid from './features/nft/NftGrid';
import NftDetailModal from './features/nft/NftDetailModal';
import MintPassCard from './features/nft/MintPassCard';
import ContractScanner from './features/security/ContractScanner';
import ApprovalList from './features/security/ApprovalList';
import { useLiveData } from './hooks/useLiveData';
import {
  ACTIVITY,
  CONTRACT_AUDITS,
  HOLDINGS,
  MINT_PASSES,
  NFTS,
  TOKEN_APPROVALS,
  WALLET_ADDRESS,
  bestApy,
  chainInfo,
  cheapestGas,
} from './data';
import { formatDateTime, formatUsd, timeAgo } from './lib/format';
import {
  findWatch,
  prepareAugentClaimTx,
  preparePresschainPreview,
  prepareRevokeTx,
} from './lib/live';
import { getViewMeta } from './lib/router';
import type {
  ActivityItem,
  ActivityKind,
  MintPass,
  NftItem,
  PreparedTx,
  TokenApproval,
  View,
} from './types';

const KIND_ICONS: Record<ActivityKind, LucideIcon> = {
  mint: Sparkles,
  transfer: ArrowLeftRight,
  swap: Repeat,
  approval: ShieldCheck,
  scan: ScanLine,
  claim: Gift,
  submit: Send,
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
      <p className="mt-2.5 truncate font-mono text-2xl font-bold tabular-nums text-white">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{sub}</p>
    </div>
  );
}

function ActivityRow({
  item,
  onClick,
}: {
  item: ActivityItem;
  onClick: () => void;
}) {
  const Icon = KIND_ICONS[item.kind];
  const chain = chainInfo(item.chain);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-bg px-4 py-3.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2">
        <Icon className="h-4 w-4 text-accent-2" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">
          {item.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {item.detail}
        </span>
        <span className="mt-1 flex items-center gap-2 text-[11px] text-faint">
          <i
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: chain.color }}
          />
          {chain.name} · {timeAgo(item.timestamp)}
        </span>
      </span>
    </button>
  );
}

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [drawerActivity, setDrawerActivity] = useState<ActivityItem | null>(
    null,
  );
  const [pendingTx, setPendingTx] = useState<PreparedTx | null>(null);

  const live = useLiveData();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  function showToast(message: string, kind: ToastData['kind'] = 'info'): void {
    setToast({ id: Date.now(), message, kind });
  }

  /** Approvals: live on-chain once read, seed list while waiting. */
  const approvals = live.approvals ?? TOKEN_APPROVALS;

  const total = useMemo(
    () =>
      HOLDINGS.reduce(
        (sum, h) =>
          sum + h.balance * (live.prices?.[h.symbol] ?? h.priceUsd),
        0,
      ),
    [live.prices],
  );
  const cheapest = useMemo(() => cheapestGas(live.gas), [live.gas]);
  const bestPool = useMemo(() => bestApy(live.yields), [live.yields]);
  const alertCount = useMemo(
    () =>
      approvals.filter(
        (a) =>
          a.risk === 'medium' || a.risk === 'high' || a.risk === 'critical',
      ).length +
      CONTRACT_AUDITS.filter(
        (a) => a.risk === 'high' || a.risk === 'critical',
      ).length,
    [approvals],
  );

  const augentNote =
    live.augentPhase === null
      ? undefined
      : live.augentPhase === 3
        ? 'Pool BUKA (fase 3) — claim siap dieksekusi.'
        : `Pool belum buka (fase ${live.augentPhase}) — auto-claim aktif, pantau tiap jam.`;

  async function handleRevokeRequest(
    approval: TokenApproval,
  ): Promise<void> {
    const watch = findWatch(approval.token, approval.spender);
    if (!watch) {
      showToast(
        'Approval ini dari data contoh — tidak ada kontrak live untuk disiapkan.',
      );
      return;
    }
    try {
      const nativePrice =
        live.prices?.[chainInfo(watch.chain).nativeSymbol] ?? 0;
      const tx = await prepareRevokeTx(watch, nativePrice);
      setPendingTx(tx);
    } catch {
      showToast('Gagal menyiapkan preview revoke — RPC tidak menjawab.');
    }
  }

  async function handleMintPreview(pass: MintPass): Promise<void> {
    if (pass.id === 'web3hub-genesis') {
      showToast('Ini pass contoh — belum ada kontrak live untuk mint ini.');
      return;
    }
    if (pass.id === 'augent-claim') {
      try {
        const tx = await prepareAugentClaimTx(live.prices?.BNB ?? 0);
        setPendingTx(tx);
      } catch {
        showToast('Gagal menyiapkan preview claim — RPC tidak menjawab.');
      }
      return;
    }
    if (pass.id === 'presschain-ed9') {
      // Static preview only — no live Presschain reads (Presschain ditunda).
      setPendingTx(preparePresschainPreview());
      return;
    }
    showToast(`Preview ${pass.title} — ${pass.price} · ${pass.date}`);
  }

  const meta = getViewMeta(view);
  const q = query.trim().toLowerCase();
  const filteredActivity = ACTIVITY.filter(
    (a) =>
      q === '' ||
      a.title.toLowerCase().includes(q) ||
      a.detail.toLowerCase().includes(q),
  );

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        view={view}
        onNavigate={setView}
        walletAddress={WALLET_ADDRESS}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <Topbar
          view={view}
          query={query}
          onQueryChange={setQuery}
          gasFees={live.gas}
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
                  label="Total Portofolio"
                  value={formatUsd(total)}
                  sub={`${HOLDINGS.length} aset · 5 chain${live.prices ? ' · harga live' : ''}`}
                  icon={Wallet}
                />
                <KpiCard
                  label="NFT Terkumpul"
                  value={String(NFTS.length)}
                  sub="Termasuk Presschain #390 & Pokechain Lugia"
                  icon={ImageIcon}
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
                <GasTracker fees={live.gas} live={live.gasLive} />
                <section className="rounded-2xl border border-line bg-surface p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      Aktivitas Terbaru
                    </h2>
                    <button
                      onClick={() => setView('activity')}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Lihat semua
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {ACTIVITY.slice(0, 5).map((a) => (
                      <ActivityRow
                        key={a.id}
                        item={a}
                        onClick={() => setDrawerActivity(a)}
                      />
                    ))}
                  </div>
                </section>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6">
                <h2 className="mb-1 text-lg font-bold text-white">
                  Peringatan Keamanan
                </h2>
                <p className="text-sm text-muted">
                  {alertCount === 0
                    ? 'Tidak ada peringatan aktif — wallet dan kontrak terpantau bersih.'
                    : `${alertCount} item butuh perhatian di Security Scanner — approval berisiko dan kontrak contoh berisiko tinggi di database lokal.`}
                </p>
              </div>
            </div>
          )}

          {view === 'crypto' && (
            <div className="space-y-5">
              <PortfolioTable
                holdings={HOLDINGS}
                query={query}
                livePrices={live.prices}
                liveChanges={live.changes}
                live={live.prices !== null}
              />
              <div className="grid items-start gap-5 xl:grid-cols-2">
                <GasTracker fees={live.gas} live={live.gasLive} />
                <YieldComparator pools={live.yields} live={live.yieldsLive} />
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
                      liveNote={
                        p.id === 'augent-claim' ? augentNote : undefined
                      }
                      onPreview={(pass) => void handleMintPreview(pass)}
                    />
                  ))}
                </div>
              </section>
              <NftGrid
                nfts={NFTS}
                query={query}
                onSelect={setSelectedNft}
                images={live.nftImages}
              />
            </div>
          )}

          {view === 'security' && (
            <div className="grid items-start gap-5 xl:grid-cols-2">
              <ContractScanner audits={CONTRACT_AUDITS} />
              <ApprovalList
                approvals={approvals}
                approvalsLive={live.approvalsLive}
                onRevokeRequest={(a) => void handleRevokeRequest(a)}
              />
            </div>
          )}

          {view === 'activity' && (
            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="mb-4 text-lg font-bold text-white">
                Semua Aktivitas
              </h2>
              {filteredActivity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Tidak ada aktivitas yang cocok dengan “{query}”.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {filteredActivity.map((a) => (
                    <ActivityRow
                      key={a.id}
                      item={a}
                      onClick={() => setDrawerActivity(a)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <NftDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} />

      <TxPreviewModal
        tx={pendingTx}
        onClose={() => setPendingTx(null)}
        onCopied={() =>
          showToast(
            'Ringkasan disalin — tempel di chat dan tulis “ya, eksekusi”.',
            'success',
          )
        }
      />

      <DetailDrawer
        open={drawerActivity !== null}
        onClose={() => setDrawerActivity(null)}
        title={drawerActivity?.title ?? 'Detail Aktivitas'}
      >
        {drawerActivity && (
          <div className="space-y-4 text-sm">
            <p className="leading-relaxed text-slate-300">
              {drawerActivity.detail}
            </p>
            <dl className="space-y-2.5">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Jenis</dt>
                <dd className="font-medium capitalize text-white">
                  {drawerActivity.kind}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Chain</dt>
                <dd className="font-medium text-white">
                  {chainInfo(drawerActivity.chain).name}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Waktu</dt>
                <dd className="text-slate-300">
                  {formatDateTime(drawerActivity.timestamp)}
                </dd>
              </div>
              {drawerActivity.txHash && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Tx Hash</dt>
                  <dd>
                    <CopyAddressButton address={drawerActivity.txHash} />
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </DetailDrawer>

      <Toast toast={toast} />
    </div>
  );
}
