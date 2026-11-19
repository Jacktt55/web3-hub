import { useEffect, useState } from 'react';
import { Check, LogOut, Wallet, X } from 'lucide-react';
import { useAccount, useBalance, useConnect } from 'wagmi';
import { chainInfo } from '../../data';
import { formatUnits, isAddress, shortenAddress } from '../../lib/format';
import { fetchNativeBalances } from '../../lib/live';
import { chainIdToName, walletConnectEnabled } from '../../lib/wagmi';
import type { Address, ChainId } from '../../types';
import CopyAddressButton from '../ui/CopyAddressButton';

interface WalletModalProps {
  open: boolean;
  /** Active wallet (connected or manual), null when none is set yet. */
  current: Address | null;
  onClose: () => void;
  onApply: (address: Address) => void;
  onDisconnect: () => void;
}

interface NativeBalance {
  chain: ChainId;
  balance: bigint;
}

/**
 * Connect Wallet — two ways in, same read-only promise:
 *
 * 1. Dompet asli (wagmi/viem): MetaMask / wallet browser (injected),
 *    WalletConnect bila VITE_WALLETCONNECT_PROJECT_ID di-set. Membaca
 *    alamat, chain, dan saldo native yang terhubung — TIDAK ada signing
 *    dan TIDAK ada yang bisa menggerakkan dana.
 * 2. Mode demo: ketik alamat EVM apa pun (tidak ada wallet terpasang
 *    pun bisa) — data dibaca on-chain dari alamat itu.
 */
