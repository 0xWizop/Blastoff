'use client';

import { TokenStatus } from '@/types';

interface StatusBadgeProps {
  status: TokenStatus;
}

const statusConfig: Record<TokenStatus, { label: string; className: string }> = {
  LIVE: {
    label: 'LIVE',
    className: 'bg-blastoff-success/20 text-blastoff-success border-blastoff-success/30',
  },
  UPCOMING: {
    label: 'UPCOMING',
    className: 'bg-blastoff-warning/20 text-blastoff-warning border-blastoff-warning/30',
  },
  ENDED: {
    label: 'ENDED',
    className: 'bg-blastoff-text-muted/20 text-blastoff-text-muted border-blastoff-text-muted/30',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${config.className}`}
    >
      {status === 'LIVE' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {config.label}
    </span>
  );
}
