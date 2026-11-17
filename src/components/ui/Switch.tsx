"use client";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors ${
        checked ? "border-transparent bg-ember" : "border-line bg-field"
      }`}
    >
      <span
        className={`absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-white shadow-md transition-[left] duration-200 ${
          checked ? "left-[27px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}
