"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useSyncExternalStore } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { showToast } from "@/lib/toast";

type Status = "idle" | "loading" | "ready" | "error";
export type CollectionState<T> = { items: T[]; status: Status; error: string | null };
type Row = { id: string; created_at: string };

const resets: Array<() => void> = [];
const refreshers: Array<() => void> = [];

/** Esvazia os dados em memória (usado ao sair da conta). */
export const resetCollections = () => resets.forEach((r) => r());

if (typeof document !== "undefined") {
  // Ao voltar para o app, busca de novo o que pode ter mudado em outro aparelho.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshers.forEach((r) => r());
  });
}

/** crypto.randomUUID só existe em contexto seguro; este funciona também no celular via rede local. */
export function uuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Uma tabela do usuário, em memória. Toda mudança aparece na tela na hora e é
 * gravada em seguida; se a gravação falhar, a tela volta ao estado anterior e
 * avisa. Sem banco conectado (pré-visualização), grava no navegador.
 */
export function createCollection<T extends Row>(table: string, label: string) {
  const EMPTY: CollectionState<T> = { items: [], status: "idle", error: null };
  let state = EMPTY;
  let loadedAt = 0;
  let pending = 0;
  const listeners = new Set<() => void>();
  const localKey = `lifeos.data.${table}`;

  const emit = (next: Partial<CollectionState<T>>) => {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };

  async function load(force = false) {
    if (state.status === "loading" || (!force && state.status === "ready")) return;
    const first = state.status !== "ready";
    if (first) emit({ status: "loading", error: null });
    const supabase = getBrowserSupabase();
    if (!supabase) {
      let items: T[] = [];
      try {
        items = JSON.parse(localStorage.getItem(localKey) ?? "[]");
      } catch {
        /* dado local ilegível: começa vazio */
      }
      loadedAt = Date.now();
      return emit({ items, status: "ready" });
    }
    const { data, error } = await supabase.from(table).select("*").order("created_at");
    if (error) {
      if (first) emit({ status: "error", error: `Não foi possível carregar ${label}. Confira a conexão.` });
      return;
    }
    if (pending > 0) return; // há mudança em andamento; não sobrescreve
    loadedAt = Date.now();
    emit({ items: (data ?? []) as T[], status: "ready", error: null });
  }

  async function commit(
    items: T[],
    write: (db: SupabaseClient) => PromiseLike<{ error: unknown }>,
    failure: string,
  ) {
    const before = state.items;
    emit({ items });
    const supabase = getBrowserSupabase();
    if (!supabase) {
      try {
        localStorage.setItem(localKey, JSON.stringify(items));
      } catch {
        /* sem espaço no navegador */
      }
      return true;
    }
    pending++;
    let failed = false;
    try {
      failed = Boolean((await write(supabase)).error);
    } catch {
      failed = true;
    }
    pending--;
    if (failed) {
      emit({ items: before });
      showToast({ kind: "error", message: failure });
    }
    return !failed;
  }

  resets.push(() => {
    loadedAt = 0;
    emit(EMPTY);
  });
  refreshers.push(() => {
    if (state.status === "ready" && pending === 0 && Date.now() - loadedAt > 20000) void load(true);
  });

  return {
    load,
    get: () => state,
    insert(values: Omit<T, "id" | "created_at">) {
      const row = { ...values, id: uuid(), created_at: new Date().toISOString() } as T;
      void commit([...state.items, row], (db) => db.from(table).insert(row), "Não foi possível salvar. Nada foi criado.");
      return row;
    },
    /** Recoloca uma linha excluída (desfazer). */
    restore(row: T) {
      return commit([...state.items, row], (db) => db.from(table).insert(row), "Não foi possível desfazer.");
    },
    update(id: string, patch: Partial<T>) {
      return commit(
        state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        (db) => db.from(table).update(patch as never).eq("id", id),
        "Não foi possível salvar a alteração.",
      );
    },
    remove(id: string) {
      return commit(
        state.items.filter((i) => i.id !== id),
        (db) => db.from(table).delete().eq("id", id),
        "Não foi possível excluir.",
      );
    },
    use() {
      const snapshot = useSyncExternalStore(
        (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => state,
        () => EMPTY,
      );
      useEffect(() => {
        void load();
      }, []);
      return snapshot;
    },
  };
}
