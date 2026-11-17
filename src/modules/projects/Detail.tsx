"use client";

import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { fmtShort, fromISODate } from "@/lib/dates";
import { Check_ } from "@/modules/my-day/items";
import { tasks as taskStore, type Task } from "@/modules/my-day/store";
import type { Editor } from "./editors";
import { Meta, panel, Progress } from "./parts";
import { projectProgress, projects, projectTasks, type Project, type ProjectItem, type ProjectStatus } from "./store";

const row = { layout: "position" as const, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

export function Detail({
  project,
  today,
  tasks,
  items,
  onBack,
  open,
}: {
  project: Project;
  today: string;
  tasks: Task[];
  items: ProjectItem[];
  onBack: () => void;
  open: (editor: Editor) => void;
}) {
  const [quick, setQuick] = useState("");
  const mine = projectTasks(tasks, project.id);
  const progress = projectProgress(tasks, project.id);
  const own = items.filter((i) => i.project_id === project.id);
  const ideas = own.filter((i) => i.kind === "idea");
  const links = own.filter((i) => i.kind === "link");

  function add(e: FormEvent) {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    taskStore.insert({
      title: title.slice(0, 200),
      notes: "",
      priority: "medium",
      due_date: null,
      due_time: null,
      remind_at: null,
      reminded_at: null,
      completed_at: null,
      project_id: project.id,
    });
    setQuick("");
  }

  return (
    <div>
      <Button variant="quiet" onClick={onBack} className="-ml-3 mb-3 h-10 px-3">
        <ArrowLeft aria-hidden className="size-4" />
        Voltar
      </Button>

      <header className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">{project.name}</h1>
          {project.goal && <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-ink-2">{project.goal}</p>}
          <div className="mt-3">
            <Meta project={project} today={today} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<ProjectStatus>
            label="Situação do projeto"
            value={project.status}
            onChange={(status) => void projects.update(project.id, { status })}
            options={[
              { value: "active", label: "Ativo" },
              { value: "paused", label: "Pausado" },
              { value: "done", label: "Concluído" },
            ]}
          />
          <Button variant="soft" onClick={() => open({ kind: "project", project })}>
            <Pencil aria-hidden className="size-4" />
            Editar projeto
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className={`${panel} lg:row-span-2`} aria-labelledby="p-tarefas">
          <h2 id="p-tarefas" className="mb-3 text-[19px] font-semibold">
            Tarefas
          </h2>
          <div className="mb-4">
            <Progress {...progress} />
          </div>
          <form onSubmit={add} className="mb-3 flex gap-2">
            <input
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              aria-label="Adicionar tarefa ao projeto"
              placeholder="Adicionar tarefa ao projeto"
              maxLength={200}
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-field px-4 text-[15px] placeholder:text-ink-3 focus:border-ember focus:outline-none"
            />
            <Button type="submit" disabled={!quick.trim()} className="px-4">
              Adicionar
            </Button>
          </form>
          {mine.length === 0 ? (
            <p className="py-4 text-ink-2">Nenhuma tarefa neste projeto ainda. Escreva a primeira no campo acima.</p>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {mine.map((t) => {
                  const done = Boolean(t.completed_at);
                  const late = !done && t.due_date !== null && t.due_date < today;
                  return (
                    <motion.li key={t.id} {...row} className="flex items-center gap-3">
                      <Check_ task={t} />
                      <button
                        type="button"
                        onClick={() => open({ kind: "task", task: t })}
                        className="press min-w-0 flex-1 rounded-item px-2 py-2.5 text-left hover:bg-field"
                      >
                        <span className={`block truncate ${done ? "text-ink-3 line-through" : ""}`}>{t.title}</span>
                        {t.due_date && (
                          <span className={`mt-0.5 block text-[13px] ${late ? "text-danger" : "text-ink-2"}`}>
                            {late ? "Atrasada desde" : "Prazo:"} {fmtShort.format(fromISODate(t.due_date))}
                          </span>
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </section>

        <ItemSection
          id="p-ideias"
          title="Ideias"
          addLabel="Nova ideia"
          onAdd={() => open({ kind: "item", type: "idea", projectId: project.id })}
          empty="Nenhuma ideia guardada. Anote a primeira para não perder."
          count={ideas.length}
        >
          {ideas.map((i) => (
            <motion.li key={i.id} {...row}>
              <button
                type="button"
                onClick={() => open({ kind: "item", type: "idea", projectId: project.id, item: i })}
                className="press w-full rounded-item px-2 py-2.5 text-left hover:bg-field"
              >
                <span className="block break-words font-medium">{i.title}</span>
                {i.body && <span className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-[14px] text-ink-2">{i.body}</span>}
              </button>
            </motion.li>
          ))}
        </ItemSection>

        <ItemSection
          id="p-links"
          title="Links e documentos"
          addLabel="Novo link"
          onAdd={() => open({ kind: "item", type: "link", projectId: project.id })}
          empty="Nenhum link ou documento. Guarde aqui o que o projeto precisa ter à mão."
          count={links.length}
        >
          {links.map((i) => (
            <motion.li key={i.id} {...row} className="flex items-center gap-1">
              <a
                href={i.url}
                target="_blank"
                rel="noopener noreferrer"
                className="press flex min-w-0 flex-1 items-center gap-3 rounded-item px-2 py-2.5 hover:bg-field"
              >
                <ExternalLink aria-hidden className="size-4 shrink-0 text-ember" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{i.title}</span>
                  <span className="block truncate text-[13px] text-ink-3">{i.url.replace(/^https?:\/\//i, "")}</span>
                </span>
              </a>
              <button
                type="button"
                aria-label={`Editar link: ${i.title}`}
                onClick={() => open({ kind: "item", type: "link", projectId: project.id, item: i })}
                className="press flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-field hover:text-ink"
              >
                <Pencil aria-hidden className="size-4" />
              </button>
            </motion.li>
          ))}
        </ItemSection>
      </div>
    </div>
  );
}

function ItemSection({
  id,
  title,
  addLabel,
  onAdd,
  empty,
  count,
  children,
}: {
  id: string;
  title: string;
  addLabel: string;
  onAdd: () => void;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className={panel} aria-labelledby={id}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={id} className="text-[19px] font-semibold">
          {title}
        </h2>
        <Button variant="soft" onClick={onAdd} className="h-10 px-4">
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          {addLabel}
        </Button>
      </div>
      {count === 0 && <p className="py-4 text-ink-2">{empty}</p>}
      <ul>
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </ul>
    </section>
  );
}
