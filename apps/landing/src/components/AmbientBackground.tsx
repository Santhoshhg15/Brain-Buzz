export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-accent)] opacity-[0.05] blur-3xl" />
      <div className="absolute top-1/3 -right-40 w-[28rem] h-[28rem] rounded-full bg-[var(--color-accent)] opacity-[0.04] blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 w-96 h-96 rounded-full bg-[var(--color-success)] opacity-[0.03] blur-3xl" />
    </div>
  );
}
