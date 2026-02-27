'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

const STORAGE_KEY = 'blastoff_onboarding_seen_v1';

export function OnboardingLauncher() {
  const { openModal } = useAppStore();
  const pathname = usePathname();

  useEffect(() => {
    // Only show onboarding on the main app homepage
    if (pathname !== '/app') return;

    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen === '1') return;
    } catch {
      // If localStorage is blocked, still show onboarding once per page load.
    }
    openModal('welcomeOnboarding');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
