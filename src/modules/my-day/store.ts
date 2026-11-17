"use client";

import { createCollection } from "@/lib/data/collection";
import { addDays, fromISODate } from "@/lib/dates";

export type Priority = "high" | "medium" | "low";
export type Task = {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  due_date: string | null;
  due_time: string | null;
  remind_at: string | null;
  reminded_at: string | null;
  completed_at: string | null;
  /** Projeto ao qual a tarefa pertence (opcional). */
  project_id?: string | null;
  created_at: string;
};
export type CalEvent = {
  id: string;
  title: string;
  notes: string;
  location: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  remind_at: string | null;
  reminded_at: string | null;
  created_at: string;
};

export const tasks = createCollection<Task>("tasks", "suas tarefas");
export const events = createCollection<CalEvent>("events", "seus compromissos");

export const PRIORITY: Record<Priority, { label: string; rank: number }> = {
  high: { label: "Alta", rank: 0 },
  medium: { label: "Média", rank: 1 },
  low: { label: "Baixa", rank: 2 },
};

/** Hora da tarefa como HH:MM (o banco devolve HH:MM:SS). */
export const taskTime = (t: Task) => (t.due_time ? t.due_time.slice(0, 5) : null);

export const byPriority = (a: Task, b: Task) =>
  PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || a.created_at.localeCompare(b.created_at);

export function eventsOn(list: CalEvent[], date: string) {
  const start = fromISODate(date).getTime();
  const end = fromISODate(addDays(date, 1)).getTime();
  return list
    .filter((e) => new Date(e.starts_at).getTime() < end && new Date(e.ends_at).getTime() > start)
    .sort((a, b) => Number(b.all_day) - Number(a.all_day) || a.starts_at.localeCompare(b.starts_at));
}

export const tasksOn = (list: Task[], date: string) => list.filter((t) => t.due_date === date);
export const overdue = (list: Task[], today: string) =>
  list.filter((t) => !t.completed_at && t.due_date !== null && t.due_date < today).sort(byPriority);

/** Ids de compromissos com horário que se sobrepõem a outro no mesmo dia. */
export function conflicts(list: CalEvent[]) {
  const timed = list.filter((e) => !e.all_day);
  const ids = new Set<string>();
  for (let i = 0; i < timed.length; i++)
    for (let j = i + 1; j < timed.length; j++)
      if (timed[i].starts_at < timed[j].ends_at && timed[j].starts_at < timed[i].ends_at) {
        ids.add(timed[i].id);
        ids.add(timed[j].id);
      }
  return ids;
}

export const toggleTask = (t: Task) =>
  tasks.update(t.id, { completed_at: t.completed_at ? null : new Date().toISOString() });
