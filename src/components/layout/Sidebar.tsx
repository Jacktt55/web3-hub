import {
  Activity,
  BookOpen,
  Coins,
  Image as ImageIcon,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { VIEWS } from '../../lib/router';
import { shortenAddress } from '../../lib/format';
import type { Address, View } from '../../types';

const VIEW_ICONS: Record<View, LucideIcon> = {
  overview: LayoutDashboard,
  crypto: Coins,
  nft: ImageIcon,
  security: ShieldCheck,
  activity: Activity,
};

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
  /** Active wallet address, null when no wallet is entered yet. */
  walletAddress: Address | null;
  /** Mobile drawer state; on desktop the sidebar is always visible. */
  open: boolean;
  onClose: () => void;
  /** Secondary footer links (Docs / Settings) — placeholder for now. */
  onSecondary: (label: string) => void;
  onWalletClick: () => void;
}

export default function Sidebar({
  view,
  onNavigate,
  walletAddress,
  open,
  onClose,
  onSecondary,
  onWalletClick,
}: SidebarProps) {
  return (
    <>
      {open && (
        <button
          aria-label="Tutup menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 flex-none items-center justify-between border-b border-line px-6">
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 p-[1px] shadow-lg shadow-accent/25">
              <span className="flex h-full w-full items-center justify-center rounded-[11px] bg-bg">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-accent-2"
                >
                  <polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2" />
                  <polyline points="12 22 12 12" />
                  <polyline points="21 7 12 12 3 7" />
                </svg>
              </span>
            </span>
            <span className="text-left leading-none">
              <span className="block text-lg font-bold tracking-tight text-white">
                TrashGod <span className="text-accent">Vault</span>
              </span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
                Portfolio · NFT · Security
              </span>
            </span>
          </button>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Navigasi utama">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Menu Utama
          </p>
          {VIEWS.map((v) => {
            const Icon = VIEW_ICONS[v.id];
            const active = v.id === view;
            return (
              <button
                key={v.id}
                onClick={() => {
                  onNavigate(v.id);
                  onClose();
                }}
                className={`mb-1.5 flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent/30 bg-accent/15 text-accent'
                    : 'border-transparent text-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{v.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-none border-t border-line p-4">
          <div className="mb-3 flex items-center gap-1 px-1">
            <button
              onClick={() => onSecondary('Docs')}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Docs
            </button>
            <span className="text-line">·</span>
            <button
              onClick={() => onSecondary('Settings')}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>
          <div className="rounded-xl border border-line bg-bg p-3.5">
            {walletAddress ? (
              <>
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-profit" />
                    Multi-Chain Aktif
                  </span>
                  <span className="text-[11px] text-muted">7 Jaringan</span>
                </div>
                <p className="font-mono text-[11px] leading-relaxed text-muted">
                  {shortenAddress(walletAddress, 6)}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-slate-300">
                  Belum ada wallet terhubung
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  Masukkan alamat wallet kamu untuk melihat saldo & approval.
                </p>
                <button
                  onClick={onWalletClick}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Connect Wallet
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
