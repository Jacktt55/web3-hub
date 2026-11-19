import { Menu, RefreshCw, Search, Wallet } from 'lucide-react';
import { GAS_FEES } from '../../data';
import { shortenAddress } from '../../lib/format';
import { getViewMeta } from '../../lib/router';
import type { Address, GasFee, View } from '../../types';

interface TopbarProps {
  view: View;
  query: string;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  onMenuClick: () => void;
  /** Gas rows for the chips — live when the hook has answered. */
  gasFees?: readonly GasFee[];
  /** Active wallet address, null when no wallet is entered yet. */
  wallet: Address | null;
  /** Connected chain name (wagmi), shown next to the address. */
  chainName?: string | null;
  onWalletClick: () => void;
}

export default function Topbar({
  view,
  query,
  onQueryChange,
  onRefresh,
  onMenuClick,
  gasFees = GAS_FEES,
  wallet,
  chainName,
  onWalletClick,
}: TopbarProps) {
  const meta = getViewMeta(view);
  const ethGas = gasFees.find((g) => g.chain === 'ethereum');
  const baseGas = gasFees.find((g) => g.chain === 'base');
  const arbGas = gasFees.find((g) => g.chain === 'arbitrum');

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2.5 px-4 lg:px-8">
        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="rounded-xl border border-line bg-surface p-2.5 text-slate-300 hover:bg-surface-2 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative min-w-0 max-w-[380px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            type="text"
            placeholder={`Cari di ${meta.label}…`}
            aria-label="Cari"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </div>

        <div className="hidden items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2 font-mono text-xs xl:flex">
          {ethGas && (
            <span>
              ETH{' '}
              <b className="font-semibold text-ink">
                {ethGas.gasPriceGwei} gwei
              </b>
            </span>
          )}
          <span className="text-line">|</span>
          {baseGas && (
            <span>
              Base{' '}
              <b className="font-semibold text-ink">
                {baseGas.gasPriceGwei} gwei
              </b>
            </span>
          )}
          <span className="text-line">|</span>
          {arbGas && (
            <span>
              Arbitrum{' '}
              <b className="font-semibold text-ink">
                {arbGas.gasPriceGwei} gwei
              </b>
            </span>
          )}
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-accent/50 hover:bg-surface-2 hover:text-white"
        >
          <RefreshCw className="h-4 w-4 text-accent-2" />
          <span className="hidden sm:inline">Segarkan</span>
        </button>

        {wallet ? (
          <button
            onClick={onWalletClick}
            title="Ganti alamat wallet (hanya membaca data publik on-chain)"
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface py-1.5 pl-3 pr-2.5 font-mono text-xs text-slate-200 transition-colors hover:border-accent/50"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-profit" />
            {chainName && (
              <span className="hidden text-muted sm:inline">
                {chainName} ·
              </span>
            )}
            {shortenAddress(wallet)}
            <Wallet className="h-3.5 w-3.5 text-muted" />
          </button>
        ) : (
          <button
            onClick={onWalletClick}
            title="Masukkan alamat wallet untuk membaca data publik on-chain"
            className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600"
          >
            <Wallet className="h-3.5 w-3.5" />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
