'use client';

import { useAppStore } from '@/store/useAppStore';
import { CreateTokenModal } from './CreateTokenModal';
import { TokenCreatedModal } from './TokenCreatedModal';
import { LaunchTokenModal } from './LaunchTokenModal';

export function AppModals() {
  const { openModals } = useAppStore();

  if (!openModals.createToken && !openModals.tokenCreated && !openModals.launchToken) {
    return null;
  }

  return (
    <>
      {openModals.createToken && <CreateTokenModal />}
      {openModals.tokenCreated && <TokenCreatedModal />}
      {openModals.launchToken && <LaunchTokenModal />}
    </>
  );
}
