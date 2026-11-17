"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { addDays, fmtDayMonth, fmtFull, fmtMonthYear, fmtShort, fromISODate, startOfWeek } from "@/lib/dates";
import { HabitEditor } from "./editors";
import {
  habitLogs,
  habits as habitStore,
  indexLogs,
  logKey,
  streak,
  weekCompletion,
  weekCount,
  type Habit,
  type HabitLog,
} from "./store";
import { Bar, IconButton, panel } from "./ui";

const INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];
type Editor = { habit?: Habit } | null;

export function Habits({ today, habits, logs }: { today: string; habits: Habit[]; logs: HabitLog[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [showArchived, setShowArchived] = useState(false);

  const thisWeek = startOfWeek(today);
  const week = picked ?? thisWeek;
  const current = week === thisWeek;
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const index = indexLogs(logs);
  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);

  function toggle(habit: Habit, day: string) {
    const log = index.get(logKey(habit.id, day));
    if (log) void habitLogs.remove(log.id);
    else habitLogs.insert({ habit_id: habit.id, done_on: day });
  }

  return (
    <>
      <div className="mb-5">
        <Button onClick={() => setEditor({})}>
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          Novo hábito
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <section className={`${panel} lg:col-span-2`} aria-labelledby="habitos-semana">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="habitos-semana" className="text-[19px] font-semibold">
                {current ? "Esta semana" : "Semana"}
              </h2>
              <p className="text-[14px] text-ink-2">
                {fmtDayMonth.format(fromISODate(week))} a {fmtDayMonth.format(fromISODate(days[6]))}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <IconButton label="Semana anterior" onClick={() => setPicked(addDays(week, -7))}>
                <ChevronLeft aria-hidden className="size-5" />
              </IconButton>
              <Button variant="soft" onClick={() => setPicked(null)} disabled={current} className="h-10 px-4">
                Esta semana
              </Button>
              <IconButton label="Próxima semana" onClick={() => setPicked(addDays(week, 7))} disabled={current}>
                <ChevronRight aria-hidden className="size-5" />
              </IconButton>
            </div>
          </div>

          {active.length === 0 ? (
            <p className="py-6 text-ink-2">
              {archived.length > 0
                ? "Nenhum hábito ativo. Crie um novo ou restaure um arquivado."
                : "Nenhum hábito ainda. Crie o primeiro para começar a marcar os dias."}
            </p>
          ) : (
            <ul>
              {active.map((habit) => {
                const count = weekCount(index, habit.id, week);
                const run = streak(index, habit.id, today);
                const met = count >= habit.weekly_target;
                return (
                  <li key={habit.id} className="border-t border-line py-4 first:border-t-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">{habit.name}</h3>
                        <p className="text-[13px] tabular-nums text-ink-2">
                          <span className={met ? "text-ok" : ""}>
                            {count} de {habit.weekly_target} {current ? "nesta semana" : "na semana"}
                          </span>
                          <span aria-hidden> · </span>
                          <span>
                            Sequência: {run} {run === 1 ? "dia" : "dias"}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Editar ${habit.name}`}
                        onClick={() => setEditor({ habit })}
                        className="press flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-field hover:text-ink"
                      >
                        <Pencil aria-hidden className="size-4" />
                      </button>
                    </div>

                    <div className="my-3 grid grid-cols-7 gap-1" role="group" aria-label={`Dias de ${habit.name}`}>
                      {days.map((day, i) => {
                        const done = index.has(logKey(habit.id, day));
                        const isToday = day === today;
                        return (
                          <div
                            key={day}
                            className={`mx-auto w-full max-w-12 rounded-full p-0.5 ${isToday ? "bg-ember-soft ring-1 ring-ember" : ""}`}
                          >
                            <button
                              type="button"
                              aria-pressed={done}
                              aria-label={`${habit.name}: ${fmtFull.format(fromISODate(day))}${isToday ? " (hoje)" : ""}`}
                              disabled={day > today}
                              onClick={() => toggle(habit, day)}
                              className={`press flex aspect-square w-full flex-col items-center justify-center rounded-full border leading-none disabled:cursor-not-allowed disabled:opacity-35 ${
                                done ? "border-transparent bg-ember text-on-ember" : "border-line bg-field text-ink-2 hover:border-ember"
                              }`}
                            >
                              <span aria-hidden className="text-[10px]">
                                {INITIALS[i]}
                              </span>
                              <span aria-hidden className="mt-0.5 text-[13px] font-semibold tabular-nums">
                                {fromISODate(day).getDate()}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <Bar
                      value={(count / habit.weekly_target) * 100}
                      done={met}
                      label={`${habit.name}: ${count} de ${habit.weekly_target} dias na semana`}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {archived.length > 0 && (
            <div className="mt-2 border-t border-line pt-3">
              <Button
                variant="quiet"
                className="-ml-3 h-10 px-3"
                aria-expanded={showArchived}
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? "Ocultar arquivados" : `Ver arquivados (${archived.length})`}
              </Button>
              {showArchived && (
                <ul className="mt-1">
                  {archived.map((habit) => (
                    <li key={habit.id} className="flex items-center justify-between gap-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => setEditor({ habit })}
                        aria-label={`Editar ${habit.name}`}
                        className="press min-w-0 flex-1 truncate rounded-item py-2 text-left text-ink-2 hover:text-ink"
                      >
                        {habit.name}
                      </button>
                      <Button
                        variant="soft"
                        className="h-9 px-4 text-[14px]"
                        onClick={() => void habitStore.update(habit.id, { archived: false })}
                      >
                        Restaurar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <Consistency today={today} habits={habits} logs={logs} index={index} />
      </div>

      <Sheet open={editor !== null} onClose={() => setEditor(null)} title={editor?.habit ? "Editar hábito" : "Novo hábito"}>
        {editor && <HabitEditor key={editor.habit?.id ?? "new"} habit={editor.habit} onClose={() => setEditor(null)} />}
      </Sheet>
    </>
  );
}

function Consistency({
  today,
  habits,
  logs,
  index,
}: {
  today: string;
  habits: Habit[];
  logs: HabitLog[];
  index: Map<string, HabitLog>;
}) {
  const thisWeek = startOfWeek(today);
  const weeks = [3, 2, 1, 0].map((back) => {
    const start = addDays(thisWeek, -7 * back);
    return { start, pct: weekCompletion(habits, index, start), current: back === 0 };
  });
  const now = weeks[3].pct;
  const known = new Set(habits.map((h) => h.id));
  const month = today.slice(0, 7);
  const checkins = logs.filter((l) => l.done_on.slice(0, 7) === month && known.has(l.habit_id)).length;

  return (
    <section className="glass min-w-0 rounded-panel p-5 sm:p-6" aria-labelledby="consistencia">
      <h2 id="consistencia" className="text-[19px] font-semibold">
        Consistência
      </h2>
      {now === null ? (
        <p className="mt-2 text-ink-2">Crie um hábito para acompanhar quanto das suas metas semanais você cumpre.</p>
      ) : (
        <p className="mt-2">
          <span className="block text-[44px] font-light leading-none tracking-tight tabular-nums">{now}%</span>
          <span className="mt-1 block text-[14px] text-ink-2">das metas desta semana cumpridas</span>
        </p>
      )}

      <h3 className="mt-6 text-[13px] font-medium text-ink-3">Últimas 4 semanas</h3>
      <ul className="mt-3 grid grid-cols-4 gap-3">
        {weeks.map((w) => (
          <li key={w.start} className="min-w-0 text-center">
            <span className="block text-[13px] tabular-nums text-ink-2">{w.pct === null ? "–" : `${w.pct}%`}</span>
            <span aria-hidden className="mx-auto mt-1 flex h-20 w-full max-w-10 items-end overflow-hidden rounded-item bg-field">
              <span
                className={`block w-full rounded-item transition-[height] duration-300 ${w.current ? "bg-ember" : "bg-ink-3"}`}
                style={{ height: `${w.pct ?? 0}%` }}
              />
            </span>
            <span className={`mt-1.5 block truncate text-[12px] ${w.current ? "font-medium text-ember" : "text-ink-3"}`}>
              {w.current ? "Atual" : fmtShort.format(fromISODate(w.start)).replace(".", "")}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 flex items-baseline justify-between gap-3 border-t border-line pt-4">
        <span className="min-w-0 text-[14px] text-ink-2">Check-ins em {fmtMonthYear.format(fromISODate(today))}</span>
        <span className="text-[22px] font-light tabular-nums">{checkins}</span>
      </p>
    </section>
  );
}
