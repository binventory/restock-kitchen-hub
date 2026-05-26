export function LivePill() {
  return (
    <span className="relative inline-flex h-2 w-2" aria-label="live">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  );
}
