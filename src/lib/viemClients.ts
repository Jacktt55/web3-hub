import { createPublicClient, http } from 'viem';
import { arbitrum, base, bsc, mainnet, polygon } from 'viem/chains';
import type { ChainId } from '../types';

/**
 * viem public clients over the public RPCs — no API key, no Node
 * polyfills in Vite. Used for real gas prices (getGasPrice) and any
 * other read-only call the app needs.
 *
 * First transport per chain is the one named in the spec
 * (eth.llamarpc.com / mainnet.base.org / arb1.arbitrum.io); the
 * second is the existing public fallback.
 *
 * Each entry keeps its own chain-specific client type (Base has
 * deposit transactions, so the clients are not interchangeable) —
 * the map is a union, not a single narrowed type.
 */
const CLIENTS = {
  ethereum: createPublicClient({
    chain: mainnet,
    transport: http('https://eth.llamarpc.com'),
  }),
  bsc: createPublicClient({
    chain: bsc,
    transport: http('https://bsc-dataseed.binance.org'),
  }),
  base: createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  }),
  arbitrum: createPublicClient({
    chain: arbitrum,
    transport: http('https://arb1.arbitrum.io/rpc'),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http('https://polygon-rpc.com'),
  }),
  solana: null,
  bitcoin: null,
} satisfies Record<ChainId, unknown>;

/** Native gas price (wei) for an EVM chain via viem getGasPrice(). */
export async function getGasPriceWei(chain: ChainId): Promise<bigint> {
  const client = CLIENTS[chain];
  if (!client) throw new Error(`No viem client for ${chain}`);
  return client.getGasPrice();
}
