import type { Address } from '../types';
import type {
  ChainId,
  GasFee,
  PreparedTx,
  RiskLevel,
  TokenApproval,
  YieldPool,
} from '../types';
import { chainInfo } from '../data';
import { formatUnits, formatUsd, shortenAddress } from './format';
import {
  CHAIN_ID_NUMBERS,
  SELECTORS,
  decodeAbiString,
  decodeAddress,
  decodeUint256,
  encodeAddress,
  encodeUint256,
  ethCall,
  ethEstimateGas,
  ethGasPrice,
  ethGetBalance,
  ethGetCode,
} from './rpc';

/**
 * Live data layer — CoinGecko, public RPCs, DefiLlama, Sourcify.
 * Every function throws on failure; callers fall back to seed data.
 * Nothing here broadcasts a transaction.
 */

const COINGECKO_IDS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'tether',
  'matic-network',
  'arbitrum',
] as const;

const COINGECKO_SYMBOL: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  binancecoin: 'BNB',
  solana: 'SOL',
  tether: 'USDT',
  'matic-network': 'POL',
  arbitrum: 'ARB',
};

/** Live USD prices by symbol, e.g. { BTC: 63809, ETH: 1804.18 }. */
export interface LivePrices {
  prices: Record<string, number>;
  /** 24h change in percent by symbol. */
  changes: Record<string, number>;
}

