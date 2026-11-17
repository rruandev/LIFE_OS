"use client";

import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import {
  addDays,
  addMonths,
  fmtDayMonth,
  fmtFull,
  fmtMonthYear,
  fmtWeekday,
  fromISODate,
  isoDate,
  relativeDay,
  startOfWeek,
  timeOf,
  useNow,
} from "@/lib/dates";
import { clearOpenRequest, peekOpenRequest } from "@/lib/ui";
import { EventEditor, TaskEditor } from "./editors";
import { Check_, EventRow, TaskRow } from "./items";
import {
  byPriority,
  conflicts,
  events as eventStore,
  eventsOn,
  overdue,
  tasks as taskStore,
  tasksOn,
  taskTime,
  type CalEvent,
  type Task,
} from "./store";

type View = "day" | "week" | "month";
type Editor = { kind: "task"; task?: Task } | { kind: "event"; event?: CalEvent } | null;
type Open = { task: (t: Task) => void; event: (e: CalEvent) => void };

const panel = "surface min-w-0 rounded-panel p-5 sm:p-6";
const heading = "text-[13px] font-medium text-ink-3";

export function MyDay() {
  const now = useNow();
  const today = now ? isoDate(now) : null;
  const [view, setView] = useState<View>("day");
  const [picked, setPicked] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  // Vindo da busca ou de um aviso: abre direto no item pedido.
  const [editor, setEditor] = useState<Editor>(() => {
    const taskId = peekOpenRequest("task");
    const task = taskId ? taskStore.get().items.find((t) => t.id === taskId) : undefined;
    if (task) return { kind: "task", task };
    const eventId = peekOpenRequest("event");
    const event = eventId ? eventStore.get().items.find((e) => e.id === eventId) : undefined;
    return event ? { kind: "event", event } : null;
  });
  useEffect(() => {
    clearOpenRequest("task");
    clearOpenRequest("event");
  }, []);
  const taskState = taskStore.use();
  const eventState = eventStore.use();

  if (!today) return <Skeleton />;
  const date = picked ?? today;

  const move = (step: number) => {
    setDirection(step);
    setPicked(view === "day" ? addDays(date, step) : view === "week" ? addDays(date, 7 * step) : addMonths(date, step));
  };
  const goTo = (d: string) => {
    setDirection(d > date ? 1 : -1);
    setPicked(d);
    setView("day");
  };

  const weekStart = startOfWeek(date);
  const title =
    view === "day"
      ? relativeDay(date, today)
      : view === "week"
        ? `${fmtDayMonth.format(fromISODate(weekStart))} a ${fmtDayMonth.format(fromISODate(addDays(weekStart, 6)))}`
        : capitalize(fmtMonthYear.format(fromISODate(date)));
  const loading = taskState.status === "loading" || taskState.status === "idle" || eventState.status === "loading" || eventState.status === "idle";
  const failure = taskState.error ?? eventState.error;
  const open: Open = { task: (task) => setEditor({ kind: "task", task }), event: (event) => setEditor({ kind: "event", event }) };

  return (
    <div className="mx-auto max-w-5xl">
      <PreviewBanner />

      <header className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-ink-2 first-letter:uppercase">{view === "day" ? fmtFull.format(fromISODate(date)) : "My Day"}</p>
          <h1 className="text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<View>
            label="Visão"
            value={view}
            onChange={(v) => {
              setDirection(0);
              setView(v);
            }}
            options={[
              { value: "day", label: "Dia" },
              { value: "week", label: "Semana" },
              { value: "month", label: "Mês" },
            ]}
          />
          <div className="flex items-center gap-1">
            <IconButton label="Anterior" onClick={() => move(-1)}>
              <ChevronLeft aria-hidden className="size-5" />
            </IconButton>
            <Button variant="soft" onClick={() => { setDirection(today > date ? 1 : -1); setPicked(null); }} disabled={date === today} className="h-10 px-4">
              Hoje
            </Button>
            <IconButton label="Próximo" onClick={() => move(1)}>
              <ChevronRight aria-hidden className="size-5" />
            </IconButton>
          </div>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        <Button onClick={() => setEditor({ kind: "task" })}>
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          Nova tarefa
        </Button>
        <Button variant="soft" onClick={() => setEditor({ kind: "event" })}>
          <CalendarPlus aria-hidden className="size-4" />
          Novo compromisso
        </Button>
      </div>

      {failure ? (
        <div className="space-y-3">
          <Notice kind="error">{failure}</Notice>
          <Button variant="soft" onClick={() => { void taskStore.load(true); void eventStore.load(true); }}>
            Tentar de novo
          </Button>
        </div>
      ) : loading ? (
        <div className="grid gap-5 lg:grid-cols-2" aria-busy="true" aria-label="Carregando">
          <div className={`${panel} h-64 animate-pulse`} />
          <div className={`${panel} h-64 animate-pulse`} />
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={`${view}-${view === "day" ? date : view === "week" ? weekStart : date.slice(0, 7)}`}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -48 }}
            transition={{ type: "spring", stiffness: 300, damping: 32, opacity: { duration: 0.18 } }}
          >
            {view === "day" && <DayView date={date} today={today} tasks={taskState.items} events={eventState.items} open={open} />}
            {view === "week" && <WeekView start={weekStart} today={today} tasks={taskState.items} events={eventState.items} open={open} goTo={goTo} />}
            {view === "month" && <MonthView date={date} today={today} tasks={taskState.items} events={eventState.items} goTo={goTo} />}
          </motion.div>
        </AnimatePresence>
      )}

      <Sheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.kind === "event" ? (editor.event ? "Editar compromisso" : "Novo compromisso") : editor?.task ? "Editar tarefa" : "Nova tarefa"}
      >
        {editor?.kind === "task" && <TaskEditor task={editor.task} date={date} onClose={() => setEditor(null)} />}
        {editor?.kind === "event" && <EventEditor event={editor.event} date={date} onClose={() => setEditor(null)} />}
      </Sheet>
    </div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="press flex size-10 items-center justify-center rounded-full border border-line bg-field text-ink hover:bg-ember-soft"
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true" aria-label="Carregando">
      <div className="h-12 w-56 animate-pulse rounded-full bg-field" />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className={`${panel} h-64 animate-pulse`} />
        <div className={`${panel} h-64 animate-pulse`} />
      </div>
    </div>
  );
}

