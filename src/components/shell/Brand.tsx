/** Marca: dois arcos, o mesmo gesto do fundo. */
export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <circle cx="18" cy="18" r="18" fill="var(--ember)" />
      <path
        d="M9 26a13 13 0 0 1 18-18"
        fill="none"
        stroke="var(--on-ember)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M15.5 26.5a7.5 7.5 0 0 1 10.6-10.6"
        fill="none"
        stroke="var(--on-ember)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