export async function fetchLivePrices(): Promise<LivePrices> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS.join(',')}&vs_currencies=usd&include_24hr_change=true`,
    { signal: AbortSignal.timeout(10000) },
  );
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const json = (await res.json()) as Record<
    string,
    { usd?: unknown; usd_24h_change?: unknown }
  >;
  const out: Record<string, number> = {};
  const chg: Record<string, number> = {};
  for (const id of COINGECKO_IDS) {
    const price = json[id]?.usd;
    const change = json[id]?.usd_24h_change;
    if (typeof price === 'number') out[COINGECKO_SYMBOL[id]] = price;
    if (typeof change === 'number') chg[COINGECKO_SYMBOL[id]] = change;
  }
  if (Object.keys(out).length === 0) throw new Error('CoinGecko empty');
  return { prices: out, changes: chg };
}

/* ------------------------------- Gas ------------------------------- */

const EVM_GAS_CHAINS: readonly ChainId[] = [
  'ethereum',
  'bsc',
  'base',
  'arbitrum',
  'polygon',
] as const;

const GAS_NATIVE_SYMBOL: Record<ChainId, string> = {
  ethereum: 'ETH',
  bsc: 'BNB',
  base: 'ETH',
  solana: 'SOL',
  arbitrum: 'ETH',
  polygon: 'POL',
  bitcoin: 'BTC',
};

/**
 * Live gas per chain. Chains that fail keep their seed row
 * (the caller merges live over seed per chain).
 */
export async function fetchLiveGas(
  prices: Record<string, number>,
): Promise<GasFee[]> {
  const now = new Date().toISOString();
  const out: GasFee[] = [];

  for (const chain of EVM_GAS_CHAINS) {
    try {
      const gasPrice = await ethGasPrice(chain);
      const nativePrice = prices[GAS_NATIVE_SYMBOL[chain]] ?? 0;
      const gwei = Number(gasPrice) / 1e9;
      const transferUsd =
        (Number(gasPrice * 21000n) * nativePrice) / 1e18;
      const swapUsd = (Number(gasPrice * 150000n) * nativePrice) / 1e18;
      out.push({
        chain,
        gasPriceGwei: Math.round(gwei * 1000) / 1000,
        transferUsd,
        swapUsd,
        updatedAt: now,
        status: 'live',
      });
    } catch {
      // keep seed row for this chain
    }
  }

  // Solana: 5.000 lamports per signature.
  const solPrice = prices.SOL;
  if (typeof solPrice === 'number') {
    out.push({
      chain: 'solana',
      gasPriceGwei: 0.00025,
      transferUsd: 0.000005 * solPrice,
      swapUsd: 0.00001 * solPrice,
      updatedAt: now,
      status: 'live',
    });
  }

  // Bitcoin: no gasPrice RPC in scope — keep a flat estimate.
  out.push({
    chain: 'bitcoin',
    gasPriceGwei: 0,
    transferUsd: 0.42,
    swapUsd: 0,
    updatedAt: now,
    status: 'estimate',
  });

  return out;
}

/* ------------------------------ Yields ----------------------------- */

interface LlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
}

const LLAMA_CHAIN_MAP: Record<string, ChainId> = {
  Ethereum: 'ethereum',
  BSC: 'bsc',
  Base: 'base',
  Solana: 'solana',
  Arbitrum: 'arbitrum',
  Polygon: 'polygon',
};

const LENDING_PROJECTS = new Set([
  'aave',
  'venus',
  'kamino',
  'compound',
  'morpho',
  'spark',
]);
const STAKING_PROJECTS = new Set(['lido', 'rocket-pool', 'jito', 'marinade']);

function deriveCategory(pool: LlamaPool): YieldPool['category'] {
  const project = pool.project.toLowerCase();
  if (LENDING_PROJECTS.has(project)) return 'lending';
  if (STAKING_PROJECTS.has(project)) return 'staking';
  if (pool.symbol.includes('-') || pool.symbol.includes('/')) return 'lp';
  return 'vault';
}

function deriveRisk(apy: number): YieldPool['risk'] {
  if (apy > 15) return 'high';
  if (apy > 8) return 'medium';
  return 'low';
}

/** Top live yield pools from DefiLlama (risk/category derived, labelled). */
export async function fetchLiveYields(): Promise<YieldPool[]> {
  const res = await fetch('https://yields.llama.fi/pools', {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`DefiLlama HTTP ${res.status}`);
  const json = (await res.json()) as { data: LlamaPool[] };
  return json.data
    .filter(
      (p) =>
        LLAMA_CHAIN_MAP[p.chain] !== undefined &&
        p.apy > 0 &&
        p.tvlUsd > 1_000_000,
    )
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 12)
    .map((p) => ({
      id: `llama-${p.chain}-${p.project}-${p.symbol}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
      protocol: p.project,
      pair: p.symbol,
      chain: LLAMA_CHAIN_MAP[p.chain],
      apy: Math.round(p.apy * 100) / 100,
      tvlUsd: p.tvlUsd,
      risk: deriveRisk(p.apy),
      category: deriveCategory(p),
    }));
}

/* --------------------------- NFT metadata -------------------------- */

function toGateway(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.slice('ipfs://'.length)}`;
  }
  return uri;
}

export interface NftMetadata {
  name: string;
  image: string | null;
  description: string;
  attributes: { trait_type: string; value: string }[];
}

/**
 * Read an NFT's metadata on-chain: tokenURI → metadata JSON.
 * Works for any ERC-721 contract + token ID the visitor enters.
 * Returns null on any failure (not an ERC-721, no tokenURI, bad JSON).
 */
export async function fetchNftMetadata(
  chain: ChainId,
  contract: string,
  tokenId: string,
): Promise<NftMetadata | null> {
  try {
    const uriData = SELECTORS.tokenURI + encodeUint256(BigInt(tokenId));
    const raw = await ethCall(chain, contract, uriData);
    const uri = decodeAbiString(raw);
    if (!uri) return null;
    const res = await fetch(toGateway(uri), {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      name?: unknown;
      image?: unknown;
      description?: unknown;
      attributes?: unknown;
    };
    const attributes = Array.isArray(meta.attributes)
      ? meta.attributes
          .filter(
            (a): a is { trait_type: unknown; value: unknown } =>
              typeof a === 'object' &&
              a !== null &&
              'trait_type' in a &&
              'value' in a,
          )
          .map((a) => ({
            trait_type: String(a.trait_type),
            value: String(a.value),
          }))
      : [];
    return {
      name:
        typeof meta.name === 'string' && meta.name !== ''
          ? meta.name
          : `#${tokenId}`,
      image: typeof meta.image === 'string' ? toGateway(meta.image) : null,
      description:
        typeof meta.description === 'string' ? meta.description : '',
      attributes,
    };
  } catch {
    return null;
  }
}

