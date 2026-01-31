'use client';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'orange' | 'white' | 'green' | 'red';
  className?: string;
}

const sizeConfig = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
};

const colorConfig = {
  orange: 'border-blastoff-orange/20 border-t-blastoff-orange',
  white: 'border-white/20 border-t-white',
  green: 'border-green-500/20 border-t-green-500',
  red: 'border-red-500/20 border-t-red-500',
};

export function Spinner({ size = 'sm', color = 'orange', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full ${sizeConfig[size]} ${colorConfig[color]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-blastoff-bg">
      <Spinner size="xl" />
      <p className="animate-pulse text-sm text-blastoff-text-secondary">
        Loading...
      </p>
    </div>
  );
}

export function CardLoader() {
  return (
    <div className="flex h-32 items-center justify-center border border-blastoff-border bg-blastoff-surface rounded">
      <Spinner size="md" />
    </div>
  );
}

export function InlineLoader({ size = 'sm', color = 'orange' }: { size?: 'xs' | 'sm' | 'md'; color?: 'orange' | 'white' }) {
  return <Spinner size={size} color={color} />;
}

// Button spinner for inside buttons
export function ButtonSpinner({ color = 'white' }: { color?: 'white' | 'orange' }) {
  return <Spinner size="xs" color={color} />;
}

// Three-dot loading animation for inline text
export function DotsLoader({ color = 'orange' }: { color?: 'orange' | 'white' }) {
  const dotColor = color === 'orange' ? 'bg-blastoff-orange' : 'bg-white';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '0ms' }} />
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '150ms' }} />
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '300ms' }} />
    </span>
  );
}
