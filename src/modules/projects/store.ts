"use client";

import { createCollection } from "@/lib/data/collection";
import type { Task } from "@/modules/my-day/store";

export type ProjectStatus = "active" | "paused" | "done";
export type Project = {
  id: string;
  name: string;
  goal: string;
  status: ProjectStatus;
  due_date: string | null;
  created_at: string;
};
export type ItemKind = "idea" | "link";
export type ProjectItem = {
  id: string;
  project_id: string;
  kind: ItemKind;
  title: string;
  url: string;
  body: string;
  created_at: string;
};

export const projects = createCollection<Project>("projects", "seus projetos");
export const projectItems = createCollection<ProjectItem>("project_items", "os itens do projeto");

export const STATUS: Record<ProjectStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  done: "Concluído",
};

/** Tarefas do projeto: pendentes primeiro, depois as concluídas. */
export const projectTasks = (list: Task[], projectId: string) =>
  list
    .filter((t) => t.project_id === projectId)
    .sort(
      (a, b) =>
        Number(Boolean(a.completed_at)) - Number(Boolean(b.completed_at)) || a.created_at.localeCompare(b.created_at),
    );

/** Progresso do projeto a partir das tarefas ligadas a ele. */
export function projectProgress(list: Task[], projectId: string) {
  const mine = list.filter((t) => t.project_id === projectId);
  const done = mine.filter((t) => t.completed_at).length;
  const total = mine.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export const isLate = (p: Project, today: string) => p.status !== "done" && p.due_date !== null && p.due_date < today;
