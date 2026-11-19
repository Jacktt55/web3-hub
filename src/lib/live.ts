import type { Address } from '../types';
import type {
  ChainId,
  GasFee,
  NftItem,
  PreparedTx,
  RiskLevel,
  TokenApproval,
  YieldPool,
} from '../types';
import {
  TOKEN_APPROVALS,
  WALLET_ADDRESS,
  chainInfo,
} from '../data';
import { formatUsd, shortenAddress } from './format';
import {
  CHAIN_ID_NUMBERS,
  SELECTORS,
  decodeAbiString,
  decodeUint256,
  encodeAddress,
  encodeUint256,
  ethCall,
  ethEstimateGas,
  ethGasPrice,
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
] as const;

const COINGECKO_SYMBOL: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  binancecoin: 'BNB',
  solana: 'SOL',
  tether: 'USDT',
  'matic-network': 'POL',
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

/**
 * Resolve an NFT's real artwork via on-chain tokenURI → metadata JSON.
 * Returns null on any failure; the caller keeps the placeholder image.
 */
export async function resolveNftImage(nft: NftItem): Promise<string | null> {
  if (!nft.contract) return null;
  try {
    const data =
      SELECTORS.tokenURI + encodeUint256(BigInt(nft.tokenId));
    const raw = await ethCall(nft.chain, nft.contract, data);
    const uri = decodeAbiString(raw);
    if (!uri) return null;
    const res = await fetch(toGateway(uri), {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const meta = (await res.json()) as { image?: unknown };
    return typeof meta.image === 'string' ? toGateway(meta.image) : null;
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
  {
    token: 'AUGENT',
    tokenAddress: '0xAAdD9058b3DaaB00439457D82c2C508a5cc1c393',
    decimals: 18,
    chain: 'bsc',
    spender: 'Augent Sale',
    spenderAddress: '0xAAdD9058b3DaaB00439457D82c2C508a5cc1c393',
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

function formatUnits(value: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const frac = value % divisor;
  if (frac === 0n) return whole.toString();
  const fracStr = frac
    .toString()
    .padStart(decimals, '0')
    .slice(0, 4)
    .replace(/0+$/, '');
  return fracStr === '' ? whole.toString() : `${whole}.${fracStr}`;
}

/** Live allowances for the watchlist — empty array means truly none. */
export async function fetchLiveApprovals(): Promise<TokenApproval[]> {
  const out: TokenApproval[] = [];
  for (const w of APPROVAL_WATCHLIST) {
    try {
      const data =
        SELECTORS.allowance +
        encodeAddress(WALLET_ADDRESS) +
        encodeAddress(w.spenderAddress);
      const raw = await ethCall(w.chain, w.tokenAddress, data);
      const value = decodeUint256(raw);
      if (value === 0n) continue;
      const unlimited = value >= 2n ** 255n;
      const seed = TOKEN_APPROVALS.find(
        (a) => a.token === w.token && a.spender === w.spender,
      );
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
        lastUsed: seed?.lastUsed ?? '',
      });
    } catch {
      // skip this pair on RPC failure
    }
  }
  return out;
}

/* ------------------------- AUGENT pool status ---------------------- */

export const AUGENT_CONTRACT =
  '0xAAdD9058b3DaaB00439457D82c2C508a5cc1c393' as const;

/** phase(): 1 = sale, 2 = ended, 3 = pool open (claimable). */
export async function fetchAugentStatus(): Promise<{
  phase: number;
  claimable: bigint;
} | null> {
  try {
    const [phaseRaw, claimRaw] = await Promise.all([
      ethCall('bsc', AUGENT_CONTRACT, SELECTORS.augentPhase),
      ethCall(
        'bsc',
        AUGENT_CONTRACT,
        SELECTORS.augentClaimableOf + encodeAddress(WALLET_ADDRESS),
      ),
    ]);
    return {
      phase: Number(decodeUint256(phaseRaw)),
      claimable: decodeUint256(claimRaw),
    };
  } catch {
    return null;
  }
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

/* --------------------- Transaction preparation --------------------- */
/* Preview only — nothing here signs or broadcasts. Execution happens */
/* in chat with Guts after the user's explicit confirmation.          */

export async function prepareRevokeTx(
  watch: ApprovalWatch,
  nativePriceUsd: number,
): Promise<PreparedTx> {
  const calldata =
    SELECTORS.approve + encodeAddress(watch.spenderAddress) + encodeUint256(0n);
  const [gas, gasPrice] = await Promise.all([
    ethEstimateGas(watch.chain, {
      from: WALLET_ADDRESS,
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
    from: WALLET_ADDRESS,
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

export async function prepareAugentClaimTx(
  nativePriceUsd: number,
): Promise<PreparedTx> {
  const calldata = SELECTORS.augentClaim;
  const [gas, gasPrice, estimated] = await Promise.all([
    ethEstimateGas('bsc', {
      from: WALLET_ADDRESS,
      to: AUGENT_CONTRACT,
      data: calldata,
    })
      .then((g) => ({ gas: g, ok: true }))
      .catch(() => ({ gas: 100000n, ok: false })),
    ethGasPrice('bsc').catch(() => 0n),
  ]).then(([g, p]) => [g.gas, p, g.ok] as const);
  const feeWei = gas * gasPrice;
  const feeNative = `${formatUnits(feeWei, 18)} BNB`;
  const feeUsd = formatUsd((Number(feeWei) * nativePriceUsd) / 1e18);
  return {
    title: 'Claim 200.000 AUGENT',
    chain: 'bsc',
    from: WALLET_ADDRESS,
    to: AUGENT_CONTRACT as Address,
    functionName: 'claim()',
    value: '0',
    gasEstimate: estimated ? gas : null,
    gasPriceWei: gasPrice,
    feeNative,
    feeUsd,
    calldata,
    note: estimated
      ? undefined
      : 'Estimasi gas gagal — kemungkinan pool belum buka (fase bukan 3). Jangan eksekusi sebelum fase 3 terkonfirmasi.',
    summary: `Claim AUGENT | BSC | claim() | value 0 | gas ~${gas} | fee ~${feeNative} (~${feeUsd})`,
  };
}

/** Static preview for Presschain printFree — no live reads (Presschain ditunda). */
export function preparePresschainPreview(): PreparedTx {
  return {
    title: 'Mint gratis Presschain Edition 9',
    chain: 'bsc',
    from: WALLET_ADDRESS,
    to: '0xE77D762716A98DbCDA3ECb205C0F92fBc161A64E',
    functionName: 'printFree(<jawaban>)',
    value: '0',
    gasEstimate: null,
    gasPriceWei: 0n,
    feeNative: '—',
    feeUsd: '—',
    calldata: `${SELECTORS.presschainPrintFree}…`,
    note: 'Jawaban soal Agent ID & estimasi gas diverifikasi Guts di chat sebelum eksekusi — cek edisi 9 terjadwal besok 07:05 WIB.',
    summary:
      'Mint gratis Presschain Edition 9 | BSC | printFree(<jawaban>) | value 0 | jawaban + gas diverifikasi di chat',
  };
}
