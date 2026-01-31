import { http, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // Injected wallets (MetaMask, Rabby, Phantom, Coinbase Wallet extension, etc.)
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  // Persist connection state
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
  // Sync connected chain with network
  syncConnectedChain: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
