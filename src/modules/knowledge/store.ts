"use client";

import { createCollection } from "@/lib/data/collection";

export type Kind = "note" | "idea" | "learning" | "link";
export type Note = {
  id: string;
  title: string;
  body: string;
  kind: Kind;
  category: string;
  tags: string[];
  url: string;
  /** Projeto ao qual a nota está ligada (opcional). */
  project_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at?: string;
};
export type ProjectRef = { id: string; created_at: string; name: string };

export const notes = createCollection<Note>("notes", "suas notas");
/** Só leitura: usado para oferecer "ligar a um projeto". */
export const projects = createCollection<ProjectRef>("projects", "seus projetos");

export const KIND: Record<Kind, string> = {
  note: "Nota",
  idea: "Ideia",
  learning: "Aprendizado",
  link: "Link",
};
export const KINDS = Object.keys(KIND) as Kind[];

export type NoteFilters = { kind: Kind | "all"; category: string; tags: string[] };
export const NO_FILTERS: NoteFilters = { kind: "all", category: "", tags: [] };

/** Minúsculas e sem acentos, para comparar texto. */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Filtra por texto (título, corpo, categoria e tags) e pelos filtros escolhidos. */
export function searchNotes(list: Note[], query: string, filters: NoteFilters = NO_FILTERS) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return list.filter((n) => {
    if (filters.kind !== "all" && n.kind !== filters.kind) return false;
    if (filters.category && n.category !== filters.category) return false;
    if (filters.tags.some((t) => !n.tags.includes(t))) return false;
    if (words.length === 0) return true;
    const text = fold([n.title, n.body, n.category, ...n.tags].join("\n"));
    return words.every((w) => text.includes(w));
  });
}

/** Fixadas primeiro, depois as mais recentes. */
export const byPinnedThenRecent = (a: Note, b: Note) =>
  Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at);

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR"));
export const categoriesOf = (list: Note[]) => unique(list.map((n) => n.category).filter(Boolean));
export const tagsOf = (list: Note[]) => unique(list.flatMap((n) => n.tags));

/** "ia, Negócios, ia" vira ["ia", "negócios"]. */
export const parseTags = (text: string) => [
  ...new Set(
    text
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  ),
];

export function isValidUrl(url: string) {
  if (!/^https?:\/\/\S+$/i.test(url)) return false;
  try {
    return Boolean(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Domínio do link, sem "www.". */
export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
