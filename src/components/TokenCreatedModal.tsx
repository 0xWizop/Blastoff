'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TokenCreatedModal() {
  const router = useRouter();
  const { createdToken, closeModal } = useAppStore();

  const onClose = () => closeModal('tokenCreated');

  const onCopy = async () => {
    if (!createdToken?.address) return;
    try {
      await navigator.clipboard.writeText(createdToken.address);
      toast.success('Address copied!');
    } catch {
      // ignore
    }
  };

  const onViewToken = () => {
    if (!createdToken?.address) return;
    closeModal('tokenCreated');
    router.push(`/token/${createdToken.address}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-[min(480px,100%)] border border-blastoff-border bg-blastoff-surface p-5">
        {/* Success Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="mb-4 text-center">
          <h2 className="font-display text-xl font-semibold text-blastoff-text">Token Created!</h2>
          <p className="mt-1 text-sm text-blastoff-text-secondary">
            Your token has been deployed successfully
          </p>
        </div>

        {createdToken ? (
          <>
            <div className="border border-blastoff-border bg-blastoff-bg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blastoff-text">
                    {createdToken.name} ({createdToken.symbol})
                  </div>
                  <div className="mt-1 font-mono text-xs text-blastoff-text-muted">
                    {shortenAddress(createdToken.address)}
                  </div>
                </div>
                <button
                  onClick={onCopy}
                  className="border border-blastoff-border bg-blastoff-surface px-3 py-2 text-xs text-blastoff-text-secondary hover:text-blastoff-text transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={onViewToken}
                className="w-full bg-blastoff-orange px-4 py-3 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light"
              >
                View Token
              </button>
              <button
                onClick={onClose}
                className="w-full border border-blastoff-border bg-blastoff-bg px-4 py-2 text-sm text-blastoff-text-secondary transition-all hover:text-blastoff-text"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-blastoff-text-secondary">No token data found.</div>
        )}
      </div>
    </div>
  );
}
