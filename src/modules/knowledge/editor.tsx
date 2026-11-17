"use client";

import { ExternalLink } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { showToast } from "@/lib/toast";
import { isValidUrl, KIND, KINDS, notes, parseTags, type Kind, type Note, type ProjectRef } from "./store";

type Errors = { title?: string; tags?: string; url?: string };

export function NoteEditor({
  note,
  categories,
  projects,
  onClose,
}: {
  note?: Note;
  categories: string[];
  projects: ProjectRef[];
  onClose: () => void;
}) {
  const listId = useId();
  const [title, setTitle] = useState(note?.title ?? "");
  const [kind, setKind] = useState<Kind>(note?.kind ?? "note");
  const [body, setBody] = useState(note?.body ?? "");
  const [category, setCategory] = useState(note?.category ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [url, setUrl] = useState(note?.url ?? "");
  const [projectId, setProjectId] = useState(note?.project_id ?? "");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [errors, setErrors] = useState<Errors>({});

  const link = url.trim();
  const orphanProject = projectId !== "" && !projects.some((p) => p.id === projectId);

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = title.trim();
    const tagList = parseTags(tags);
    const found: Errors = {};
    if (!name) found.title = "Dê um título para a nota.";
    else if (name.length > 200) found.title = "Use até 200 caracteres no título.";
    if (tagList.length > 12) found.tags = "Use até 12 tags.";
    else if (tagList.some((t) => t.length > 30)) found.tags = "Cada tag pode ter até 30 caracteres.";
    if (kind === "link" && !link) found.url = "Informe o endereço do link.";
    else if (link && !isValidUrl(link)) found.url = "O link precisa começar com http:// ou https://.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const values = {
      title: name,
      kind,
      body: body.trimEnd(),
      category: category.trim(),
      tags: tagList,
      url: link,
      project_id: projectId || null,
      pinned,
    };
    if (note) void notes.update(note.id, { ...values, updated_at: new Date().toISOString() });
    else notes.insert(values);
    onClose();
  }

  function remove() {
    if (!note) return;
    void notes.remove(note.id);
    showToast({ kind: "info", message: "Nota excluída", action: { label: "Desfazer", run: () => void notes.restore(note) } });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} autoFocus={!note} />
      <Select label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {KIND[k]}
          </option>
        ))}
      </Select>
      <TextArea label="Conteúdo" rows={8} value={body} onChange={(e) => setBody(e.target.value)} maxLength={50000} />
      <div>
        <Field
          label={kind === "link" ? "Link" : "Link (opcional)"}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
        />
        {isValidUrl(link) && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="press mt-2 inline-flex items-center gap-1.5 text-[14px] text-ember underline underline-offset-4"
          >
            <ExternalLink aria-hidden className="size-4" />
            Abrir link
          </a>
        )}
      </div>
      <Field
        label="Categoria"
        list={listId}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        maxLength={60}
        autoComplete="off"
      />
      <datalist id={listId}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <Field
        label="Tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        error={errors.tags}
        hint="Separe por vírgula. Exemplo: ia, negócios"
        autoComplete="off"
      />
      <Select label="Projeto" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
        <option value="">Nenhum projeto</option>
        {orphanProject && <option value={projectId}>Projeto vinculado</option>}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium">Fixar no topo</span>
        <Switch label="Fixar no topo" checked={pinned} onChange={setPinned} />
      </div>
      <div className="flex items-center justify-between gap-3 pt-2">
        {note ? (
          <Button type="button" variant="quiet" onClick={remove} className="text-danger">
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">Salvar nota</Button>
      </div>
    </form>
  );
}
