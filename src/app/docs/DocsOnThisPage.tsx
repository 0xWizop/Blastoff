'use client';

import { DOCS_HEADINGS } from './docsHeadings';

type Props = { section: string | null };

export function DocsOnThisPage({ section }: Props) {
  const headings = section ? DOCS_HEADINGS[section] : null;
  if (!headings?.length) return null;

  return (
    <nav aria-label="On this page" className="sticky top-14 border-l border-blastoff-border pl-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blastoff-text-muted">
        On this page
      </p>
      <ul className="mt-2 space-y-1">
        {headings.map(({ id, label, level }) => (
          <li key={id} className={level === 3 ? 'pl-3' : ''}>
            <a
              href={`#${id}`}
              className="block py-1 text-xs text-blastoff-text-secondary transition-colors hover:text-blastoff-orange"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
