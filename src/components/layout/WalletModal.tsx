import { useEffect, useState } from 'react';
import { Check, RotateCcw, Wallet, X } from 'lucide-react';
import { chainInfo } from '../../data';
import { formatUnits, isAddress, shortenAddress } from '../../lib/format';
import { fetchNativeBalances } from '../../lib/live';
import type { Address, ChainId } from '../../types';
import CopyAddressButton from '../ui/CopyAddressButton';

interface WalletModalProps {
  open: boolean;
  current: Address;
  defaultAddress: Address;
  onClose: () => void;
  onApply: (address: Address) => void;
}

interface NativeBalance {
  chain: ChainId;
  balance: bigint;
}

/**
 * Change the active wallet address.
 * The address is only used to READ public on-chain data — there is no
 * wallet connection, no signing, and nothing here can move funds.
 */
export default function WalletModal({
  open,
  current,
  defaultAddress,
  onClose,
  onApply,
}: WalletModalProps) {
  const [input, setInput] = useState<string>(current);
  const [balances, setBalances] = useState<NativeBalance[] | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setInput(current);
      setBalances(null);
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
    valid && input.trim().toLowerCase() !== current.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ganti wallet"
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
            Ganti Wallet
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
          <p className="text-sm text-muted">
            Alamat ini hanya dipakai untuk{' '}
            <b className="text-white">membaca data publik on-chain</b> —
            approval, saldo native, dan status AUGENT. Tidak ada koneksi
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
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
            {input.trim() !== '' && !valid && (
              <p className="mt-1.5 text-xs text-loss">
                Alamat tidak valid — harus 0x diikuti 40 karakter hex.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-bg p-3.5">
            <p className="text-xs font-semibold text-muted">
              Wallet aktif saat ini
            </p>
            <div className="mt-1">
              <CopyAddressButton address={current} />
            </div>
          </div>

          {valid && (
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
            <button
              onClick={() => onApply(defaultAddress)}
              disabled={current === defaultAddress}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset ke default
            </button>
          </div>

          <p className="text-center text-xs text-muted">
            Alamat disimpan di browser ini saja (localStorage). Portofolio,
            NFT & aktivitas tetap snapshot wallet default 19 Nov 2026 — yang
            berubah mengikuti alamat adalah approval, saldo native, status
            AUGENT, dan alamat pengirim di preview transaksi.
          </p>
          <p className="text-center font-mono text-xs text-muted">
            {shortenAddress(current)}
          </p>
        </div>
      </div>
    </div>
  );
}
