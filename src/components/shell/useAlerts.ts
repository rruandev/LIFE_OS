"use client";

import { addDays, fmtShort, fromISODate, isoDate, timeOf, useNow } from "@/lib/dates";
import type { OpenKind } from "@/lib/ui";
import { bills, brl, num } from "@/modules/finance/store";
import { goals } from "@/modules/growth/store";
import { conflicts, events, eventsOn, overdue, tasks } from "@/modules/my-day/store";
import { isLate, projects } from "@/modules/projects/store";

export type Alert = {
  id: string;
  tone: "urgent" | "soon";
  title: string;
  detail: string;
  href: string;
  open?: { kind: OpenKind; id: string };
};

/** Avisos calculados na hora a partir dos seus dados; nada é inventado nem guardado. */
export function useAlerts(): Alert[] {
  const now = useNow();
  const t = tasks.use();
  const e = events.use();
  const b = bills.use();
  const p = projects.use();
  const g = goals.use();
  if (!now) return [];
  const today = isoDate(now);
  const list: Alert[] = [];

  for (const task of overdue(t.items, today).slice(0, 6))
    list.push({
      id: `late-${task.id}`,
      tone: "urgent",
      title: task.title,
      detail: `Tarefa atrasada desde ${fmtShort.format(fromISODate(task.due_date!))}`,
      href: "/my-day",
      open: { kind: "task", id: task.id },
    });

  const soon = now.getTime() + 24 * 3600_000;
  for (const ev of e.items)
    if (!ev.all_day && new Date(ev.starts_at).getTime() > now.getTime() && new Date(ev.starts_at).getTime() <= soon)
      list.push({
        id: `ev-${ev.id}`,
        tone: "soon",
        title: ev.title,
        detail: `Compromisso ${isoDate(new Date(ev.starts_at)) === today ? "hoje" : "amanhã"} às ${timeOf(ev.starts_at)}`,
        href: "/my-day",
        open: { kind: "event", id: ev.id },
      });

  const clash = conflicts(eventsOn(e.items, today));
  if (clash.size > 0)
    list.push({ id: "clash", tone: "urgent", title: "Compromissos no mesmo horário", detail: `${clash.size} compromissos de hoje se sobrepõem`, href: "/my-day" });

  for (const bill of b.items) {
    if (bill.paid_at) continue;
    const value = bill.amount === null ? "" : ` · ${brl.format(num(bill.amount))}`;
    if (bill.due_date < today)
      list.push({ id: `bill-${bill.id}`, tone: "urgent", title: bill.name, detail: `Conta vencida em ${fmtShort.format(fromISODate(bill.due_date))}${value}`, href: "/finance" });
    else if (bill.due_date <= addDays(today, 3))
      list.push({ id: `bill-${bill.id}`, tone: "soon", title: bill.name, detail: `Conta vence ${bill.due_date === today ? "hoje" : `em ${fmtShort.format(fromISODate(bill.due_date))}`}${value}`, href: "/finance" });
  }

  for (const project of p.items) {
    if (isLate(project, today))
      list.push({ id: `proj-${project.id}`, tone: "urgent", title: project.name, detail: "Projeto passou do prazo", href: "/projects", open: { kind: "project", id: project.id } });
    else if (project.status === "active") {
      // Projeto parado: ativo há mais de 14 dias sem nenhuma tarefa concluída nesse período.
      const cutoff = now.getTime() - 14 * 86400_000;
      const mine = t.items.filter((x) => x.project_id === project.id);
      const moved = mine.some((x) => (x.completed_at && new Date(x.completed_at).getTime() > cutoff) || new Date(x.created_at).getTime() > cutoff);
      if (new Date(project.created_at).getTime() < cutoff && !moved)
        list.push({ id: `idle-${project.id}`, tone: "soon", title: project.name, detail: "Projeto sem progresso há mais de 14 dias", href: "/projects", open: { kind: "project", id: project.id } });
    }
  }

  for (const goal of g.items)
    if (goal.status === "active" && goal.target_date && goal.target_date < today)
      list.push({ id: `goal-${goal.id}`, tone: "urgent", title: goal.title, detail: "Meta passou da data alvo", href: "/growth" });

  return list.sort((a, b2) => Number(a.tone === "soon") - Number(b2.tone === "soon"));
}
