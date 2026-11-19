/** Small, pure formatting helpers shared by every feature. */

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const usdSmall = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const usdTiny = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});

/** $33,643.12 — amounts >= $0.01 use 2 decimals, smaller use 4 or 6. */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '$—';
  if (n !== 0 && Math.abs(n) < 0.0001) return usdTiny.format(n);
  return Math.abs(n) < 0.01 && n !== 0 ? usdSmall.format(n) : usd.format(n);
}

/** 1.2M / 840K / 12.4B — compact numbers for TVL and supplies. */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

/** +1.23% / -0.45% with an explicit sign. */
export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

/** 0xDf0b…58ff — shortened address. */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/** "19 Nov 2026, 08:01" — short, locale-neutral timestamp. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** "2h ago" / "3d ago" — coarse relative time. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(then) || diff < 0) return 'just now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(iso);
}
