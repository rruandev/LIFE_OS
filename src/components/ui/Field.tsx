import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, className = "", ...rest }: Props) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? noteId : undefined}
        className={`h-12 w-full rounded-item border bg-field px-4 text-[15px] text-ink placeholder:text-ink-3 transition focus:border-ember focus:outline-none ${
          error ? "border-danger" : "border-line"
        }`}
        {...rest}
      />
      {(error || hint) && (
        <p id={noteId} className={`mt-1.5 text-[13px] ${error ? "text-danger" : "text-ink-3"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

const control =
  "w-full rounded-item border border-line bg-field px-4 text-[15px] text-ink placeholder:text-ink-3 transition focus:border-ember focus:outline-none";

export function TextArea({
  label,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <textarea id={id} rows={3} className={`${control} resize-y py-3`} {...rest} />
    </div>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <select id={id} className={`${control} h-12`} {...rest}>
        {children}
      </select>
    </div>
  );
}
