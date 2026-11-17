"use client";

import { Bell, Check, MapPin, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { fmtShort, fromISODate, timeOf } from "@/lib/dates";
import { taskTime, toggleTask, type CalEvent, type Task } from "./store";

const ring = { high: "border-ember", medium: "border-ink-2", low: "border-ink-3" };

export function Check_({ task, small = false }: { task: Task; small?: boolean }) {
  const done = Boolean(task.completed_at);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Reabrir: ${task.title}` : `Concluir: ${task.title}`}
      onClick={(e) => {
        e.stopPropagation();
        void toggleTask(task);
      }}
      className={`press flex shrink-0 items-center justify-center rounded-full border-2 ${
        small ? "size-[18px]" : "size-6"
      } ${done ? "border-ember bg-ember text-on-ember" : ring[task.priority]}`}
    >
      {done && <Check aria-hidden className={small ? "size-3" : "size-4"} strokeWidth={3} />}
    </button>
  );
}

export function TaskRow({ task, onOpen, today }: { task: Task; onOpen: (t: Task) => void; today: string }) {
  const done = Boolean(task.completed_at);
  const late = !done && task.due_date !== null && task.due_date < today;
  const time = taskTime(task);
  return (
    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
      <Check_ task={task} />
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="press min-w-0 flex-1 rounded-item px-2 py-2.5 text-left hover:bg-field"
      >
        <span className={`block truncate ${done ? "text-ink-3 line-through" : ""}`}>{task.title}</span>
        {(time || late || task.remind_at || task.priority === "high") && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-2">
            {late && <span className="text-danger">Atrasada desde {fmtShort.format(fromISODate(task.due_date!))}</span>}
            {time && <span className="tabular-nums">{time}</span>}
            {task.priority === "high" && !done && <span className="text-ember">Prioridade alta</span>}
            {task.remind_at && !task.reminded_at && <Bell aria-label="Com lembrete" className="size-3.5" />}
          </span>
        )}
      </button>
    </motion.li>
  );
}

export function EventRow({
  event,
  conflict,
  onOpen,
}: {
  event: CalEvent;
  conflict: boolean;
  onOpen: (e: CalEvent) => void;
}) {
  return (
    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button
        type="button"
        onClick={() => onOpen(event)}
        className="press flex w-full items-stretch gap-3 rounded-item px-2 py-2.5 text-left hover:bg-field"
      >
        <span className="w-[52px] shrink-0 text-[13px] leading-5 tabular-nums text-ink-2">
          {event.all_day ? (
            "Dia todo"
          ) : (
            <>
              <span className="block font-medium text-ink">{timeOf(event.starts_at)}</span>
              {timeOf(event.ends_at)}
            </>
          )}
        </span>
        <span aria-hidden className="w-1 shrink-0 rounded-full bg-ember" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{event.title}</span>
          <span className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-2">
            {event.location && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            {conflict && (
              <span className="flex items-center gap-1 text-danger">
                <TriangleAlert aria-hidden className="size-3.5" />
                Conflito de horário
              </span>
            )}
          </span>
        </span>
      </button>
    </motion.li>
  );
}
