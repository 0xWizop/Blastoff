'use client';

import React from 'react';

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-blastoff-border bg-blastoff-surface px-1.5 py-0.5 font-mono text-sm text-blastoff-orange">
      {children}
    </code>
  );
}

export function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded border border-blastoff-border bg-blastoff-surface p-3 font-mono text-sm text-blastoff-text-secondary">
      {children}
    </pre>
  );
}

export const Icons = {
  TrendingUp: () => (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 011.414-1.414L21 7.5" />
    </svg>
  ),
  Pen: () => (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  ),
  Code: () => (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
  Globe: () => (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  Image: () => (
    <svg className="h-8 w-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
};

export function MockImage({ label, aspectRatio = 'video' }: { label: string; aspectRatio?: 'video' | 'wide' }) {
  const ratio = aspectRatio === 'video' ? 'aspect-video' : 'aspect-[2/1]';
  return (
    <div
      className={`${ratio} w-full rounded border-2 border-dashed border-blastoff-border bg-blastoff-surface flex flex-col items-center justify-center gap-1.5 text-blastoff-text-muted`}
    >
      <Icons.Image />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

export function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 border-b border-blastoff-border pb-1.5 text-lg font-semibold text-blastoff-text">
      <span className="text-blastoff-orange"><Icon /></span>
      {children}
    </h2>
  );
}

export function ApiEndpoint({
  method,
  path,
  desc,
  response,
}: {
  method: string;
  path: string;
  desc: string;
  response?: string;
}) {
  return (
    <div className="rounded border border-blastoff-border bg-blastoff-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blastoff-orange text-blastoff-bg'
          }`}
        >
          {method}
        </span>
        <code className="font-mono text-xs text-blastoff-orange">{path}</code>
      </div>
      <p className="mt-1.5 text-xs text-blastoff-text-secondary">{desc}</p>
      {response && <Pre className="mt-2 text-xs">{response}</Pre>}
    </div>
  );
}
