import type { ActivityItem } from '../types';

/**
 * Seed activity — real events from the user's history (Nov 2026),
 * newest first.
 */
export const ACTIVITY: readonly ActivityItem[] = [
  {
    id: 'act-augent-mint',
    kind: 'claim',
    title: 'AUGENT free share minted',
    detail: '1 share gratis via claimFree() — 200.000 AUGENT claimable setelah pool buka.',
    chain: 'bsc',
    txHash: '0x561d43147df57f61153f954ee5a9c6793ebf3a9f69c666a12d24f5482a304097',
    timestamp: '2026-11-19T06:35:00.000Z',
  },
  {
    id: 'act-news-20261119',
    kind: 'submit',
    title: 'news-image-20261119 disubmit',
    detail: 'Entry 01a1f175-2d45-77c5-9b4d-f7d2109b2cfc — lead trilateral Trump–Xi–Putin di Shenzhen.',
    chain: 'bsc',
    timestamp: '2026-11-19T01:39:00.000Z',
  },
  {
    id: 'act-news-20261118',
    kind: 'submit',
    title: 'news-image-20261118 rebuild disubmit',
    detail: 'Entry 01a1f175-0ff3-76ed-b054-e92cf7d7c99c — full-day 18 Nov, menggantikan entry pagi.',
    chain: 'bsc',
    timestamp: '2026-11-19T01:39:00.000Z',
  },
  {
    id: 'act-token-radar',
    kind: 'submit',
    title: 'token-radar-01 disubmit',
    detail: 'Entry 01a1f170-65fd-71a2-b49d-2a7348d92a05 — board 198 baris, model radar-2.',
    chain: 'bsc',
    timestamp: '2026-11-19T01:33:00.000Z',
  },
  {
    id: 'act-presschain-8',
    kind: 'mint',
    title: 'Presschain Edition Copy #390 minted',
    detail: 'Edisi 8, copy ke-23, kelas Scoop — gratis via printFree(40).',
    chain: 'bsc',
    txHash: '0x643a7fe08cc621ec3961afc688fd02dc6782cdc75e07da743cfdef25b3148cce',
    timestamp: '2026-11-19T01:01:00.000Z',
  },
  {
    id: 'act-presschain-7',
    kind: 'mint',
    title: 'Presschain Edition Copy #334 minted',
    detail: 'Edisi 7, copy ke-68, kelas Scoop — gratis via printFree(40).',
    chain: 'bsc',
    timestamp: '2026-11-18T01:00:00.000Z',
  },
  {
    id: 'act-revoke-all',
    kind: 'approval',
    title: 'Semua approval dicabut',
    detail: 'Audit wallet: semua approval token dicabut — tidak ada approval aktif tersisa.',
    chain: 'bsc',
    timestamp: '2026-11-15T19:01:00.000Z',
  },
  {
    id: 'act-pokechain',
    kind: 'mint',
    title: 'Pokechain #2271 minted',
    detail: 'Lugia LEGEND, Tier Platinum — mint gratis pertama.',
    chain: 'bsc',
    timestamp: '2026-11-08T14:46:00.000Z',
  },
] as const;
