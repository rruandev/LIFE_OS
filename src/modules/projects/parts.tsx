"use client";

import { motion } from "motion/react";
import { fmtShort, fromISODate } from "@/lib/dates";
import { isLate, STATUS, type Project } from "./store";

export const panel = "surface rounded-panel p-5 sm:p-6";

export function Progress({ done, total, pct }: { done: number; total: number; pct: number }) {
  return (
    <span className="block">
      <span
        className="block h-1.5 overflow-hidden rounded-full bg-field"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do projeto"
      >
        <motion.span
          className="block h-full rounded-full bg-ember"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        />
      </span>
      <span className="mt-1.5 block text-[13px] text-ink-2">
        {total === 0 ? "Nenhuma tarefa ainda" : `${done} de ${total} ${total === 1 ? "tarefa" : "tarefas"}`}
      </span>
    </span>
  );
}

export function Meta({ project, today }: { project: Project; today: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
      <span className={`rounded-full px-2.5 py-0.5 ${project.status === "active" ? "bg-ember-soft text-ember" : "bg-field"}`}>
        {STATUS[project.status]}
      </span>
      {project.due_date && <span>Prazo: {fmtShort.format(fromISODate(project.due_date))}</span>}
      {isLate(project, today) && <span className="text-danger">Atrasado</span>}
    </span>
  );
}
