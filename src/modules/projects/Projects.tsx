"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { clearOpenRequest, peekOpenRequest } from "@/lib/ui";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { isoDate, useNow } from "@/lib/dates";
import { tasks as taskStore, type Task } from "@/modules/my-day/store";
import { Detail } from "./Detail";
import { editorTitle, ItemEditor, ProjectEditor, ProjectTaskEditor, type Editor } from "./editors";
import { Meta, panel, Progress } from "./parts";
import { projectItems, projectProgress, projects as projectStore, type Project, type ProjectStatus } from "./store";

type Filter = ProjectStatus | "all";

const EMPTY: Record<Filter, string> = {
  active: "Nenhum projeto ativo no momento.",
  paused: "Nenhum projeto pausado.",
  done: "Nenhum projeto concluído ainda.",
  all: "",
};

export function Projects() {
  const now = useNow();
  const today = now ? isoDate(now) : null;
  const [selectedId, setSelectedId] = useState<string | null>(() => peekOpenRequest("project"));
  useEffect(() => clearOpenRequest("project"), []);
  const [filter, setFilter] = useState<Filter>("active");
  const [editor, setEditor] = useState<Editor>(null);
  const projectState = projectStore.use();
  const itemState = projectItems.use();
  const taskState = taskStore.use();

  const states = [projectState, itemState, taskState];
  const loading = states.some((s) => s.status === "idle" || s.status === "loading");
  const failure = projectState.error ?? itemState.error ?? taskState.error;
  const project = selectedId ? (projectState.items.find((p) => p.id === selectedId) ?? null) : null;
  const close = () => setEditor(null);

  return (
    <div className="mx-auto max-w-5xl">
      <PreviewBanner />

      {failure ? (
        <div className="space-y-3">
          <h1 className="pb-3 text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">Projects</h1>
          <Notice kind="error">{failure}</Notice>
          <Button
            variant="soft"
            onClick={() => {
              void projectStore.load(true);
              void projectItems.load(true);
              void taskStore.load(true);
            }}
          >
            Tentar de novo
          </Button>
        </div>
      ) : loading || !today ? (
        <div aria-busy="true" aria-label="Carregando">
          <div className="h-12 w-56 animate-pulse rounded-full bg-field" />
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className={`${panel} h-44 animate-pulse`} />
            <div className={`${panel} h-44 animate-pulse`} />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={project ? project.id : "list"}
            initial={{ opacity: 0, x: project ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: project ? 40 : -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 32, opacity: { duration: 0.18 } }}
          >
            {project ? (
              <Detail
                project={project}
                today={today}
                tasks={taskState.items}
                items={itemState.items}
                onBack={() => setSelectedId(null)}
                open={setEditor}
              />
            ) : (
              <List
                list={projectState.items}
                tasks={taskState.items}
                today={today}
                filter={filter}
                setFilter={setFilter}
                onOpen={setSelectedId}
                onNew={() => setEditor({ kind: "project" })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <Sheet open={editor !== null} onClose={close} title={editorTitle(editor)}>
        {editor?.kind === "project" && (
          <ProjectEditor
            key={editor.project?.id ?? "new"}
            project={editor.project}
            onClose={close}
            onCreated={(p) => setSelectedId(p.id)}
            onDeleted={() => setSelectedId(null)}
          />
        )}
        {editor?.kind === "task" && <ProjectTaskEditor key={editor.task.id} task={editor.task} onClose={close} />}
        {editor?.kind === "item" && (
          <ItemEditor
            key={editor.item?.id ?? `new-${editor.type}`}
            type={editor.type}
            projectId={editor.projectId}
            item={editor.item}
            onClose={close}
          />
        )}
      </Sheet>
    </div>
  );
}

export default Projects;

function List({
  list,
  tasks,
  today,
  filter,
  setFilter,
  onOpen,
  onNew,
}: {
  list: Project[];
  tasks: Task[];
  today: string;
  filter: Filter;
  setFilter: (f: Filter) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  // Com prazo primeiro (o mais próximo no topo); sem prazo, os mais recentes.
  const shown = list
    .filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) =>
      a.due_date && b.due_date
        ? a.due_date.localeCompare(b.due_date)
        : a.due_date
          ? -1
          : b.due_date
            ? 1
            : b.created_at.localeCompare(a.created_at),
    );

  return (
    <div>
      <header className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-ink-2">Tarefas, ideias e links de cada projeto em um só lugar</p>
          <h1 className="text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">Projects</h1>
        </div>
        {list.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<Filter>
              label="Filtrar projetos"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "active", label: "Ativos" },
                { value: "paused", label: "Pausados" },
                { value: "done", label: "Concluídos" },
                { value: "all", label: "Todos" },
              ]}
            />
            <Button onClick={onNew}>
              <Plus aria-hidden className="size-4" strokeWidth={2.5} />
              Novo projeto
            </Button>
          </div>
        )}
      </header>

      {list.length === 0 ? (
        <section className={panel}>
          <p className="mb-4 text-ink-2">
            Você ainda não tem projetos. Crie o primeiro para reunir as tarefas, as ideias e os links dele.
          </p>
          <Button onClick={onNew}>
            <Plus aria-hidden className="size-4" strokeWidth={2.5} />
            Novo projeto
          </Button>
        </section>
      ) : shown.length === 0 ? (
        <p className="py-6 text-ink-2">{EMPTY[filter]}</p>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {shown.map((p) => (
            <li key={p.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                className={`${panel} press flex h-full w-full flex-col gap-3 text-left hover:border-ember`}
              >
                <span className="block w-full min-w-0">
                  <span className="block truncate text-[19px] font-semibold">{p.name}</span>
                  {p.goal && <span className="mt-1 line-clamp-2 break-words text-[14px] text-ink-2">{p.goal}</span>}
                </span>
                <Meta project={p} today={today} />
                <span className="mt-auto block w-full">
                  <Progress {...projectProgress(tasks, p.id)} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
