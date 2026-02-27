'use client';

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-blastoff-border bg-blastoff-bg">
      <div className="flex h-12 w-full items-stretch sm:h-14">
        <div className="flex h-full w-full flex-shrink-0 items-center px-4 lg:w-56 lg:border-r lg:border-blastoff-border">
          <span className="text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-blastoff-text sm:text-xs">
            Documentation
          </span>
        </div>
      </div>
    </header>
  );
}
