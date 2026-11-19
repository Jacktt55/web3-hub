/**
 * Demo activity log — clearly labelled "contoh (demo)" in the UI.
 * These are invented rows so the filter UI can be exercised; they are
 * NOT anyone's real transactions. A visitor's real history lives in
 * the explorer links below the log.
 */
export type ActivityKind = 'swap' | 'mint' | 'stake' | 'revoke';
export type ActivityStatus = 'success' | 'pending' | 'failed';

export interface DemoActivity {
  hash: string;
  kind: ActivityKind;
  summary: string;
  value: string;
  time: string;
  status: ActivityStatus;
}

export const DEMO_ACTIVITY: readonly DemoActivity[] = [
  {
    hash: '0x8f3a21c9e7b54d10a6c2f89e0d3b7a5c1e9f4a2b8d6c0',
    kind: 'swap',
    summary: 'Swap 0.5 ETH → 1.240 USDC',
    value: '$1.240',
    time: '19 Nov 2026, 16:42',
    status: 'success',
  },
  {
    hash: '0x1b7d44a2c9e08f63d5a1b7c4e9f02a8d6b3c5e7f1a9',
    kind: 'mint',
    summary: 'Mint Nexa Pixel #042',
    value: '0,42 ETH',
    time: '19 Nov 2026, 15:03',
    status: 'success',
  },
  {
    hash: '0x5c9e18b7a2d64f08e3a7c1b5d9f4a6e8c0b2d4f6a8',
    kind: 'stake',
    summary: 'Stake 250 USDC di Aave V3',
    value: '$250',
    time: '19 Nov 2026, 11:27',
    status: 'success',
  },
  {
    hash: '0x3d6f02a8c1e94b75d8a2f6c0e1b3d5a7f9c8e0b1a2',
    kind: 'revoke',
    summary: 'Revoke USDT → PancakeSwap Router',
    value: '—',
    time: '19 Nov 2026, 09:15',
    status: 'success',
  },
  {
    hash: '0x9a4c71d3b8e25f60a1c4d7e9b0f3a5c6d8e1f2a3b4',
    kind: 'swap',
    summary: 'Swap 120 USDT → 0,045 BNB',
    value: '$120',
    time: '18 Nov 2026, 21:50',
    status: 'success',
  },
  {
    hash: '0x2e8b53c7a1f94d60b9e2a8c5d1f0a3b7e9c4d6f8a0',
    kind: 'mint',
    summary: 'Mint Void Orb #003',
    value: '1,2 ETH',
    time: '18 Nov 2026, 18:33',
    status: 'pending',
  },
  {
    hash: '0x7f1a9c4d6b2e85a30c5d8f1a4b7e0c3d6f9a2b5c8',
    kind: 'stake',
    summary: 'Stake 0,8 ETH di Lido',
    value: '$2.040',
    time: '18 Nov 2026, 14:08',
    status: 'success',
  },
  {
    hash: '0x4b8d12e6a9c03f57d1e5a7c9b2f4a6d8e0c1b3a5f7',
    kind: 'swap',
    summary: 'Swap 2.000 USDC → 1,9 ETH',
    value: '$2.000',
    time: '17 Nov 2026, 20:41',
    status: 'failed',
  },
  {
    hash: '0x6c3e87a1d5b94f20a8e4c6d0f2a5b7e9c1d3f5a7b9',
    kind: 'revoke',
    summary: 'Revoke WETH → Uniswap V3 Router',
    value: '—',
    time: '17 Nov 2026, 16:19',
    status: 'success',
  },
  {
    hash: '0xa1d5f8c3b7e02a94d6c8f0a3b5e7d1c9f4a6b8e0d2',
    kind: 'mint',
    summary: 'Mint Prisma Blob #008',
    value: '0,65 ETH',
    time: '17 Nov 2026, 12:55',
    status: 'success',
  },
  {
    hash: '0x8e2b64c9a5f17d30b4c7e1a9d3f6a8c0e2b4d6f8a1',
    kind: 'stake',
    summary: 'Stake 500 USDT di Venus',
    value: '$500',
    time: '16 Nov 2026, 19:24',
    status: 'success',
  },
  {
    hash: '0x1f7c93a5d9b42e68a0c4e8b1d5f7a9c3e6f0a2b4d8',
    kind: 'swap',
    summary: 'Swap 0,3 BNB → 178 USDT',
    value: '$178',
    time: '16 Nov 2026, 10:02',
    status: 'success',
  },
] as const;
