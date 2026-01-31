'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

const STORAGE_KEY = 'blastoff_onboarding_seen_v1';

type Step = {
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: 'Welcome to BLASTOFF',
    body: 'BLASTOFF is a fair launchpad on Base. Create a token, seed liquidity, and share the launch in minutes.',
  },
  {
    title: 'Create a token',
    body: 'Click “Create” in the header, fill in name/symbol/supply, and confirm. You’ll get a draft token to launch.',
  },
  {
    title: 'Launch + liquidity',
    body: 'Pick a DEX, set your initial price and WETH liquidity, choose slippage, then launch. After launch, trading begins.',
  },
  {
    title: 'Discover + trade',
    body: 'Use Trending + Top Movers to find tokens. Open a token page for chart, stats, and swap.',
  },
];

export function WelcomeOnboardingModal() {
  const { closeModal } = useAppStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const steps = useMemo(() => STEPS, []);
  const isLast = stepIdx === steps.length - 1;

  const markSeen = () => {
    if (!dontShowAgain) return;
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore (private mode / blocked storage)
    }
  };

  const onClose = () => {
    markSeen();
    closeModal('welcomeOnboarding');
  };

  const onNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setStepIdx((v) => Math.min(v + 1, steps.length - 1));
  };

  const onBack = () => setStepIdx((v) => Math.max(v - 1, 0));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLast, dontShowAgain, stepIdx]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-[min(720px,100%)] border border-blastoff-border bg-blastoff-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-blastoff-text">
            {steps[stepIdx].title}
          </h2>
          <button onClick={onClose} className="text-blastoff-text-secondary hover:text-blastoff-text">
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border border-blastoff-border bg-blastoff-bg p-4">
          <p className="text-sm leading-relaxed text-blastoff-text-secondary">{steps[stepIdx].body}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIdx(i)}
                className={`h-2.5 w-2.5 rounded-full border transition-all ${
                  i === stepIdx
                    ? 'border-blastoff-orange bg-blastoff-orange'
                    : 'border-blastoff-border bg-blastoff-bg hover:border-blastoff-orange'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-blastoff-text-secondary">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 accent-blastoff-orange"
            />
            Don’t show again
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="border border-blastoff-border bg-blastoff-bg px-4 py-2 text-sm text-blastoff-text-secondary transition-all hover:text-blastoff-text"
          >
            Skip
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              disabled={stepIdx === 0}
              className="border border-blastoff-border bg-blastoff-bg px-4 py-2 text-sm text-blastoff-text-secondary transition-all hover:text-blastoff-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={onNext}
              className="bg-blastoff-orange px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light"
            >
              {isLast ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

