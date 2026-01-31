'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

const STORAGE_KEY = 'blastoff_onboarding_seen_v1';

export function OnboardingLauncher() {
  const { openModal } = useAppStore();

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen === '1') return;
    } catch {
      // If localStorage is blocked, still show onboarding once per page load.
    }
    openModal('welcomeOnboarding');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