export default function WalletModal({
  open,
  current,
  onClose,
  onApply,
  onDisconnect,
}: WalletModalProps) {
  const [input, setInput] = useState<string>(current ?? '');
  const [balances, setBalances] = useState<NativeBalance[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [connectError, setConnectError] = useState('');

  const { address: connectedAddress, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { data: connectedBalance } = useBalance({
    address: connectedAddress,
  });

  useEffect(() => {
    if (open) {
      setInput(current ?? '');
      setBalances(null);
      setConnectError('');
    }
  }, [open, current]);

  const valid = isAddress(input.trim());

  // When the input becomes a valid address, check its native balances
  // (BSC/ETH/Base/Arbitrum/Polygon) so the user can see it is real.
  useEffect(() => {
    if (!open || !valid) {
      setBalances(null);
      return;
    }
    const address = input.trim();
    setChecking(true);
    const t = window.setTimeout(() => {
      void fetchNativeBalances(address)
        .then((b) => setBalances(b))
        .catch(() => setBalances([]))
        .finally(() => setChecking(false));
    }, 500);
    return () => window.clearTimeout(t);
  }, [open, valid, input]);

  if (!open) return null;

  const changed =
    valid &&
    !isConnected &&
    (current === null ||
      input.trim().toLowerCase() !== current.toLowerCase());

  const injectedConnector = connectors.find((c) => c.id === 'injected');
  const wcConnector = connectors.find((c) => c.id === 'walletConnect');

  function connectInjected(): void {
    if (!injectedConnector) return;
    setConnectError('');
    try {
      connect(
        { connector: injectedConnector },
        {
          onError: () => {
            setConnectError(
              'Tidak ada wallet terdeteksi di browser ini — pasang MetaMask atau pakai mode demo di bawah.',
            );
          },
        },
      );
    } catch {
      setConnectError(
        'Tidak ada wallet terdeteksi di browser ini — pasang MetaMask atau pakai mode demo di bawah.',
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
    >
      <button
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <Wallet className="h-5 w-5 text-accent-2" />
            Connect Wallet
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {isConnected && connectedAddress ? (
            <div className="rounded-xl border border-profit/30 bg-profit/10 p-3.5">
              <p className="text-xs font-semibold text-profit">
                Wallet terhubung (wagmi)
              </p>
              <div className="mt-1">
                <CopyAddressButton address={connectedAddress} />
              </div>
              <p className="mt-1.5 text-sm text-slate-200">
                Chain:{' '}
                <b className="text-white">
                  {chainIdToName(chainId) ?? `Chain ${chainId ?? '?'}`}
                </b>
                {connectedBalance && (
                  <>
                    {' · '}Saldo:{' '}
                    <span className="font-mono tabular-nums text-white">
                      {formatUnits(
                        connectedBalance.value,
                        connectedBalance.decimals,
                      )}{' '}
                      {connectedBalance.symbol}
                    </span>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                Hanya membaca — tidak ada signing, tidak ada transaksi dari
                aplikasi ini.
              </p>
              <button
                onClick={onDisconnect}
                className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Putuskan wallet
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">
                Dompet asli
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={connectInjected}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
                >
                  <Wallet className="h-4 w-4" />
                  {isPending
                    ? 'Menghubungkan…'
                    : 'Hubungkan wallet browser'}
                </button>
                {walletConnectEnabled && wcConnector && (
                  <button
                    onClick={() => {
                      setConnectError('');
                      connect(
                        { connector: wcConnector },
                        {
                          onError: () =>
                            setConnectError(
                              'WalletConnect gagal — coba lagi atau pakai mode demo di bawah.',
                            ),
                        },
                      );
                    }}
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white disabled:opacity-60"
                  >
                    WalletConnect
                  </button>
                )}
              </div>
              {connectError !== '' && (
                <p className="mt-2 text-xs leading-relaxed text-loss">
                  {connectError}
                </p>
              )}
              {!walletConnectEnabled && (
                <p className="mt-2 text-xs text-muted">
                  WalletConnect butuh VITE_WALLETCONNECT_PROJECT_ID (lihat
                  README) — sementara pakai wallet browser atau mode demo.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            atau mode demo
            <span className="h-px flex-1 bg-line" />
          </div>

          <p className="text-sm text-muted">
            Ketik alamat EVM apa pun — alamat ini hanya dipakai untuk{' '}
            <b className="text-white">membaca data publik on-chain</b>
            (approval, saldo native, preview transaksi). Tidak ada koneksi
            wallet, tidak ada tanda tangan, dan tidak ada yang bisa
            menggerakkan dana.
          </p>

          <div>
            <label
              htmlFor="wallet-address"
              className="mb-1.5 block text-xs font-semibold text-muted"
            >
              Alamat wallet (EVM)
            </label>
            <input
              id="wallet-address"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              spellCheck={false}
              placeholder="0x…"
              disabled={isConnected}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-50"
            />
            {input.trim() !== '' && !valid && (
              <p className="mt-1.5 text-xs text-loss">
                Alamat tidak valid — harus 0x diikuti 40 karakter hex.
              </p>
            )}
            {isConnected && (
              <p className="mt-1.5 text-xs text-muted">
                Wallet asli sedang terhubung — putuskan dulu untuk memakai
                alamat manual.
              </p>
            )}
          </div>

          {current && !isConnected && (
            <div className="rounded-xl border border-line bg-bg p-3.5">
              <p className="text-xs font-semibold text-muted">
                Wallet aktif saat ini
              </p>
              <div className="mt-1">
                <CopyAddressButton address={current} />
              </div>
            </div>
          )}

          {valid && !isConnected && (
            <div className="rounded-xl border border-line bg-bg p-3.5">
              <p className="text-xs font-semibold text-muted">
                Saldo native alamat ini
              </p>
              {checking ? (
                <p className="mt-1.5 text-sm text-muted">
                  Mengecek saldo on-chain…
                </p>
              ) : balances === null ? (
                <p className="mt-1.5 text-sm text-muted">—</p>
              ) : balances.length === 0 ? (
                <p className="mt-1.5 text-sm text-muted">
                  Tidak terbaca (RPC tidak menjawab) — alamat tetap bisa
                  dipakai.
                </p>
              ) : (
                <ul className="mt-1.5 space-y-1 text-sm text-slate-200">
                  {balances.map((b) => (
                    <li key={b.chain} className="flex justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <i
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: chainInfo(b.chain).color,
                          }}
                        />
                        {chainInfo(b.chain).name}
                      </span>
                      <span className="font-mono">
                        {formatUnits(b.balance, 18)}{' '}
                        {chainInfo(b.chain).nativeSymbol}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={() => {
                if (valid) onApply(input.trim() as Address);
              }}
              disabled={!changed}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Gunakan alamat ini
            </button>
            {current && !isConnected && (
              <button
                onClick={onDisconnect}
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Putuskan
              </button>
            )}
          </div>

          <p className="text-center text-xs text-muted">
            Alamat disimpan di browser ini saja (localStorage) — setiap
            pengunjung memakai alamatnya sendiri.
          </p>
          {current && (
            <p className="text-center font-mono text-xs text-muted">
              {shortenAddress(current)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
