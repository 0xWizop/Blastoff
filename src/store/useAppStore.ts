import { create } from 'zustand';

export type LaunchDex = 'UNISWAP_V3' | 'AERODROME';

export interface CreatedTokenDraft {
  address: string;
  name: string;
  symbol: string;
  supply: number;
  decimals: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface LaunchDraft {
  dex: LaunchDex;
  feeTier?: 500 | 3000 | 10000;
  initialPriceWeth: number;
  wethLiquidity: number;
  slippage: number;
}

interface AppState {
  walletConnected: boolean;
  activeToken: string | null;
  createdToken: CreatedTokenDraft | null;
  launchDraft: LaunchDraft | null;
  openModals: {
    walletConnect: boolean;
    slippage: boolean;
    createToken: boolean;
    tokenCreated: boolean;
    launchToken: boolean;
  };
  setWalletConnected: (connected: boolean) => void;
  setActiveToken: (address: string | null) => void;
  setCreatedToken: (token: CreatedTokenDraft | null) => void;
  setLaunchDraft: (draft: LaunchDraft | null) => void;
  openModal: (modal: keyof AppState['openModals']) => void;
  closeModal: (modal: keyof AppState['openModals']) => void;
  closeAllModals: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  walletConnected: false,
  activeToken: null,
  createdToken: null,
  launchDraft: null,
  openModals: {
    walletConnect: false,
    slippage: false,
    createToken: false,
    tokenCreated: false,
    launchToken: false,
  },
  setWalletConnected: (connected) => set({ walletConnected: connected }),
  setActiveToken: (address) => set({ activeToken: address }),
  setCreatedToken: (token) => set({ createdToken: token }),
  setLaunchDraft: (draft) => set({ launchDraft: draft }),
  openModal: (modal) =>
    set((state) => ({
      openModals: { ...state.openModals, [modal]: true },
    })),
  closeModal: (modal) =>
    set((state) => ({
      openModals: { ...state.openModals, [modal]: false },
    })),
  closeAllModals: () =>
    set({
      openModals: {
        walletConnect: false,
        slippage: false,
        createToken: false,
        tokenCreated: false,
        launchToken: false,
      },
    }),
}));
