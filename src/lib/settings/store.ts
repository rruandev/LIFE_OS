"use client";

import { useSyncExternalStore } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type ThemeChoice = "system" | "light" | "dark";
export type Settings = {
  theme: ThemeChoice;
  /** Troca o vidro por superfícies opacas. */
  solid: boolean;
  sidebar: "expanded" | "compact";
  displayName: string;
};
export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";
type Snapshot = { settings: Settings; sync: SyncStatus; error: string | null; email: string | null };

export const SETTINGS_KEY = "lifeos.settings";
const DEFAULTS: Settings = { theme: "system", solid: false, sidebar: "expanded", displayName: "" };
const SERVER: Snapshot = { settings: DEFAULTS, sync: "idle", error: null, email: null };

let snapshot: Snapshot = SERVER;
const listeners = new Set<() => void>();

function readLocal(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function applyToDocument(s: Settings) {
  const root = document.documentElement;
  if (s.theme === "system") delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  if (s.solid) root.dataset.solid = "true";
  else delete root.dataset.solid;
  root.dataset.sidebar = s.sidebar;
}

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  if (next.settings) {
    applyToDocument(snapshot.settings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(snapshot.settings));
    } catch {
      /* armazenamento indisponível: vale só para esta sessão */
    }
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  snapshot = { ...SERVER, settings: readLocal() };
  applyToDocument(snapshot.settings);
}

/** Busca perfil e preferências na nuvem e junta com o que está no aparelho. */
export async function loadRemoteSettings() {
  const supabase = getBrowserSupabase();
  if (!supabase) return;
  set({ sync: "loading", error: null });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    set({ sync: "idle" });
    return;
  }
  const [profile, prefs] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", auth.user.id).maybeSingle(),
    supabase
      .from("settings")
      .select("theme, reduce_transparency, sidebar")
      .eq("user_id", auth.user.id)
      .maybeSingle(),
  ]);
  if (profile.error || prefs.error) {
    set({
      sync: "error",
      email: auth.user.email ?? null,
      error: "Não foi possível carregar suas preferências. Usando as deste aparelho.",
    });
    return;
  }
  set({
    sync: "idle",
    email: auth.user.email ?? null,
    settings: {
      ...snapshot.settings,
      displayName: profile.data?.display_name ?? snapshot.settings.displayName,
      theme: (prefs.data?.theme as ThemeChoice) ?? snapshot.settings.theme,
      solid: prefs.data?.reduce_transparency ?? snapshot.settings.solid,
      sidebar: (prefs.data?.sidebar as Settings["sidebar"]) ?? snapshot.settings.sidebar,
    },
  });
}

/** Aplica na hora, guarda no aparelho e, com banco conectado, salva na nuvem. */
export async function updateSettings(patch: Partial<Settings>): Promise<boolean> {
  set({ settings: { ...snapshot.settings, ...patch } });
  const supabase = getBrowserSupabase();
  if (!supabase) {
    set({ sync: "saved", error: null });
    return true;
  }
  set({ sync: "saving", error: null });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    set({ sync: "error", error: "Sua sessão expirou. Entre de novo para salvar." });
    return false;
  }
  const s = snapshot.settings;
  const [profile, prefs] = await Promise.all([
    supabase.from("profiles").upsert({ id: auth.user.id, display_name: s.displayName }),
    supabase.from("settings").upsert({
      user_id: auth.user.id,
      theme: s.theme,
      reduce_transparency: s.solid,
      sidebar: s.sidebar,
    }),
  ]);
  if (profile.error || prefs.error) {
    set({ sync: "error", error: "Não foi possível salvar na nuvem. A mudança ficou só neste aparelho." });
    return false;
  }
  set({ sync: "saved" });
  return true;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSettings() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER,
  );
}

/** true depois que o componente montou no navegador (evita divergência com o HTML do servidor). */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
