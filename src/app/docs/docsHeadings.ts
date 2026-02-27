export type DocHeading = { id: string; label: string; level: 2 | 3 };

export const DOCS_HEADINGS: Record<string, DocHeading[]> = {
  'launch-mechanism': [
    { id: 'overview', label: 'Overview', level: 2 },
    { id: 'token-lifecycle', label: 'Token lifecycle', level: 2 },
    { id: 'dex', label: 'DEX & swaps', level: 2 },
  ],
  'create-token': [
    { id: 'overview', label: 'Overview', level: 2 },
    { id: 'flow', label: 'Flow', level: 2 },
    { id: 'on-chain', label: 'On-chain', level: 2 },
  ],
  'tokens-api': [
    { id: 'overview', label: 'Overview', level: 2 },
    { id: 'endpoints', label: 'Endpoints', level: 2 },
  ],
  'launch-api': [
    { id: 'overview', label: 'Overview', level: 2 },
    { id: 'endpoints', label: 'Endpoints', level: 2 },
  ],
  'swap-api': [
    { id: 'overview', label: 'Overview', level: 2 },
    { id: 'endpoints', label: 'Endpoints', level: 2 },
  ],
  'other-apis': [
    { id: 'overview', label: 'Overview', level: 2 },
    { id: 'endpoints', label: 'Endpoints', level: 2 },
  ],
  networks: [
    { id: 'overview', label: 'Overview', level: 2 },
    { id: 'base-sepolia', label: 'Base Sepolia', level: 3 },
    { id: 'base-mainnet', label: 'Base Mainnet', level: 3 },
    { id: 'firestore', label: 'Firestore', level: 2 },
  ],
};
