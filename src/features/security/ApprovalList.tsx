import { chainInfo } from '../../data';
import { formatDateTime } from '../../lib/format';
import type { TokenApproval } from '../../types';
import Badge from '../../components/ui/Badge';
import CopyAddressButton from '../../components/ui/CopyAddressButton';
import SkeletonRow from '../../components/ui/SkeletonRow';

const RISK_BADGE = {
  low: 'green',
  medium: 'amber',
  high: 'red',
  critical: 'red',
} as const;

interface ApprovalListProps {
  /** Live allowances; null while the first on-chain read is pending. */
  approvals: readonly TokenApproval[] | null;
  /** True once a live on-chain read has completed (even if empty). */
  approvalsLive: boolean;
  /** Opens the revoke preview for this approval (preview only). */
  onRevokeRequest: (approval: TokenApproval) => void;
}

/**
 * Wallet approval checker — allowances read live on-chain for the
 * visitor's own wallet. Revoke is prepared as a preview only;
 * execution happens from the visitor's own wallet.
 */
export default function ApprovalList({
  approvals,
  approvalsLive,
  onRevokeRequest,
}: ApprovalListProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Approval Checker</h2>
        <span className="flex items-center gap-2">
          {approvalsLive ? (
            <Badge variant="green">Live · on-chain</Badge>
          ) : (
            <Badge variant="blue">Menunggu data live</Badge>
          )}
          <Badge
            variant={
              approvals === null || approvals.length > 0 ? 'amber' : 'green'
            }
          >
            {approvals === null ? '…' : `${approvals.length} aktif`}
          </Badge>
        </span>
      </div>
      <p className="mb-4 text-sm text-muted">
        Approval token ke spender, dibaca langsung dari chain (watchlist
        token × spender). Cabut yang tidak lagi dipakai untuk mengurangi
        permukaan serangan wallet.
      </p>

      {approvals === null ? (
        <div className="space-y-2.5">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <p className="pt-1 text-center text-xs text-muted">
            Membaca approval on-chain…
          </p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-line bg-bg p-6 text-center">
          {approvalsLive ? (
            <>
              <p className="text-sm font-semibold text-profit">
                Tidak ada approval aktif — wallet bersih.
              </p>
              <p className="mt-1 text-xs text-muted">
                Dibaca on-chain dari watchlist token × spender.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-amber">
                Pembacaan on-chain belum berhasil.
              </p>
              <p className="mt-1 text-xs text-muted">
                RPC tidak menjawab — coba segarkan halaman.
              </p>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {approvals.map((a) => {
            const chain = chainInfo(a.chain);
            return (
              <li
                key={a.id}
                className="rounded-xl border border-line bg-bg p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {a.token} → {a.spender}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <i
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: chain.color }}
                        />
                        {chain.name}
                      </span>
                      <span>·</span>
                      <span>Allowance: {a.allowance}</span>
                      <span>·</span>
                      <span>
                        Terakhir dipakai{' '}
                        {a.lastUsed === ''
                          ? 'tidak tercatat'
                          : formatDateTime(a.lastUsed)}
                      </span>
                    </p>
                    <div className="mt-1.5">
                      <CopyAddressButton address={a.spenderAddress} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={RISK_BADGE[a.risk]}>{a.risk}</Badge>
                    <button
                      onClick={() => onRevokeRequest(a)}
                      className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-1.5 text-xs font-semibold text-loss transition-colors hover:bg-loss/20"
                    >
                      Cabut
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
