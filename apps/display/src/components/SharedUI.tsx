export const optionStyles = [
  { bg: "bg-red-500", border: "border-red-600", text: "text-red-900", icon: "triangle" },
  { bg: "bg-blue-500", border: "border-blue-600", text: "text-blue-900", icon: "diamond" },
  { bg: "bg-yellow-500", border: "border-yellow-600", text: "text-yellow-900", icon: "circle" },
  { bg: "bg-[var(--color-success)]", border: "border-green-600", text: "text-[var(--color-success)]", icon: "square" },
];

export function OptionIcon({ type, className = "w-12 h-12" }: { type: string, className?: string }) {
  if (type === "triangle") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L22 20H2L12 2Z" />
      </svg>
    );
  }
  if (type === "diamond") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L22 12L12 22L2 12L12 2Z" />
      </svg>
    );
  }
  if (type === "circle") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  // square
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
