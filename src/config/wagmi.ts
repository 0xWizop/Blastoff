import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'BLASTOFF' }),
  ],
  transports: {
    [base.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
