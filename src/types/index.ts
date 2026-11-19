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
/* Pillar 1 — Crypto & DeFi (public market data)                       */
/* ------------------------------------------------------------------ */

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

/**
 * Demo NFT for the public "My Collection" grid. These are NOT real
 * on-chain assets — they are clearly labelled demo items with
 * generative SVG artwork, so the grid never shows a broken image.
 * Visitors check their own real NFTs via "Cek NFT".
 */
export interface DemoNft {
  id: string;
  title: string;
  collection: string;
  /** Floor price in ETH (demo figure); null when unknown (real NFTs). */
  floorEth: number | null;
  tokenId: string;
  /** Rarity rank within the demo collection, e.g. 12 of 1000. */
  rarityRank: number;
  rarityTotal: number;
  traits: { trait: string; value: string }[];
  /** 'demo' = generative example, 'alchemy' = real on-chain NFT. */
  source?: 'demo' | 'alchemy';
  /** Real artwork URL (Alchemy); when absent, generative SVG is used. */
  artwork?: string;
}

/* ------------------------- Alchemy (real data) --------------------- */

/** One ERC-20 balance read from Alchemy (connected wallet only). */
export interface AlchemyTokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  /** wagmi chain id the balance was read on. */
  chainId: number;
}

/** One NFT owned by the connected wallet, read from Alchemy. */
export interface AlchemyNft {
  contractAddress: string;
  tokenId: string;
  title: string;
  collection: string;
  /** Cached image URL, or null when Alchemy has none. */
  imageUrl: string | null;
  traits: { trait: string; value: string }[];
}

/* ------------------------------------------------------------------ */
/* Pillar 3 — Web3 Security                                            */
/* ------------------------------------------------------------------ */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

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
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

/** The five primary views of the app. */
export type View = 'overview' | 'crypto' | 'nft' | 'security' | 'activity';

/* ------------------------- Prepared transactions -------------------- */

/**
 * A transaction prepared for preview. Nothing here signs or broadcasts;
 * execution happens from the visitor's own wallet after they check the
 * details. gasEstimate null = could not be estimated (preview only).
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
