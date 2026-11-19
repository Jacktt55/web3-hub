import type { MintPass } from '../types';

/**
 * Mint & event pass preview — ONE demo pass only.
 * This is a design demo of the pass-preview feature, clearly labelled
 * "Demo" in the UI: no live contract, no real mint, no personal data.
 * Public visitors check any real NFT via "Cek NFT" (contract + token ID).
 */
export const MINT_PASSES: readonly MintPass[] = [
  {
    id: 'web3hub-genesis-demo',
    title: 'Web3 Hub Genesis Pass (Demo)',
    event: 'Contoh tampilan mint pass — early access + event pass',
    date: 'Contoh — belum ada jadwal live',
    price: 'Contoh',
    supply: 1000,
    minted: 0,
    status: 'upcoming',
  },
] as const;
