'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { WalletButton } from './WalletButton';
import { NetworkBadge } from './NetworkBadge';

export function Header() {
  const { openModal } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blastoff-border bg-blastoff-bg/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
        <Link href="/app" className="flex items-center gap-2">
          <span className="font-logo text-xl tracking-[0.08em] text-blastoff-orange sm:text-2xl">
            BLASTOFF
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-3 sm:flex">
          <Link
            href="/app"
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              pathname === '/app' 
                ? 'text-blastoff-orange' 
                : 'text-blastoff-text-secondary hover:text-blastoff-text'
            }`}
          >
            Explore
          </Link>
          <button
            onClick={() => openModal('createToken')}
            className="border border-blastoff-border bg-blastoff-surface px-4 py-2 text-sm font-medium text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-text h-[38px]"
          >
            Create Token
          </button>
          <NetworkBadge />
          <WalletButton />
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 sm:hidden">
          <WalletButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative flex h-10 w-10 items-center justify-center border border-blastoff-border bg-blastoff-surface text-blastoff-text-secondary transition-colors active:bg-blastoff-border"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
            <div className="relative h-5 w-5">
              <span
                className={`absolute left-0 top-1 h-0.5 w-5 bg-current transition-all duration-200 ${
                  mobileMenuOpen ? 'top-2.5 rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-2.5 h-0.5 w-5 bg-current transition-all duration-200 ${
                  mobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-4 h-0.5 w-5 bg-current transition-all duration-200 ${
                  mobileMenuOpen ? 'top-2.5 -rotate-45' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 top-14 z-40 bg-black/50 transition-opacity duration-200 sm:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed left-0 right-0 top-14 z-50 border-b border-blastoff-border bg-blastoff-bg transition-all duration-200 sm:hidden ${
          mobileMenuOpen 
            ? 'translate-y-0 opacity-100' 
            : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <nav className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            {/* Navigation Links */}
            <Link
              href="/app"
              className={`flex items-center gap-3 px-3 py-3 transition-colors ${
                pathname === '/app'
                  ? 'bg-blastoff-orange/10 text-blastoff-orange'
                  : 'text-blastoff-text-secondary active:bg-blastoff-border'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium">Explore Tokens</span>
            </Link>

            <button
              onClick={() => {
                openModal('createToken');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-3 text-left text-blastoff-text-secondary transition-colors active:bg-blastoff-border"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">Create Token</span>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-blastoff-border" />

            {/* Network Info */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-blastoff-text-muted">Network</span>
              <NetworkBadge />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
