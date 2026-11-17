"use client";

import { useSyncExternalStore } from "react";
import { createCollection } from "@/lib/data/collection";

export type AiMessage = { id: string; role: "user" | "assistant"; content: string; created_at: string };
export type Briefing = { id: string; day: string; content: string; created_at: string };

export const aiMessages = createCollection<AiMessage>("ai_messages", "a conversa com o assistente");
export const briefings = createCollection<Briefing>("briefings", "seus briefings");

type Status = { state: "loading" | "ready" | "error"; configured: boolean; provider: string | null; model: string | null };
let status: Status = { state: "loading", configured: false, provider: null, model: null };
let started = false;
const listeners = new Set<() => void>();

async function loadStatus() {
  try {
    const res = await fetch("/api/ai/status", { cache: "no-store" });
    const data = await res.json();
    status = { state: "ready", configured: Boolean(data.configured), provider: data.provider ?? null, model: data.model ?? null };
  } catch {
    status = { ...status, state: "error" };
  }
  listeners.forEach((l) => l());
}

const SERVER: Status = { state: "loading", configured: false, provider: null, model: null };

/** Se a IA está ligada no servidor (sem expor a chave). */
export function useAiStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!started) {
        started = true;
        void loadStatus();
      }
      return () => listeners.delete(l);
    },
    () => status,
    () => SERVER,
  );
}

export type Proposed = { kind: "tarefa" | "nota"; title: string; extra: string };
const ACTION = /\[\[acao:(tarefa|nota)\|([^|\]]{1,200})\|([^\]]{0,2000})\]\]/g;

/** Separa o texto da resposta das ações que a IA sugeriu (cada uma só roda com confirmação). */
export function splitActions(content: string): { text: string; actions: Proposed[] } {
  const actions: Proposed[] = [];
  const text = content
    .replace(ACTION, (_, kind: Proposed["kind"], title: string, extra: string) => {
      actions.push({ kind, title: title.trim(), extra: extra.trim() });
      return "";
    })
    .trim();
  return { text, actions };
}

/** Pede uma resposta ao servidor. Lança Error com mensagem em português quando falha. */
export async function askAi(body: { mode: "chat" | "briefing"; today: string; messages?: { role: "user" | "assistant"; content: string }[] }) {
  let res: Response;
  try {
    res = await fetch("/api/ai/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Sem conexão com o servidor do app.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.reply) throw new Error(data?.error ?? "A resposta não chegou. Tente de novo.");
  return String(data.reply);
}
