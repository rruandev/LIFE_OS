"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export const panel = "surface min-w-0 rounded-panel p-5 sm:p-6";

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="press flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-field text-ink hover:bg-ember-soft disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

/** Barra fina de progresso (0 a 100). */
export function Bar({ value, label, done = false }: { value: number; label: string; done?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-field"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${done ? "bg-ok" : "bg-ember"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Rodapé padrão dos formulários: excluir à esquerda (se houver), salvar à direita. */
export function EditorActions({ onRemove, extra, submit }: { onRemove?: () => void; extra?: ReactNode; submit: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="flex items-center gap-1">
        {onRemove && (
          <Button type="button" variant="quiet" onClick={onRemove} className="px-4 text-danger">
            Excluir
          </Button>
        )}
        {extra}
      </div>
      <Button type="submit">{submit}</Button>
    </div>
  );
}
