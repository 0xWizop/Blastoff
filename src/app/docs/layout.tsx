'use client';

import { usePathname } from 'next/navigation';
import { DocsBackground } from './DocsBackground';
import { DocsSidebar } from './DocsSidebar';
import { DocsContent } from './DocsContent';
import { DocsOnThisPage } from './DocsOnThisPage';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = pathname?.startsWith('/docs/')
    ? pathname.replace('/docs/', '').split('/')[0] || null
    : null;

  return (
    <>
      <DocsBackground />
      <div className="relative z-10 flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
        <DocsSidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-8 lg:flex-row lg:gap-10">
          <DocsContent>{children}</DocsContent>
          <aside className="hidden shrink-0 pl-4 lg:block lg:w-48 xl:w-52">
            <DocsOnThisPage section={section} />
          </aside>
        </div>
      </div>
    </>
  );
}
