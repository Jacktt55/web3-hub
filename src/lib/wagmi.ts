import { createConfig, http } from 'wagmi';
import { arbitrum, base, bsc, mainnet, polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

/**
 * wagmi + viem config — real wallet connectivity.
 *
 * - Injected (MetaMask / wallet browser): always available, no key.
 * - WalletConnect: only when VITE_WALLETCONNECT_PROJECT_ID is set
 *   (Reown Cloud project id). Without it the option is hidden — the
 *   app never invents a project id.
 * - Transports use the same public RPC endpoints as src/lib/rpc.ts.
 * - No wallet installed? The manual address entry ("mode demo") in
 *   WalletModal stays as the fallback — read-only, no signing.
 */
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as
  | string
  | undefined;

export const walletConnectEnabled = Boolean(projectId);

export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, base, arbitrum, polygon],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [mainnet.id]: http('https://ethereum-rpc.publicnode.com'),
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
    [base.id]: http('https://mainnet.base.org'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [polygon.id]: http('https://polygon-rpc.com'),
  },
});

/** Chain id (wagmi/viem) → display name for the wallet pill. */
export function chainIdToName(chainId: number | undefined): string | null {
  switch (chainId) {
    case 1:
      return 'Ethereum';
    case 56:
      return 'BSC';
    case 8453:
      return 'Base';
    case 42161:
      return 'Arbitrum';
    case 137:
      return 'Polygon';
    default:
      return chainId !== undefined ? `Chain ${chainId}` : null;
  }
}
