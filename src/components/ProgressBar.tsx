'use client';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`h-2 w-full overflow-hidden bg-blastoff-border ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-blastoff-orange to-blastoff-orange-light transition-all duration-500"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
