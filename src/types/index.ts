/**
 * Web3 Hub — shared typed data models.
 * Strict TypeScript: no `any`, no enums (erasableSyntaxOnly), all fields
 * explicit. Every feature module imports its models from here.
 */

/** EVM-style address. */
export type Address = `0x${string}`;

/** Supported chains (seed set — extend as live coverage grows). */
export type ChainId =
  | 'ethereum'
  | 'bsc'
  | 'base'
  | 'solana'
  | 'arbitrum'
  | 'polygon'
  | 'bitcoin';

export interface ChainInfo {
  id: ChainId;
  name: string;
  /** Native token symbol, e.g. ETH, BNB, SOL. */
  nativeSymbol: string;
  /** Brand color used for dots, badges and charts. */
  color: string;
  explorer: string;
}

/* ------------------------------------------------------------------ */
/* Pillar 1 — Crypto & DeFi                                            */
/* ------------------------------------------------------------------ */

export interface TokenHolding {
  id: string;
  symbol: string;
  name: string;
  chain: ChainId;
  /** Amount held, in token units. */
  balance: number;
  /** Price per token in USD. */
  priceUsd: number;
  /** 24h price change in percent. */
  change24h: number;
  /** Accent color for the token dot / chart slice. */
  logoColor: string;
}

export type GasStatus = 'live' | 'estimate' | 'snapshot';

export interface GasFee {
  chain: ChainId;
  /** Current gas price in gwei (0 for Solana-style fee markets). */
  gasPriceGwei: number;
  /** USD cost of a plain native transfer at this gas price. */
  transferUsd: number;
  /** USD cost of a typical swap at this gas price. */
  swapUsd: number;
  updatedAt: string; // ISO 8601
  status: GasStatus;
}

export type PoolCategory = 'lending' | 'lp' | 'staking' | 'vault';
export type PoolRisk = 'low' | 'medium' | 'high';

export interface YieldPool {
  id: string;
  protocol: string;
  pair: string;
  chain: ChainId;
  /** Annual percentage yield. */
  apy: number;
  tvlUsd: number;
  risk: PoolRisk;
  category: PoolCategory;
}

/* ------------------------------------------------------------------ */
/* Pillar 2 — NFT Utility & Showcase                                   */
/* ------------------------------------------------------------------ */

export type NftClass = 'Scoop' | 'Legend' | 'Platinum' | 'Jade' | 'Common';

export interface NftTrait {
  trait_type: string;
  value: string;
}

export interface NftItem {
  id: string;
  tokenId: string;
  name: string;
  collection: string;
  /** Contract address when recorded; omitted when unknown. */
  contract?: Address;
  chain: ChainId;
  /** Artwork URL (placeholder seeds until real media is wired). */
  image: string;
  class: NftClass;
  /** Floor price in USD when known. */
  floorUsd?: number;
  acquiredAt: string; // ISO 8601
  traits: NftTrait[];
}

export type MintPassStatus = 'live' | 'upcoming' | 'soldout';

export interface MintPass {
  id: string;
  title: string;
  event: string;
  /** Human-readable date/time, e.g. "20 Nov 2026, 07:00 WIB". */
  date: string;
  /** Display price, e.g. "Free" or "0.001 BNB". */
  price: string;
  supply: number;
  minted: number;
  status: MintPassStatus;
}

/* ------------------------------------------------------------------ */
/* Pillar 3 — Web3 Security                                            */
/* ------------------------------------------------------------------ */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ContractAudit {
  address: Address;
  name: string;
  chain: ChainId;
  risk: RiskLevel;
  /** Safety score 0–100 (higher = safer). */
  score: number;
  /** Human-readable findings; empty when clean. */
  flags: string[];
  /** Whether the source is verified on the chain explorer. */
  verified: boolean;
  checkedAt: string; // ISO 8601
}

export interface TokenApproval {
  id: string;
  token: string;
  spender: string;
  spenderAddress: Address;
  chain: ChainId;
  /** "Unlimited" or a concrete amount, e.g. "10 BNB". */
  allowance: string;
  risk: RiskLevel;
  lastUsed: string; // ISO 8601
}

/* ------------------------------------------------------------------ */
/* Activity & navigation                                               */
/* ------------------------------------------------------------------ */

export type ActivityKind =
  | 'mint'
  | 'transfer'
  | 'swap'
  | 'approval'
  | 'scan'
  | 'claim'
  | 'submit';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  chain: ChainId;
  txHash?: string;
  timestamp: string; // ISO 8601
}

/** The five primary views of the app. */
export type View = 'overview' | 'crypto' | 'nft' | 'security' | 'activity';

/* ------------------------- Prepared transactions -------------------- */

/**
 * A transaction prepared for preview. Nothing here signs or broadcasts;
 * execution happens in chat with Guts after the user's explicit
 * confirmation. gasEstimate null = could not be estimated (preview only).
 */
export interface PreparedTx {
  title: string;
  chain: ChainId;
  from: Address;
  to: Address;
  functionName: string;
  /** Display value, e.g. '0'. */
  value: string;
  gasEstimate: bigint | null;
  gasPriceWei: bigint;
  feeNative: string;
  feeUsd: string;
  calldata: string;
  note?: string;
  /** One-line copyable summary for the chat confirmation. */
  summary: string;
}
