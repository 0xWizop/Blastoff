'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_NAV } from './docsNav';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full min-h-[calc(100vh-3.5rem)] border-b border-blastoff-border bg-blastoff-bg lg:sticky lg:top-14 lg:w-56 lg:flex-shrink-0 lg:border-b-0 lg:border-r">
      <div className="container mx-auto flex h-full min-h-0 flex-col px-4 py-4 lg:mx-0 lg:w-56 lg:px-4 lg:py-6">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blastoff-text-muted">
          Contents
        </h2>
        <ul className="flex flex-wrap gap-1 lg:flex-col lg:gap-0">
          {DOCS_NAV.map(({ slug, label }) => {
            const href = `/docs/${slug}`;
            const isActive = pathname === href;
            return (
              <li key={slug}>
                <Link
                  href={href}
                  className={`block rounded px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-blastoff-orange/15 font-medium text-blastoff-orange'
                      : 'text-blastoff-text-secondary hover:bg-blastoff-border/50 hover:text-blastoff-text'
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/app"
          className="mt-4 flex items-center gap-2 border-t border-blastoff-border pt-3 text-xs text-blastoff-orange transition-colors hover:text-blastoff-orange/80"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to app
        </Link>
      </div>
    </aside>
  );
}
