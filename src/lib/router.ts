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
    description: 'Harga pasar, gas termurah, dan yield terbaik — data publik live.',
  },
  {
    id: 'crypto',
    label: 'Crypto & DeFi',
    description: 'Saldo native wallet kamu, gas tracker, dan perbandingan yield.',
  },
  {
    id: 'nft',
    label: 'NFT Hub',
    description: 'Cek NFT apa pun via kontrak + token ID, dan preview mint / event pass.',
  },
  {
    id: 'security',
    label: 'Security Scanner',
    description: 'Pindai risiko kontrak dan periksa approval wallet kamu.',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Tautan explorer untuk melihat riwayat alamat wallet yang aktif.',
  },
] as const;

export function getViewMeta(view: View): ViewMeta {
  return VIEWS.find((v) => v.id === view) ?? VIEWS[0];
}
