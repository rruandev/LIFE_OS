"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

type Option<T extends string> = { value: T; label: string; icon?: LucideIcon };

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex w-full rounded-full border border-line bg-field p-1 sm:inline-flex sm:w-auto">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[14px] sm:px-3.5 transition-colors ${
              active ? "text-on-ember font-semibold" : "text-ink-2 hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${id}-thumb`}
                className="absolute inset-0 rounded-full bg-ember"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {o.icon && <o.icon aria-hidden className="relative size-4" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