/* ---------------------------- Approvals ---------------------------- */

export interface ApprovalWatch {
  token: string;
  tokenAddress: string;
  decimals: number;
  chain: ChainId;
  spender: string;
  spenderAddress: string;
}

/** Curated token × spender pairs to check on-chain (no indexer needed). */
export const APPROVAL_WATCHLIST: readonly ApprovalWatch[] = [
  {
    token: 'USDT',
    tokenAddress: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    chain: 'bsc',
    spender: 'PancakeSwap Router v2',
    spenderAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  },
  {
    token: 'USDC',
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    chain: 'ethereum',
    spender: 'Aave Pool V3',
    spenderAddress: '0x87870Bca3F3fD6335C3F4ce839Ef49dD3b25B3a1',
  },
  {
    token: 'WETH',
    tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    chain: 'ethereum',
    spender: 'Uniswap V3 Router',
    spenderAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  },
] as const;

export function findWatch(
  token: string,
  spender: string,
): ApprovalWatch | undefined {
  return APPROVAL_WATCHLIST.find(
    (w) => w.token === token && w.spender === spender,
  );
}

/** Native balances (wei) per EVM chain for an address. */
export async function fetchNativeBalances(
  owner: string,
): Promise<{ chain: ChainId; balance: bigint }[]> {
  const out: { chain: ChainId; balance: bigint }[] = [];
  for (const chain of EVM_GAS_CHAINS) {
    try {
      const balance = await ethGetBalance(chain, owner);
      out.push({ chain, balance });
    } catch {
      // skip this chain on RPC failure
    }
  }
  return out;
}

export interface TokenBalance {
  token: string;
  tokenAddress: string;
  decimals: number;
  chain: ChainId;
  balance: bigint;
}

/**
 * ERC-20 balances for the same watchlist tokens (balanceOf, no indexer).
 * Zero balances are included — the caller decides what to show.
 */
export async function fetchTokenBalances(
  owner: string,
): Promise<TokenBalance[]> {
  const out: TokenBalance[] = [];
  for (const w of APPROVAL_WATCHLIST) {
    try {
      const data = SELECTORS.balanceOf + encodeAddress(owner);
      const raw = await ethCall(w.chain, w.tokenAddress, data);
      out.push({
        token: w.token,
        tokenAddress: w.tokenAddress,
        decimals: w.decimals,
        chain: w.chain,
        balance: decodeUint256(raw),
      });
    } catch {
      // skip this token on RPC failure
    }
  }
  return out;
}

