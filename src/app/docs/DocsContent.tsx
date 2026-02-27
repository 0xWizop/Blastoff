'use client';

export function DocsContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-6 sm:pt-8 sm:pb-8">
      <main className="min-w-0 space-y-6 pb-12">
        {children}
      </main>
    </div>
  );
}
