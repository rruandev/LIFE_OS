"use client";

import { ExternalLink, FolderKanban, Pin, Plus, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { clearOpenRequest, peekOpenRequest } from "@/lib/ui";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { NoteEditor } from "./editor";
import {
  byPinnedThenRecent,
  categoriesOf,
  hostOf,
  isValidUrl,
  KIND,
  notes as noteStore,
  projects as projectStore,
  searchNotes,
  tagsOf,
  type Kind,
  type Note,
} from "./store";

type KindFilter = Kind | "all";
type Editor = { note?: Note } | null;

const panel = "surface rounded-panel p-5 sm:p-6";
const chip = "rounded-full px-2.5 py-0.5 text-[12px]";

export function Knowledge() {
  const noteState = noteStore.use();
  const projectState = projectStore.use();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [pickedCategory, setPickedCategory] = useState("");
  const [pickedTags, setPickedTags] = useState<string[]>([]);
  const [editor, setEditor] = useState<Editor>(() => {
    const id = peekOpenRequest("note");
    const note = id ? noteStore.get().items.find((n) => n.id === id) : undefined;
    return note ? { note } : null;
  });
  useEffect(() => clearOpenRequest("note"), []);

  const all = noteState.items;
  const categories = categoriesOf(all);
  const allTags = tagsOf(all);
  // Filtro de algo que deixou de existir (nota excluída ou editada) não vale mais.
  const category = categories.includes(pickedCategory) ? pickedCategory : "";
  const tags = pickedTags.filter((t) => allTags.includes(t));

  const filtering = query.trim() !== "" || kind !== "all" || category !== "" || tags.length > 0;
  const found = searchNotes(all, query, { kind, category, tags }).sort(byPinnedThenRecent);
  const projectName = new Map(projectState.items.map((p) => [p.id, p.name]));
  const loading = noteState.status === "idle" || noteState.status === "loading";

  const clear = () => {
    setQuery("");
    setKind("all");
    setPickedCategory("");
    setPickedTags([]);
  };
  const toggleTag = (tag: string) => setPickedTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);

  return (
    <div className="mx-auto max-w-6xl">
      <PreviewBanner />

      <header className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-ink-2">Notas, ideias, aprendizados e links</p>
          <h1 className="text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">Knowledge</h1>
        </div>
        <Button onClick={() => setEditor({})} className="self-start sm:self-auto">
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          Nova nota
        </Button>
      </header>

      {noteState.error ? (
        <div className="space-y-3">
          <Notice kind="error">{noteState.error}</Notice>
          <Button variant="soft" onClick={() => void noteStore.load(true)}>
            Tentar de novo
          </Button>
        </div>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando">
          <div className={`${panel} h-44 animate-pulse`} />
          <div className={`${panel} h-44 animate-pulse`} />
          <div className={`${panel} hidden h-44 animate-pulse md:block`} />
        </div>
      ) : all.length === 0 ? (
        <section className={`${panel} flex flex-col items-start gap-4`}>
          <p className="max-w-prose text-ink-2">
            Ainda não há nada guardado aqui. Crie a primeira nota para registrar uma ideia, um aprendizado ou um link
            que você quer encontrar depois.
          </p>
          <Button onClick={() => setEditor({})}>
            <Plus aria-hidden className="size-4" strokeWidth={2.5} />
            Nova nota
          </Button>
        </section>
      ) : (
        <>
          <section aria-label="Busca e filtros" className="mb-5 space-y-3">
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar nas notas"
                placeholder="Buscar nas notas"
                className="h-12 w-full rounded-full border border-line bg-field pl-11 pr-12 text-[15px] placeholder:text-ink-3 focus:border-ember focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setQuery("")}
                  className="press absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-2 hover:bg-ember-soft"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <Segmented<KindFilter>
                    label="Tipo de nota"
                    value={kind}
                    onChange={setKind}
                    options={[
                      { value: "all", label: "Todas" },
                      { value: "note", label: "Notas" },
                      { value: "idea", label: "Ideias" },
                      { value: "learning", label: "Aprendizados" },
                      { value: "link", label: "Links" },
                    ]}
                  />
                </div>
              </div>
              {categories.length > 0 && (
                <Select
                  label="Categoria"
                  value={category}
                  onChange={(e) => setPickedCategory(e.target.value)}
                  className="lg:w-64"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {allTags.length > 0 && (
              <div role="group" aria-label="Filtrar por tag" className="flex flex-wrap gap-2">
                {allTags.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(t)}
                      className={`press h-8 rounded-full border px-3 text-[13px] ${
                        active ? "border-transparent bg-ember font-semibold text-on-ember" : "border-line bg-field text-ink-2 hover:text-ink"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}

            {filtering && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2" role="status">
                <span>
                  {found.length === 1 ? "1 nota encontrada" : `${found.length} notas encontradas`}
                </span>
                {found.length > 0 && (
                  <button type="button" onClick={clear} className="press text-ember underline underline-offset-4">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </section>

          {found.length === 0 ? (
            <section className={`${panel} flex flex-col items-start gap-4`}>
              <div>
                <h2 className="text-[19px] font-semibold">Nenhuma nota encontrada</h2>
                <p className="mt-1 text-ink-2">Tente outras palavras ou remova algum filtro.</p>
              </div>
              <Button variant="soft" onClick={clear}>
                Limpar filtros
              </Button>
            </section>
          ) : (
            <ul className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
                {found.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    project={n.project_id ? projectName.get(n.project_id) : undefined}
                    onOpen={() => setEditor({ note: n })}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}

      <Sheet open={editor !== null} onClose={() => setEditor(null)} title={editor?.note ? "Editar nota" : "Nova nota"}>
        {editor && (
          <NoteEditor
            key={editor.note?.id ?? "nova"}
            note={editor.note}
            categories={categories}
            projects={projectState.items}
            onClose={() => setEditor(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function NoteCard({ note, project, onOpen }: { note: Note; project?: string; onOpen: () => void }) {
  const hasLink = isValidUrl(note.url);
  const host = hasLink ? hostOf(note.url) : "";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 340, damping: 34, opacity: { duration: 0.18 } }}
      className={`surface min-w-0 overflow-hidden rounded-panel ${note.pinned ? "border-ember" : ""}`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir nota: ${note.title}`}
        className={`press block w-full p-5 text-left hover:bg-field ${hasLink ? "pb-3" : ""}`}
      >
        <span className="flex items-center gap-2 text-[13px] text-ink-2">
          <span className={`${chip} bg-ember-soft font-medium text-ember`}>{KIND[note.kind]}</span>
          {note.category && <span className="min-w-0 truncate">{note.category}</span>}
          {note.pinned && <Pin aria-label="Fixada no topo" className="ml-auto size-4 shrink-0 text-ember" />}
        </span>
        <span className="mt-3 block break-words text-[17px] font-semibold leading-snug">{note.title}</span>
        {note.body && (
          <span className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-[14px] leading-relaxed text-ink-2">
            {note.body}
          </span>
        )}
        {note.kind === "link" && host && <span className="mt-2 block truncate text-[13px] text-ink-3">{host}</span>}
        {project && (
          <span className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-2">
            <FolderKanban aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">{project}</span>
          </span>
        )}
        {note.tags.length > 0 && (
          <span className="mt-3 flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
              <span key={t} className={`${chip} max-w-full truncate border border-line bg-field text-ink-2`}>
                {t}
              </span>
            ))}
          </span>
        )}
      </button>
      {hasLink && (
        <div className="px-5 pb-4">
          <a
            href={note.url}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex items-center gap-1.5 text-[14px] text-ember underline underline-offset-4"
          >
            <ExternalLink aria-hidden className="size-4" />
            Abrir link
          </a>
        </div>
      )}
    </motion.li>
  );
}
