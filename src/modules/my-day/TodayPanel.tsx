"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { timeOf } from "@/lib/dates";
import { Check_ } from "./items";
import { byPriority, events as eventStore, eventsOn, overdue, tasks as taskStore, tasksOn, taskTime } from "./store";

/** Resumo do dia na Home: próximos compromissos e tarefas pendentes. */
export function TodayPanel({ today, now }: { today: string; now: Date }) {
  const t = taskStore.use();
  const e = eventStore.use();
  if (t.status !== "ready" || e.status !== "ready") {
    return <div className="glass h-44 animate-pulse rounded-panel" aria-busy="true" aria-label="Carregando o seu dia" />;
  }
  const upcoming = eventsOn(e.items, today).filter((ev) => ev.all_day || new Date(ev.ends_at) > now).slice(0, 3);
  const pending = tasksOn(t.items, today).filter((x) => !x.completed_at).sort(byPriority);
  const late = overdue(t.items, today);
  const empty = upcoming.length + pending.length + late.length === 0;

  return (
    <section aria-labelledby="hoje" className="glass rounded-panel p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="hoje" className="text-[19px] font-semibold">
          Hoje
        </h2>
        <Link href="/my-day" className="press flex items-center gap-1 rounded-full text-[14px] text-ink-2 hover:text-ink">
          Abrir My Day
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      </div>
      {empty ? (
        <p className="text-ink-2">Nada marcado para hoje. Crie tarefas e compromissos no My Day.</p>
      ) : (
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-[13px] font-medium text-ink-3">Próximos compromissos</h3>
            {upcoming.length === 0 ? (
              <p className="text-[14px] text-ink-2">Nenhum compromisso restante hoje.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((ev) => (
                  <li key={ev.id} className="flex gap-3 py-2">
                    <span className="w-14 shrink-0 tabular-nums text-ink-2">{ev.all_day ? "Dia todo" : timeOf(ev.starts_at)}</span>
                    <span className="truncate font-medium">{ev.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-1 text-[13px] font-medium text-ink-3">
              Tarefas pendentes
              {late.length > 0 && <span className="text-danger"> · {late.length} atrasada{late.length > 1 ? "s" : ""}</span>}
            </h3>
            {pending.length + late.length === 0 ? (
              <p className="text-[14px] text-ink-2">Tudo concluído por hoje.</p>
            ) : (
              <ul className="divide-y divide-line">
                {[...late, ...pending].slice(0, 5).map((x) => (
                  <li key={x.id} className="flex items-center gap-3 py-2">
                    <Check_ task={x} small />
                    <span className="min-w-0 flex-1 truncate">{x.title}</span>
                    {taskTime(x) && <span className="tabular-nums text-ink-2">{taskTime(x)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
