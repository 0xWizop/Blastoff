'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { toast } from 'sonner';
import Image from 'next/image';
import { useAppStore } from '@/store/useAppStore';
import { Spinner } from './Spinner';

// Base chain logo
const BASE_LOGO = 'https://i.imgur.com/mOH2omk.png';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Network icon component
const NetworkIcon = ({ chainId, size = 16, showTestnetBadge = true }: { chainId: number; size?: number; showTestnetBadge?: boolean }) => {
  const isBaseSepolia = chainId === baseSepolia.id;
  const isSupported = chainId === base.id || isBaseSepolia;
  
  if (!isSupported) {
    return (
      <div 
        className="rounded-full bg-blastoff-error flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-[8px] text-white font-bold">!</span>
      </div>
    );
  }
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image 
        src={BASE_LOGO} 
        alt="Base" 
        width={size} 
        height={size} 
        className="rounded-full"
      />
      {isBaseSepolia && showTestnetBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-yellow-500 border border-blastoff-surface" />
      )}
    </div>
  );
};

// Supported chains
const SUPPORTED_CHAINS = [
  { id: base.id, name: 'Base' },
  { id: baseSepolia.id, name: 'Base Sepolia' },
];

// Wallet icons
const WalletIcon = ({ name }: { name: string }) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('metamask')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 35 33" fill="none">
        <path d="M32.96 1L19.67 10.89l2.45-5.8L32.96 1z" fill="#E17726"/>
        <path d="M2.04 1l13.14 9.98-2.3-5.89L2.04 1zM28.23 23.53l-3.53 5.41 7.56 2.08 2.17-7.35-6.2-.14zM.57 23.67l2.15 7.35 7.55-2.08-3.52-5.41-6.18.14z" fill="#E27625"/>
        <path d="M9.92 14.47l-2.1 3.17 7.48.34-.26-8.04-5.12 4.53zM25.08 14.47l-5.2-4.62-.17 8.13 7.47-.34-2.1-3.17zM10.27 28.94l4.5-2.19-3.88-3.03-.62 5.22zM20.23 26.75l4.5 2.19-.62-5.22-3.88 3.03z" fill="#E27625"/>
        <path d="M24.73 28.94l-4.5-2.19.36 2.94-.04 1.24 4.18-2zM10.27 28.94l4.18 2-.03-1.24.35-2.94-4.5 2.18z" fill="#D5BFB2"/>
        <path d="M14.52 21.93l-3.75-1.1 2.65-1.22 1.1 2.32zM20.48 21.93l1.1-2.32 2.66 1.22-3.76 1.1z" fill="#233447"/>
        <path d="M10.27 28.94l.64-5.41-4.16.13 3.52 5.28zM24.09 23.53l.64 5.41 3.5-5.28-4.14-.13zM27.18 17.64l-7.47.34.69 3.95 1.1-2.32 2.66 1.22 3.02-3.19zM10.77 20.83l2.65-1.22 1.1 2.32.69-3.95-7.47-.34 3.03 3.19z" fill="#CC6228"/>
        <path d="M7.74 17.64l3.13 6.11-.1-3.03-3.03-3.08zM24.16 20.72l-.11 3.03 3.13-6.11-3.02 3.08zM15.21 17.98l-.69 3.95.87 4.49.19-5.91-.37-2.53zM19.71 17.98l-.36 2.52.18 5.92.87-4.49-.69-3.95z" fill="#E27525"/>
        <path d="M20.4 21.93l-.87 4.49.62.44 3.88-3.03.11-3.03-3.74 1.13zM10.77 20.83l.1 3.03 3.88 3.03.62-.44-.87-4.49-3.73-1.13z" fill="#F5841F"/>
        <path d="M20.47 30.99l.04-1.24-.34-.29h-5.34l-.33.29.03 1.24-4.26-2.05 1.49 1.22 3.02 2.09h5.44l3.03-2.09 1.48-1.22-4.26 2.05z" fill="#C0AC9D"/>
        <path d="M20.23 26.75l-.62-.44h-4.22l-.62.44-.35 2.94.33-.29h5.34l.34.29-.2-2.94z" fill="#161616"/>
        <path d="M33.52 11.5l1.13-5.41L32.96 1 20.23 10.5l4.85 4.1 6.85 2 1.51-1.76-.66-.48 1.05-.96-.8-.62 1.04-.8-.69-.52zM.35 6.09l1.14 5.41-.73.54 1.05.8-.8.62 1.05.96-.66.48 1.51 1.76 6.85-2 4.85-4.1L2.04 1 .35 6.09z" fill="#763E1A"/>
        <path d="M31.93 16.6l-6.85-2 2.1 3.17-3.13 6.11 4.12-.05h6.2l-2.44-7.23zM9.92 14.6l-6.85 2-2.35 7.23h6.18l4.12.05-3.13-6.11 2.03-3.17zM19.71 17.98l.44-7.58 1.97-5.33h-8.24l1.97 5.33.44 7.58.17 2.54.01 5.9h4.22l.02-5.9.17-2.54z" fill="#F5841F"/>
      </svg>
    );
  }
  
  if (lowerName.includes('walletconnect')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none">
        <path d="M9.58 11.58c3.54-3.47 9.28-3.47 12.82 0l.43.42a.44.44 0 010 .63l-1.46 1.43a.23.23 0 01-.32 0l-.59-.57a6.5 6.5 0 00-8.95 0l-.63.62a.23.23 0 01-.32 0l-1.46-1.43a.44.44 0 010-.63l.48-.47zm15.84 2.95l1.3 1.27a.44.44 0 010 .63l-5.85 5.73a.46.46 0 01-.64 0l-4.15-4.07a.11.11 0 00-.16 0l-4.15 4.07a.46.46 0 01-.64 0l-5.85-5.73a.44.44 0 010-.63l1.3-1.27a.46.46 0 01.64 0l4.15 4.07c.04.04.12.04.16 0l4.15-4.07a.46.46 0 01.64 0l4.15 4.07c.04.04.12.04.16 0l4.15-4.07a.46.46 0 01.64 0z" fill="#3B99FC"/>
      </svg>
    );
  }
  
  if (lowerName.includes('coinbase')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#0052FF"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M16 6c5.52 0 10 4.48 10 10s-4.48 10-10 10S6 21.52 6 16 10.48 6 16 6zm-3 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1v-2a1 1 0 00-1-1h-6z" fill="white"/>
      </svg>
    );
  }
  
  if (lowerName.includes('safe')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#12FF80"/>
        <path d="M16 8c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="#121312"/>
        <circle cx="16" cy="16" r="3" fill="#121312"/>
      </svg>
    );
  }
  
  // Default wallet icon
  return (
    <svg className="h-6 w-6 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
};

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();
  const { openModals, openModal, closeModal } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track if we've shown the connected toast to prevent duplicates
  const hasShownConnectedToast = useRef(false);
  const lastConnectedAddress = useRef<string | null>(null);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      toast.error('Connection failed', {
        description: connectError.message.slice(0, 100),
      });
      setConnectingWallet(null);
    }
  }, [connectError]);

  // Defer modal close and toast to a macrotask so we never update during another component's render (e.g. Hydrate)
  useEffect(() => {
    if (!isConnected || !address) {
      if (!isConnected) {
        hasShownConnectedToast.current = false;
        lastConnectedAddress.current = null;
      }
      return;
    }
    const t = setTimeout(() => {
      closeModal('walletConnect');
      setConnectingWallet(null);
      if (!hasShownConnectedToast.current || lastConnectedAddress.current !== address) {
        hasShownConnectedToast.current = true;
        lastConnectedAddress.current = address;
        toast.success('Wallet connected!', {
          description: shortenAddress(address),
          id: 'wallet-connected',
        });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [isConnected, address, closeModal]);

  const handleConnect = useCallback((connector: typeof connectors[0]) => {
    setConnectingWallet(connector.name);
    connect({ connector });
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowDropdown(false);
    setShowNetworkMenu(false);
    toast.info('Wallet disconnected', { id: 'wallet-disconnected' });
  }, [disconnect]);

  const handleSwitchNetwork = useCallback((targetChainId: number) => {
    if (chainId === targetChainId) {
      setShowNetworkMenu(false);
      return;
    }
    switchChain({ chainId: targetChainId }, {
      onSuccess: () => {
        toast.success('Network switched!', { id: 'network-switched' });
        setShowNetworkMenu(false);
      },
      onError: (error) => {
        toast.error('Failed to switch network', {
          description: error.message.slice(0, 100),
          id: 'network-switch-error',
        });
      },
    });
  }, [chainId, switchChain]);

  const handleCopyAddress = useCallback(async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        toast.success('Address copied!', { id: 'address-copied' });
      } catch {
        toast.error('Failed to copy');
      }
    }
  }, [address]);

  const currentChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  const networkName = currentChain?.name || 'Unknown Network';
  const isUnsupportedNetwork = !currentChain;

  // Avoid setState during Wagmi Hydrate render: render placeholder until mounted
  if (!mounted) {
    return (
      <button
        className="bg-blastoff-orange px-4 py-2 text-sm font-medium text-white h-[38px] opacity-70"
        disabled
      >
        Connect Wallet
      </button>
    );
  }

  // Show loading state during connection/reconnection
  if (isConnecting || isReconnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 bg-blastoff-surface px-4 py-2 text-sm font-medium text-blastoff-text-secondary border border-blastoff-border h-[38px]"
      >
        <Spinner size="xs" color="orange" />
        {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
      </button>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <>
        <div className="relative">
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNetworkMenu(false);
            }}
            className={`flex items-center gap-2 bg-blastoff-surface px-3 py-2 text-sm font-medium text-blastoff-text transition-all hover:bg-blastoff-border border h-[38px] ${isUnsupportedNetwork ? 'border-blastoff-error' : 'border-blastoff-border'}`}
          >
            <NetworkIcon chainId={chainId} size={16} />
            <span className="font-mono">{shortenAddress(address)}</span>
            <svg className={`h-4 w-4 text-blastoff-text-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Dropdown rendered in portal-style fixed position */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100]" onClick={() => {
              setShowDropdown(false);
              setShowNetworkMenu(false);
            }} />
            
            {/* Dropdown Menu - fixed to top right, below header */}
            <div className="fixed right-4 top-16 sm:top-[72px] w-64 border border-blastoff-border bg-blastoff-surface shadow-2xl z-[101] overflow-hidden">
              {/* Unsupported Network Warning */}
              {isUnsupportedNetwork && (
                <div className="bg-blastoff-error/10 border-b border-blastoff-error/20 p-3">
                  <div className="flex items-center gap-2 text-blastoff-error">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-medium">Wrong Network</span>
                  </div>
                  <p className="text-[10px] text-blastoff-error/80 mt-1">Please switch to Base or Base Sepolia</p>
                </div>
              )}
              
              {/* Wallet Address */}
              <div className="border-b border-blastoff-border p-3">
                <p className="text-[10px] uppercase tracking-wider text-blastoff-text-muted mb-1">Connected Wallet</p>
                <button 
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2 font-mono text-sm text-blastoff-text hover:text-blastoff-orange transition-colors group"
                  title="Click to copy"
                >
                  {shortenAddress(address)}
                  <svg className="h-3.5 w-3.5 text-blastoff-text-muted group-hover:text-blastoff-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              
              {/* Network Section */}
              <div className="border-b border-blastoff-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-blastoff-text-muted">Network</p>
                  <button
                    onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                    className="text-[10px] text-blastoff-orange hover:text-blastoff-orange-light transition-colors"
                  >
                    {showNetworkMenu ? 'Cancel' : 'Switch'}
                  </button>
                </div>
                
                {showNetworkMenu ? (
                  <div className="space-y-1">
                    {SUPPORTED_CHAINS.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => handleSwitchNetwork(chain.id)}
                        disabled={isSwitching}
                        className={`w-full flex items-center gap-2 px-2 py-2 text-sm transition-colors ${
                          chainId === chain.id 
                            ? 'bg-blastoff-orange/10 text-blastoff-orange' 
                            : 'text-blastoff-text hover:bg-blastoff-border'
                        } disabled:opacity-50`}
                      >
                        <NetworkIcon chainId={chain.id} size={18} showTestnetBadge={chain.id === baseSepolia.id} />
                        <span className="flex-1 text-left">{chain.name}</span>
                        {chainId === chain.id && (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isSwitching && chainId !== chain.id && (
                          <Spinner size="xs" color="orange" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <NetworkIcon chainId={chainId} size={16} />
                    <p className={`text-sm ${isUnsupportedNetwork ? 'text-blastoff-error' : 'text-blastoff-text'}`}>
                      {networkName}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Disconnect Button */}
              <div className="p-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-center gap-2 bg-blastoff-error/10 px-3 py-2.5 text-sm text-blastoff-error transition-colors hover:bg-blastoff-error/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Not connected state
  return (
    <>
      <button
        onClick={() => openModal('walletConnect')}
        className="bg-blastoff-orange px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light hover:shadow-glow-orange h-[38px]"
      >
        Connect Wallet
      </button>

      {/* Wallet Connect Modal - below header, aligned right (near Swap panel Connect button) */}
      {openModals.walletConnect && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end pt-14 sm:pt-16 p-4 pr-6 sm:pr-8 md:pr-12">
          {/* Backdrop - below header only, soft top edge to avoid visible strip */}
          <div 
            className="absolute top-14 left-0 right-0 bottom-0 sm:top-16 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.4)_6px,rgba(0,0,0,0.7)_100%)]"
            onClick={() => {
              closeModal('walletConnect');
              setConnectingWallet(null);
            }}
          />
          
          {/* Modal - starts below header separator */}
          <div className="relative w-full max-w-sm border border-blastoff-border bg-blastoff-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-blastoff-border p-4">
              <h2 className="text-lg font-semibold text-blastoff-text">Connect Wallet</h2>
              <button
                onClick={() => {
                  closeModal('walletConnect');
                  setConnectingWallet(null);
                }}
                className="p-1 text-blastoff-text-muted hover:text-blastoff-text transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Wallet Options */}
            <div className="p-4 space-y-2">
              <p className="text-xs text-blastoff-text-muted mb-3">
                Choose your preferred wallet to connect to BLASTOFF
              </p>
              
              {connectors.map((connector) => {
                const isConnecting = connectingWallet === connector.name && isPending;
                
                return (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    className="flex w-full items-center gap-3 border border-blastoff-border bg-blastoff-bg p-3 text-left transition-all hover:border-blastoff-orange hover:bg-blastoff-surface disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <WalletIcon name={connector.name} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blastoff-text group-hover:text-blastoff-orange transition-colors">
                        {connector.name}
                      </p>
                      {connector.name.toLowerCase().includes('injected') && (
                        <p className="text-[10px] text-blastoff-text-muted">Browser Extension</p>
                      )}
                      {connector.name.toLowerCase().includes('walletconnect') && (
                        <p className="text-[10px] text-blastoff-text-muted">Mobile & Desktop</p>
                      )}
                      {connector.name.toLowerCase().includes('coinbase') && (
                        <p className="text-[10px] text-blastoff-text-muted">Coinbase Wallet</p>
                      )}
                      {connector.name.toLowerCase().includes('safe') && (
                        <p className="text-[10px] text-blastoff-text-muted">Multisig Wallet</p>
                      )}
                    </div>
                    {isConnecting ? (
                      <Spinner size="sm" color="orange" />
                    ) : (
                      <svg className="h-5 w-5 text-blastoff-text-muted group-hover:text-blastoff-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="border-t border-blastoff-border p-4">
              <p className="text-[10px] text-center text-blastoff-text-muted">
                By connecting, you agree to the Terms of Service
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