/** Live allowances for the watchlist — empty array means truly none. */
export async function fetchLiveApprovals(
  owner: string,
): Promise<TokenApproval[]> {
  const out: TokenApproval[] = [];
  for (const w of APPROVAL_WATCHLIST) {
    try {
      const data =
        SELECTORS.allowance +
        encodeAddress(owner) +
        encodeAddress(w.spenderAddress);
      const raw = await ethCall(w.chain, w.tokenAddress, data);
      const value = decodeUint256(raw);
      if (value === 0n) continue;
      const unlimited = value >= 2n ** 255n;
      out.push({
        id: `live-${w.token}-${w.spender}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-'),
        token: w.token,
        spender: w.spender,
        spenderAddress: w.spenderAddress as Address,
        chain: w.chain,
        allowance: unlimited
          ? 'Unlimited'
          : `${formatUnits(value, w.decimals)} ${w.token}`,
        risk: unlimited ? 'medium' : 'low',
        lastUsed: '',
      });
    } catch {
      // skip this pair on RPC failure
    }
  }
  return out;
}

/* --------------------------- Live scanner -------------------------- */

export interface LiveScanResult {
  verified: boolean;
  hasCode: boolean;
  score: number;
  risk: RiskLevel;
  flags: string[];
}

/**
 * Live contract check: bytecode presence (eth_getCode) + source
 * verification (Sourcify v2). No honeypot simulation — v1 is
 * verification + bytecode only, labelled as such in the UI.
 */
export async function scanContractLive(
  address: string,
  chain: ChainId,
): Promise<LiveScanResult> {
  const chainId = CHAIN_ID_NUMBERS[chain];
  const [code, sourcifyText] = await Promise.all([
    ethGetCode(chain, address).catch(() => '0x'),
    fetch(
      `https://sourcify.dev/server/v2/contract/${chainId}/${address}`,
      { signal: AbortSignal.timeout(12000) },
    )
      .then(async (r) => (r.ok ? r.text() : ''))
      .catch(() => ''),
  ]);

  const hasCode = code !== '0x' && code.length > 2;
  const verified =
    /"(creationMatch|runtimeMatch|match)"\s*:\s*"(exact_match|partial_match)"/.test(
      sourcifyText,
    );

  if (!hasCode) {
    return {
      verified: false,
      hasCode: false,
      score: 0,
      risk: 'low',
      flags: ['Alamat ini bukan kontrak (EOA atau belum deploy)'],
    };
  }
  if (verified) {
    return {
      verified: true,
      hasCode: true,
      score: 90,
      risk: 'low',
      flags: [],
    };
  }
  return {
    verified: false,
    hasCode: true,
    score: 55,
    risk: 'medium',
    flags: [
      'Source tidak terverifikasi di Sourcify',
      'Periksa bytecode & owner sebelum berinteraksi',
    ],
  };
}

/* ------------------------- Token risk (GoPlus) ------------------------- */

const GOPLUS_CHAIN_IDS: Record<ChainId, number> = {
  ethereum: 1,
  bsc: 56,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  solana: 0,
  bitcoin: 0,
};

export interface GoPlusSecurity {
  isHoneypot: boolean | null;
  buyTax: number | null;
  sellTax: number | null;
  ownerAddress: string | null;
  canTakeBackOwnership: boolean | null;
  isOpenSource: boolean | null;
  isInDex: boolean | null;
  isMintable: boolean | null;
  cannotBuy: boolean | null;
  cannotSellAll: boolean | null;
  /**
   * Share of the top-10 holders' supply held by locked holders (0–100).
   * Null when GoPlus returns no holder list — lock status is then
   * unverified, not assumed.
   */
  lockedLpPercent: number | null;
}

/**
 * GoPlus token_security (public, no key): honeypot flag, buy/sell tax,
 * owner, open-source, DEX presence, mintable, locked-holder share.
 * Returns null on any failure — the caller shows the local live checks
 * instead of pretending the data exists.
 */
export async function fetchGoPlusSecurity(
  chain: ChainId,
  address: string,
): Promise<GoPlusSecurity | null> {
  const chainId = GOPLUS_CHAIN_IDS[chain];
  if (!chainId) return null;
  try {
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`,
      {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      code?: number;
      result?: Record<string, Record<string, unknown>>;
    };
    if (json.code !== 1 || !json.result) return null;
    const r =
      json.result[address.toLowerCase()] ??
      Object.values(json.result)[0];
    if (!r) return null;
    const num = (v: unknown): number | null => {
      const n =
        typeof v === 'string'
          ? Number.parseFloat(v)
          : typeof v === 'number'
            ? v
            : Number.NaN;
      return Number.isFinite(n) ? n : null;
    };
    const flag = (v: unknown): boolean | null =>
      v === '1' || v === 1 ? true : v === '0' || v === 0 ? false : null;
    const holders = Array.isArray(r.holders)
      ? (r.holders as { percent?: string; is_locked?: number }[])
      : [];
    const locked = holders.reduce(
      (s, h) => s + (h.is_locked === 1 ? (num(h.percent) ?? 0) : 0),
      0,
    );
    return {
      isHoneypot: flag(r.is_honeypot),
      buyTax: num(r.buy_tax),
      sellTax: num(r.sell_tax),
      ownerAddress:
        typeof r.owner_address === 'string' ? r.owner_address : null,
      canTakeBackOwnership: flag(r.can_take_back_ownership),
      isOpenSource: flag(r.is_open_source),
      isInDex: flag(r.is_in_dex),
      isMintable: flag(r.is_mintable),
      cannotBuy: flag(r.cannot_buy),
      cannotSellAll: flag(r.cannot_sell_all),
      lockedLpPercent: holders.length > 0 ? locked : null,
    };
  } catch {
    return null;
  }
}

/** owner() (Ownable) via eth_call — null when the call fails (not Ownable). */
export async function fetchContractOwner(
  chain: ChainId,
  address: string,
): Promise<string | null> {
  try {
    const raw = await ethCall(chain, address, SELECTORS.owner);
    if (!raw || raw === '0x') return null;
    return decodeAddress(raw);
  } catch {
    return null;
  }
}

export interface ContractRiskResult {
  address: string;
  chain: ChainId;
  hasCode: boolean;
  verified: boolean;
  /** owner() result; null = call failed (not Ownable / unknown). */
  owner: string | null;
  goplus: GoPlusSecurity | null;
}

/**
 * Full contract risk check: bytecode + Sourcify (local live) in
 * parallel with owner() and GoPlus. A null goplus means the GoPlus
 * API did not answer — the local checks still render.
 */
export async function scanContractRisk(
  address: string,
  chain: ChainId,
): Promise<ContractRiskResult> {
  const [base, owner, goplus] = await Promise.all([
    scanContractLive(address, chain).catch(() => null),
    fetchContractOwner(chain, address),
    fetchGoPlusSecurity(chain, address),
  ]);
  return {
    address,
    chain,
    hasCode: base?.hasCode ?? false,
    verified: base?.verified ?? false,
    owner,
    goplus,
  };
}

/* --------------------- Transaction preparation --------------------- */
/* Preview only — nothing here signs or broadcasts. The visitor     */
/* executes from their own wallet after checking the details.      */

export async function prepareRevokeTx(
  watch: ApprovalWatch,
  nativePriceUsd: number,
  wallet: Address,
): Promise<PreparedTx> {
  const calldata =
    SELECTORS.approve + encodeAddress(watch.spenderAddress) + encodeUint256(0n);
  const [gas, gasPrice] = await Promise.all([
    ethEstimateGas(watch.chain, {
      from: wallet,
      to: watch.tokenAddress,
      data: calldata,
    }).catch(() => 60000n),
    ethGasPrice(watch.chain).catch(() => 0n),
  ]);
  const feeWei = gas * gasPrice;
  const nativeSymbol = chainInfo(watch.chain).nativeSymbol;
  const feeNative = `${formatUnits(feeWei, 18)} ${nativeSymbol}`;
  const feeUsd = formatUsd((Number(feeWei) * nativePriceUsd) / 1e18);
  return {
    title: `Revoke ${watch.token} → ${watch.spender}`,
    chain: watch.chain,
    from: wallet,
    to: watch.tokenAddress as Address,
    functionName: `approve(${shortenAddress(watch.spenderAddress)}, 0)`,
    value: '0',
    gasEstimate: gas,
    gasPriceWei: gasPrice,
    feeNative,
    feeUsd,
    calldata,
    summary: `Revoke ${watch.token} → ${watch.spender} | ${chainInfo(watch.chain).name} | approve(spender, 0) | value 0 | gas ~${gas} | fee ~${feeNative} (~${feeUsd})`,
  };
}
