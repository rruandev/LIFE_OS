import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "quiet";
  pending?: boolean;
  pendingLabel?: string;
};

const styles = {
  primary: "bg-ember text-on-ember font-semibold hover:brightness-110",
  soft: "bg-field text-ink hover:bg-ember-soft border border-line",
  quiet: "text-ink-2 hover:text-ink hover:bg-field",
};

export function Button({
  variant = "primary",
  pending = false,
  pendingLabel,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] transition disabled:cursor-not-allowed disabled:opacity-55 ${styles[variant]} ${className}`}
    >
      {pending && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
