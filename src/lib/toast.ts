"use client";

import { useSyncExternalStore } from "react";

export type Toast = {
  id: number;
  kind: "info" | "error" | "reminder";
  message: string;
  action?: { label: string; run: () => void };
};

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Mostra um aviso. Lembretes ficam até serem fechados; os demais somem sozinhos. */
export function showToast(toast: Omit<Toast, "id">) {
  const id = nextId++;
  toasts = [...toasts, { ...toast, id }];
  emit();
  if (toast.kind !== "reminder") setTimeout(() => dismissToast(id), toast.action ? 6000 : 4500);
  return id;
}

const EMPTY: Toast[] = [];
export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
}
