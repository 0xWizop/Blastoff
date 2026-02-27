'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { WalletButton } from './WalletButton';
import { NetworkBadge } from './NetworkBadge';
import { DocsHeader } from './DocsHeader';

export function Header() {
  const pathname = usePathname();
  if (pathname?.startsWith('/docs')) {
    return <DocsHeader />;
  }

  const { openModal } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navBoxClass =
    'border-r border-blastoff-separator flex h-full min-h-0 items-stretch';
  const navTextClass =
    'text-[11px] font-medium uppercase tracking-[0.2em] text-white';

  return (
    <header className="sticky top-0 z-50 w-full bg-blastoff-bg/70 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between gap-6 px-4 sm:h-16">
        {/* Logo + Network */}
        <div className="flex min-w-0 flex-shrink-0 items-center gap-4">
          <Link href="/app" className="flex items-center gap-2">
            <span className="font-logo text-xl font-medium uppercase tracking-[0.12em] text-blastoff-orange sm:text-2xl">
              BLASTOFF
            </span>
          </Link>
          <NetworkBadge />
        </div>

        {/* Desktop: embedded button-style cells; active page highlighted orange */}
        <nav className="hidden h-14 flex-1 items-stretch justify-end sm:flex sm:h-16">
          <div className="flex h-full items-stretch border-l border-blastoff-separator">
            <Link
              href="/app"
              className={`${navBoxClass} min-w-0 flex-1 transition-colors hover:bg-blastoff-orange ${pathname === '/app' ? 'bg-blastoff-orange' : ''}`}
            >
              <span className={`${navTextClass} flex h-full w-full items-center justify-center px-5`}>
                Explore
              </span>
            </Link>
            <Link
              href="/docs"
              className={`${navBoxClass} min-w-0 flex-1 transition-colors hover:bg-blastoff-orange ${pathname?.startsWith('/docs') ? 'bg-blastoff-orange' : ''}`}
            >
              <span className={`${navTextClass} flex h-full w-full items-center justify-center px-5`}>
                Docs
              </span>
            </Link>
            <Link
              href="/create"
              className={`${navBoxClass} min-w-0 flex-1 transition-colors ${pathname === '/create' ? 'bg-blastoff-orange hover:bg-blastoff-orange-light' : 'hover:bg-blastoff-orange'}`}
            >
              <span className={`${navTextClass} flex h-full w-full items-center justify-center px-5`}>
                Launch
              </span>
            </Link>
            <div className={`${navBoxClass} min-w-0 max-w-[7.5rem] flex-1 overflow-hidden`}>
              <WalletButton embedded />
            </div>
          </div>
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
      {/* Header separator - same 1px as app separators */}
      <div className="h-px w-full bg-blastoff-separator" aria-hidden />

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 top-14 z-40 bg-black/50 transition-opacity duration-200 sm:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed left-0 right-0 top-14 z-50 bg-blastoff-bg transition-all duration-200 sm:hidden ${
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

            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 text-left transition-colors active:bg-blastoff-border ${
                pathname?.startsWith('/docs')
                  ? 'text-blastoff-orange'
                  : 'text-blastoff-text-secondary'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-medium">Docs</span>
            </Link>

            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 text-left text-blastoff-text-secondary transition-colors active:bg-blastoff-border"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">Create Token</span>
            </Link>

            {/* Divider */}
            <div className="my-2 border-t border-blastoff-separator" />

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
