export function Spinner({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-blastoff-border border-t-blastoff-orange ${sizeClasses[size]}`}
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blastoff-bg">
      <Spinner size="lg" />
    </div>
  );
}

export function CardLoader() {
  return (
    <div className="flex h-32 items-center justify-center rounded border border-blastoff-border bg-blastoff-surface">
      <Spinner size="md" />
    </div>
  );
}

export function InlineLoader() {
  return <Spinner size="sm" />;
}
