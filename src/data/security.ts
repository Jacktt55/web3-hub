import type { ContractAudit, TokenApproval } from '../types';

/**
 * Seed security data.
 * Audits for the user's real contracts are from verified on-chain
 * records; the two flagged entries are labelled mock examples for the
 * scanner UI. Approvals are sample rows — the live checker reads the
 * wallet's real approvals in phase 2.
 */
export const CONTRACT_AUDITS: readonly ContractAudit[] = [
  {
    address: '0xE77D762716A98DbCDA3ECb205C0F92fBc161A64E',
    name: 'Presschain (PressEditions)',
    chain: 'bsc',
    risk: 'low',
    score: 92,
    flags: [],
    verified: true,
    checkedAt: '2026-11-19T01:00:00.000Z',
  },
  {
    address: '0xAAdD9058b3DaaB00439457D82c2C508a5cc1c393',
    name: 'AugentToken',
    chain: 'bsc',
    risk: 'low',
    score: 88,
    flags: [],
    verified: true,
    checkedAt: '2026-11-19T06:35:00.000Z',
  },
  {
    address: '0xbce48917C41BB45Ad15f859E4Bf0e4EEa74bAd5c',
    name: 'Tzero Launchpad',
    chain: 'base',
    risk: 'low',
    score: 90,
    flags: [],
    verified: true,
    checkedAt: '2026-11-14T04:00:00.000Z',
  },
  {
    address: '0x9f8a1c2d3e4f5061728394a5b6c7d8e9f0a1b2c3d',
    name: 'MockHoneypot Token (contoh)',
    chain: 'bsc',
    risk: 'high',
    score: 34,
    flags: [
      'Source tidak terverifikasi',
      'Pola honeypot: sell tax 99%',
      'Owner bisa pause transfer',
    ],
    verified: false,
    checkedAt: '2026-11-19T08:00:00.000Z',
  },
  {
    address: '0x3c2b4a59687766554433221100ffeeddccbbaa9988',
    name: 'MockProxy Vault (contoh)',
    chain: 'ethereum',
    risk: 'medium',
    score: 61,
    flags: ['Kontrak proxy — logika bisa diganti', 'Owner bisa mint'],
    verified: false,
    checkedAt: '2026-11-19T08:00:00.000Z',
  },
] as const;

export function findAudit(
  address: string,
): ContractAudit | undefined {
  const needle = address.trim().toLowerCase();
  return CONTRACT_AUDITS.find((a) => a.address.toLowerCase() === needle);
}

export const TOKEN_APPROVALS: readonly TokenApproval[] = [
  {
    id: 'appr-usdt-pancake',
    token: 'USDT',
    spender: 'PancakeSwap Router v2',
    spenderAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    chain: 'bsc',
    allowance: 'Unlimited',
    risk: 'medium',
    lastUsed: '2026-11-08T07:00:00.000Z',
  },
  {
    id: 'appr-weth-uniswap',
    token: 'WETH',
    spender: 'Uniswap V3 Router',
    spenderAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    chain: 'ethereum',
    allowance: 'Unlimited',
    risk: 'low',
    lastUsed: '2026-11-10T07:00:00.000Z',
  },
  {
    id: 'appr-usdc-aave',
    token: 'USDC',
    spender: 'Aave Pool V3',
    spenderAddress: '0x87870Bca3F3fD6335C3F4ce839Ef49dD3b25B3a1',
    chain: 'ethereum',
    allowance: 'Unlimited',
    risk: 'low',
    lastUsed: '2026-11-02T07:00:00.000Z',
  },
  {
    id: 'appr-augent-sale',
    token: 'AUGENT',
    spender: 'Augent Sale',
    spenderAddress: '0xAAdD9058b3DaaB00439457D82c2C508a5cc1c393',
    chain: 'bsc',
    allowance: '1 share',
    risk: 'low',
    lastUsed: '2026-11-19T06:35:00.000Z',
  },
] as const;
