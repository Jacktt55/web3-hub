import type { ChainId } from '../types';

/**
 * Minimal dependency-free JSON-RPC client over public endpoints.
 * No API keys. Endpoints are tried in order until one answers;
 * a failed endpoint never blocks the app (caller falls back to seed).
 */

export const CHAIN_ID_NUMBERS: Record<ChainId, number> = {
  ethereum: 1,
  bsc: 56,
  base: 8453,
  solana: 101,
  arbitrum: 42161,
  polygon: 137,
  bitcoin: 0,
};

/** CoinGecko id of each chain's native token (for gas USD math). */
export const NATIVE_COINGECKO_ID: Partial<Record<ChainId, string>> = {
  ethereum: 'ethereum',
  bsc: 'binancecoin',
  base: 'ethereum',
  arbitrum: 'ethereum',
  polygon: 'matic-network',
  solana: 'solana',
  bitcoin: 'bitcoin',
};

const RPC_ENDPOINTS: Partial<Record<ChainId, readonly string[]>> = {
  ethereum: [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
  ],
  bsc: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.bnbchain.org',
    'https://bsc-dataseed2.bnbchain.org',
    'https://bsc.publicnode.com',
  ],
  base: ['https://mainnet.base.org', 'https://base.llamarpc.com'],
  arbitrum: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum-one.publicnode.com',
  ],
  polygon: [
    'https://polygon-rpc.com',
    'https://polygon-bor.publicnode.com',
  ],
};

const REQUEST_TIMEOUT_MS = 8000;

async function postJson(url: string, body: unknown): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as unknown;
  } finally {
    window.clearTimeout(timer);
  }
}

interface JsonRpcResponse {
  jsonrpc?: string;
  id?: number;
  result?: unknown;
  error?: { code?: number; message?: string };
}

/** Try each endpoint in order until one returns a result. */
export async function rpcRequest(
  chain: ChainId,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const endpoints = RPC_ENDPOINTS[chain] ?? [];
  let lastError: unknown = new Error(`No RPC endpoint for ${chain}`);
  for (const url of endpoints) {
    try {
      const res = (await postJson(url, {
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      })) as JsonRpcResponse;
      if (res.error) throw new Error(res.error.message ?? 'RPC error');
      return res.result;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function ethCall(
  chain: ChainId,
  to: string,
  data: string,
): Promise<string> {
  const result = await rpcRequest(chain, 'eth_call', [{ to, data }, 'latest']);
  if (typeof result !== 'string') throw new Error('eth_call returned no hex');
  return result;
}

export async function ethGetBalance(
  chain: ChainId,
  address: string,
): Promise<bigint> {
  const result = await rpcRequest(chain, 'eth_getBalance', [
    address,
    'latest',
  ]);
  return BigInt(result as string);
}

export async function ethGetCode(
  chain: ChainId,
  address: string,
): Promise<string> {
  const result = await rpcRequest(chain, 'eth_getCode', [address, 'latest']);
  return typeof result === 'string' ? result : '0x';
}

export async function ethGasPrice(chain: ChainId): Promise<bigint> {
  const result = await rpcRequest(chain, 'eth_gasPrice', []);
  return BigInt(result as string);
}

export async function ethEstimateGas(
  chain: ChainId,
  tx: { from: string; to: string; data: string; value?: string },
): Promise<bigint> {
  const result = await rpcRequest(chain, 'eth_estimateGas', [tx]);
  return BigInt(result as string);
}

/* ---------------- ABI encoding / decoding (minimal) ---------------- */

export function encodeAddress(address: string): string {
  return address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

export function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, '0');
}

export function decodeUint256(hex: string): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean === '') return 0n;
  return BigInt(`0x${clean.slice(-64)}`);
}

/** Decode an ABI-encoded string return value (tokenURI, name, symbol). */
export function decodeAbiString(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length < 128) return '';
  const len = Number(BigInt(`0x${clean.slice(64, 128)}`));
  const dataHex = clean.slice(128, 128 + len * 2);
  const bytes = new Uint8Array(Math.floor(dataHex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(dataHex.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** Well-known function selectors (verified against public ABIs). */
export const SELECTORS = {
  balanceOf: '0x70a08231',
  allowance: '0xdd62ed3e',
  approve: '0x095ea7b3',
  tokenURI: '0xc87b56dd',
  decimals: '0x313ce567',
  name: '0x06fdde03',
  symbol: '0x95d89b41',
} as const;
