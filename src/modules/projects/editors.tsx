"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { showToast } from "@/lib/toast";
import { tasks, type Task } from "@/modules/my-day/store";
import { projectItems, projects, STATUS, type ItemKind, type Project, type ProjectItem, type ProjectStatus } from "./store";

export type Editor =
  | { kind: "project"; project?: Project }
  | { kind: "task"; task: Task }
  | { kind: "item"; type: ItemKind; projectId: string; item?: ProjectItem }
  | null;

export function editorTitle(editor: Editor) {
  if (!editor) return "";
  if (editor.kind === "project") return editor.project ? "Editar projeto" : "Novo projeto";
  if (editor.kind === "task") return "Editar tarefa";
  if (editor.type === "idea") return editor.item ? "Editar ideia" : "Nova ideia";
  return editor.item ? "Editar link" : "Novo link";
}

function Actions({ onRemove, save }: { onRemove?: () => void; save: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onRemove ? (
        <Button type="button" variant="quiet" onClick={onRemove} className="text-danger">
          Excluir
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit">{save}</Button>
    </div>
  );
}

/** Exclui o projeto com seus itens; "Desfazer" recoloca tudo e religa as tarefas. */
function deleteProject(project: Project) {
  const items = projectItems.get().items.filter((i) => i.project_id === project.id);
  const linked = tasks.get().items.filter((t) => t.project_id === project.id);
  void (async () => {
    for (const i of items) if (!(await projectItems.remove(i.id))) return;
    if (!(await projects.remove(project.id))) for (const i of items) await projectItems.restore(i);
  })();
  showToast({
    kind: "info",
    message: "Projeto excluído",
    action: {
      label: "Desfazer",
      run: () =>
        void (async () => {
          if (!(await projects.restore(project))) return;
          for (const i of items) await projectItems.restore(i);
          for (const t of linked)
            if (tasks.get().items.some((x) => x.id === t.id)) await tasks.update(t.id, { project_id: project.id });
        })(),
    },
  });
}

export function ProjectEditor({
  project,
  onClose,
  onCreated,
  onDeleted,
}: {
  project?: Project;
  onClose: () => void;
  onCreated: (p: Project) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [goal, setGoal] = useState(project?.goal ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");
  const [due, setDue] = useState(project?.due_date ?? "");
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const title = name.trim();
    if (!title) return setError("Dê um nome para o projeto.");
    if (title.length > 120) return setError("Use até 120 caracteres no nome.");
    const values = { name: title, goal: goal.trim(), status, due_date: due || null };
    if (project) void projects.update(project.id, values);
    else onCreated(projects.insert(values));
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={error} autoFocus />
      <TextArea label="Objetivo" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={2000} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Situação" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          {(Object.keys(STATUS) as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS[s]}
            </option>
          ))}
        </Select>
        <Field label="Prazo" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </div>
      <Actions
        save="Salvar projeto"
        onRemove={
          project
            ? () => {
                deleteProject(project);
                onDeleted();
                onClose();
              }
            : undefined
        }
      />
    </form>
  );
}

export function ProjectTaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [due, setDue] = useState(task.due_date ?? "");
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) return setError("Dê um título para a tarefa.");
    if (name.length > 200) return setError("Use até 200 caracteres no título.");
    void tasks.update(task.id, { title: name, due_date: due || null, due_time: due ? task.due_time : null });
    onClose();
  }

  function remove() {
    void tasks.remove(task.id);
    showToast({ kind: "info", message: "Tarefa excluída", action: { label: "Desfazer", run: () => void tasks.restore(task) } });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={error} autoFocus />
      <Field label="Prazo" type="date" value={due} onChange={(e) => setDue(e.target.value)} hint="Com prazo, a tarefa também aparece no My Day." />
      <Actions save="Salvar tarefa" onRemove={remove} />
    </form>
  );
}

export function ItemEditor({
  type,
  projectId,
  item,
  onClose,
}: {
  type: ItemKind;
  projectId: string;
  item?: ProjectItem;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const link = type === "link";

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = title.trim();
    const address = url.trim();
    const found: typeof errors = {};
    if (!name) found.title = link ? "Dê um nome para o link." : "Escreva a ideia em uma frase.";
    else if (name.length > 200) found.title = "Use até 200 caracteres.";
    if (link && !/^https?:\/\/\S+$/i.test(address)) found.url = "O endereço precisa começar com http:// ou https://";
    setErrors(found);
    if (Object.keys(found).length) return;
    const values = { title: name, url: link ? address : "", body: link ? "" : body.trim() };
    if (item) void projectItems.update(item.id, values);
    else projectItems.insert({ ...values, project_id: projectId, kind: type });
    onClose();
  }

  function remove() {
    if (!item) return;
    void projectItems.remove(item.id);
    showToast({
      kind: "info",
      message: link ? "Link excluído" : "Ideia excluída",
      action: { label: "Desfazer", run: () => void projectItems.restore(item) },
    });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label={link ? "Nome" : "Ideia"} value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} autoFocus />
      {link ? (
        <Field
          label="Endereço"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
        />
      ) : (
        <TextArea label="Detalhes" value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} />
      )}
      <Actions save={link ? "Salvar link" : "Salvar ideia"} onRemove={item ? remove : undefined} />
    </form>
  );
}
