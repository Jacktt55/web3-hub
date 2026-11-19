import type { View } from '../types';

/**
 * Client-side view router — no external router dependency.
 * Views are plain state in App; this module is the single source of
 * truth for view ids, labels and descriptions.
 */
export interface ViewMeta {
  id: View;
  /** Sidebar label. */
  label: string;
  /** Short description shown in the topbar / page header. */
  description: string;
}

export const VIEWS: readonly ViewMeta[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Ringkasan portofolio, gas, dan aktivitas terbaru.',
  },
  {
    id: 'crypto',
    label: 'Crypto & DeFi',
    description: 'Portofolio multi-chain, gas tracker, dan perbandingan yield.',
  },
  {
    id: 'nft',
    label: 'NFT Hub',
    description: 'Galeri NFT dan preview mint / event pass.',
  },
  {
    id: 'security',
    label: 'Security Scanner',
    description: 'Pindai risiko kontrak dan periksa approval wallet.',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Seluruh riwayat transaksi dan aksi di Web3 Hub.',
  },
] as const;

export function getViewMeta(view: View): ViewMeta {
  return VIEWS.find((v) => v.id === view) ?? VIEWS[0];
}
