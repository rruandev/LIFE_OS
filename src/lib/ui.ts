"use client";

import { useSyncExternalStore } from "react";

export type Panel = "capture" | "search" | "alerts" | null;
export type OpenKind = "task" | "event" | "project" | "note";

let panel: Panel = null;
let request: { kind: OpenKind; id: string } | null = null;
let version = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Abre ou fecha um dos painéis globais (captura, busca, notificações). */
export function setPanel(next: Panel) {
  panel = next;
  emit();
}
export const usePanel = () => useSyncExternalStore(subscribe, () => panel, () => null);

/** Pede para a tela de destino abrir um item específico (vindo da busca ou de um aviso). */
export function requestOpen(kind: OpenKind, id: string) {
  request = { kind, id };
  version++;
  emit();
}
/** Lê o pedido sem consumir; a tela chama clearOpenRequest depois de montar. */
export const peekOpenRequest = (kind: OpenKind) => (request?.kind === kind ? request.id : null);
export function clearOpenRequest(kind: OpenKind) {
  if (request?.kind === kind) request = null;
}
export const useOpenVersion = () => useSyncExternalStore(subscribe, () => version, () => 0);
