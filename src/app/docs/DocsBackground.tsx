'use client';

/**
 * Solid background for docs — covers only the main content area so the footer stays visible.
 * Parent (main) must have position: relative.
 */
export function DocsBackground() {
  return (
    <div
      className="absolute inset-0 z-0 bg-blastoff-bg"
      aria-hidden
    />
  );
}
