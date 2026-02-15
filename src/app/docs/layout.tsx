'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_NAV } from './docsNav';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto flex flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:py-8">
      <aside className="shrink-0 md:sticky md:top-20 md:h-fit md:w-52">
        <nav className="border-b border-blastoff-border pb-4 md:border-b-0 md:pb-0">
          <ul className="flex flex-wrap gap-1 md:flex-col md:gap-0">
            {DOCS_NAV.map(({ slug, label }) => {
              const href = `/docs/${slug}`;
              const isActive = pathname === href;
              return (
                <li key={slug}>
                  <Link
                    href={href}
                    className={`block rounded border px-2.5 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'border-blastoff-orange/30 bg-blastoff-orange/10 text-blastoff-orange'
                        : 'border-transparent text-blastoff-text-secondary hover:border-blastoff-border hover:text-blastoff-text'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link
          href="/app"
          className="mt-3 inline-block text-xs text-blastoff-orange hover:underline"
        >
          ← Back to app
        </Link>
      </aside>
      <main className="min-w-0 flex-1 pb-12">{children}</main>
    </div>
  );
}
