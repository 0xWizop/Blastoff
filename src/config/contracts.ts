export type SupportedChainId = 8453 | 84532;

/**
 * Contract addresses by chain
 */
export const CONTRACTS_BY_CHAIN: Record<
  SupportedChainId,
  {
    WETH: `0x${string}`;
    UNISWAP_V3_ROUTER: `0x${string}` | '';
    UNISWAP_V3_QUOTER: `0x${string}` | '';
    AERODROME_ROUTER: `0x${string}` | '';
    TOKEN_FACTORY: `0x${string}` | '';
    LAUNCHPAD: `0x${string}` | '';
  }
> = {
  8453: {
    // Base mainnet
    WETH: '0x4200000000000000000000000000000000000006',
    UNISWAP_V3_ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e481',
    UNISWAP_V3_QUOTER: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    AERODROME_ROUTER: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    TOKEN_FACTORY: '',
    LAUNCHPAD: '',
  },
  84532: {
    // Base Sepolia
    WETH: '0x4200000000000000000000000000000000000006',
    UNISWAP_V3_ROUTER: '',
    UNISWAP_V3_QUOTER: '',
    AERODROME_ROUTER: '',
    TOKEN_FACTORY: '0x7E7618828FE3e2BA6a81d609E7904E3CE2c15fB3',
    LAUNCHPAD: '',
  },
} as const;

/**
 * Chain configuration
 */
export const CHAIN_CONFIGS: Record<
  SupportedChainId,
  {
    chainId: SupportedChainId;
    name: string;
    rpcUrl: string;
    flashblocksRpcUrl?: string;
    blockExplorer: string;
  }
> = {
  8453: {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    flashblocksRpcUrl: 'https://mainnet-preconf.base.org',
    blockExplorer: 'https://base.blockscout.com',
  },
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://base-sepolia.blockscout.com',
  },
} as const;

export const DEFAULT_CHAIN_ID: SupportedChainId = 84532;

export function getContracts(chainId?: number) {
  const id = (chainId ?? DEFAULT_CHAIN_ID) as SupportedChainId;
  return CONTRACTS_BY_CHAIN[id];
}

export function getChainConfig(chainId?: number) {
  const id = (chainId ?? DEFAULT_CHAIN_ID) as SupportedChainId;
  return CHAIN_CONFIGS[id];
}

/**
 * Token decimals - standard ERC20
 */
export const DECIMALS = {
  WETH: 18,
  DEFAULT: 18,
} as const;