type ViewProps = { today: string; tasks: Task[]; events: CalEvent[] };

/* ───────── Dia ───────── */
function DayView({ date, today, tasks, events, open }: ViewProps & { date: string; open: Open }) {
  const [quick, setQuick] = useState("");
  const dayEvents = eventsOn(events, date);
  const clash = conflicts(dayEvents);
  const dayTasks = tasksOn(tasks, date);
  const timed = dayTasks.filter((t) => t.due_time && !t.completed_at).sort((a, b) => a.due_time!.localeCompare(b.due_time!));
  const untimed = dayTasks.filter((t) => !t.due_time && !t.completed_at).sort(byPriority);
  const done = dayTasks.filter((t) => t.completed_at);
  const late = date === today ? overdue(tasks, today) : [];
  const someday = date === today ? tasks.filter((t) => !t.due_date && !t.completed_at).sort(byPriority) : [];
  const total = dayTasks.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;

  function add(e: FormEvent) {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    taskStore.insert({
      title: title.slice(0, 200),
      notes: "",
      priority: "medium",
      due_date: date,
      due_time: null,
      remind_at: null,
      reminded_at: null,
      completed_at: null,
    });
    setQuick("");
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <section className={panel} aria-labelledby="agenda">
        <h2 id="agenda" className="mb-3 text-[19px] font-semibold">
          Agenda
        </h2>
        {dayEvents.length + timed.length === 0 ? (
          <p className="py-6 text-ink-2">Nenhum compromisso ou tarefa com horário neste dia.</p>
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {dayEvents.map((e) => (
                <EventRow key={e.id} event={e} conflict={clash.has(e.id)} onOpen={open.event} />
              ))}
              {timed.map((t) => (
                <TaskRow key={t.id} task={t} onOpen={open.task} today={today} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <section className={panel} aria-labelledby="tarefas">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="tarefas" className="text-[19px] font-semibold">
            Tarefas
          </h2>
          {total > 0 && (
            <span className="text-[14px] text-ink-2">
              {done.length} de {total} concluídas
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-field" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do dia">
            <motion.div className="h-full rounded-full bg-ember" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }} />
          </div>
        )}

        <form onSubmit={add} className="mb-3 flex gap-2">
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            aria-label="Adicionar tarefa rápida"
            placeholder={`Adicionar tarefa para ${relativeDay(date, today).toLowerCase()}`}
            maxLength={200}
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-field px-4 text-[15px] placeholder:text-ink-3 focus:border-ember focus:outline-none"
          />
          <Button type="submit" disabled={!quick.trim()} className="px-4">
            Adicionar
          </Button>
        </form>

        {late.length > 0 && (
          <>
            <h3 className={`${heading} mt-4 text-danger`}>Atrasadas ({late.length})</h3>
            <ul>
              <AnimatePresence initial={false}>
                {late.map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={open.task} today={today} />
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}

        {untimed.length === 0 && done.length === 0 && late.length === 0 && someday.length === 0 && (
          <p className="py-4 text-ink-2">Nenhuma tarefa aqui ainda. Escreva a primeira no campo acima.</p>
        )}
        <ul>
          <AnimatePresence initial={false}>
            {untimed.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={open.task} today={today} />
            ))}
          </AnimatePresence>
        </ul>

        {someday.length > 0 && (
          <>
            <h3 className={`${heading} mt-4`}>Sem data ({someday.length})</h3>
            <ul>
              <AnimatePresence initial={false}>
                {someday.map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={open.task} today={today} />
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}

        {done.length > 0 && (
          <>
            <h3 className={`${heading} mt-4`}>Concluídas</h3>
            <ul>
              <AnimatePresence initial={false}>
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={open.task} today={today} />
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

/* ───────── Semana ───────── */
function WeekView({ start, today, tasks, events, open, goTo }: ViewProps & { start: string; open: Open; goTo: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-7">
      {days.map((d) => {
        const ev = eventsOn(events, d);
        const tk = tasksOn(tasks, d).sort((a, b) => Number(Boolean(a.completed_at)) - Number(Boolean(b.completed_at)) || byPriority(a, b));
        const isToday = d === today;
        return (
          <section key={d} className={`surface min-w-0 rounded-item p-3 lg:min-h-64 ${isToday ? "border-ember" : ""}`}>
            <button type="button" onClick={() => goTo(d)} className="press mb-2 flex w-full items-baseline gap-2 rounded-full text-left lg:flex-col lg:gap-0" aria-label={`Abrir ${fmtFull.format(fromISODate(d))}`}>
              <span className="text-[13px] capitalize text-ink-2">{fmtWeekday.format(fromISODate(d)).replace(".", "")}</span>
              <span className={`text-[22px] font-light leading-none tabular-nums ${isToday ? "text-ember" : ""}`}>{fromISODate(d).getDate()}</span>
            </button>
            {ev.length + tk.length === 0 ? (
              <p className="text-[13px] text-ink-3">Livre</p>
            ) : (
              <ul className="space-y-1.5 text-[13px]">
                {ev.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => open.event(e)} className="press w-full rounded-lg bg-ember-soft px-2 py-1.5 text-left">
                      <span className="block tabular-nums text-ink-2">{e.all_day ? "Dia todo" : timeOf(e.starts_at)}</span>
                      <span className="block truncate font-medium">{e.title}</span>
                    </button>
                  </li>
                ))}
                {tk.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <Check_ task={t} small />
                    <button type="button" onClick={() => open.task(t)} className={`press min-w-0 flex-1 truncate py-1 text-left ${t.completed_at ? "text-ink-3 line-through" : ""}`}>
                      {taskTime(t) && <span className="mr-1 tabular-nums text-ink-2">{taskTime(t)}</span>}
                      {t.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ───────── Mês ───────── */
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function MonthView({ date, today, tasks, events, goTo }: ViewProps & { date: string; goTo: (d: string) => void }) {
  const month = date.slice(0, 7);
  const first = startOfWeek(`${month}-01`);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const weeks = cells[35].slice(0, 7) === month ? 6 : 5;
  return (
    <section className="surface rounded-panel p-3 sm:p-4">
      <div className="grid grid-cols-7 pb-2 text-center text-[13px] text-ink-3">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.slice(0, weeks * 7).map((d) => {
          const ev = eventsOn(events, d);
          const tk = tasksOn(tasks, d).filter((t) => !t.completed_at);
          const inMonth = d.slice(0, 7) === month;
          const isToday = d === today;
          const count = ev.length + tk.length;
          return (
            <button
              key={d}
              type="button"
              onClick={() => goTo(d)}
              aria-label={`${fmtFull.format(fromISODate(d))}: ${ev.length} compromissos, ${tk.length} tarefas pendentes`}
              className={`press flex min-h-16 flex-col rounded-item p-1.5 text-left hover:bg-field sm:min-h-24 sm:p-2 ${inMonth ? "" : "opacity-40"}`}
            >
              <span className={`flex size-7 items-center justify-center rounded-full text-[14px] tabular-nums ${isToday ? "bg-ember font-semibold text-on-ember" : ""}`}>
                {fromISODate(d).getDate()}
              </span>
              <span className="mt-1 hidden min-w-0 flex-col gap-0.5 text-[12px] sm:flex">
                {ev.slice(0, 2).map((e) => (
                  <span key={e.id} className="truncate rounded bg-ember-soft px-1.5 py-0.5">{e.title}</span>
                ))}
                {tk.slice(0, Math.max(0, 2 - ev.length)).map((t) => (
                  <span key={t.id} className="truncate text-ink-2">{t.title}</span>
                ))}
                {count > 2 && <span className="text-ink-3">mais {count - 2}</span>}
              </span>
              {count > 0 && (
                <span className="mt-1 flex gap-1 sm:hidden" aria-hidden>
                  {ev.length > 0 && <span className="size-1.5 rounded-full bg-ember" />}
                  {tk.length > 0 && <span className="size-1.5 rounded-full bg-ink-2" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
