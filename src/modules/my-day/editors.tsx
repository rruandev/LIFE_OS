"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { addDays, fromISODate, isoDate, timeOf, toLocalInput } from "@/lib/dates";
import { showToast } from "@/lib/toast";
import { events, tasks, type CalEvent, type Priority, type Task } from "./store";

export function TaskEditor({ task, date, onClose }: { task?: Task; date: string; onClose: () => void }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task ? (task.due_date ?? "") : date);
  const [dueTime, setDueTime] = useState(task?.due_time?.slice(0, 5) ?? "");
  const [remind, setRemind] = useState(task?.remind_at ? toLocalInput(task.remind_at) : "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) return setError("Dê um título para a tarefa.");
    if (name.length > 200) return setError("Use até 200 caracteres no título.");
    const remind_at = remind ? new Date(remind).toISOString() : null;
    const values = {
      title: name,
      notes: notes.trim(),
      priority,
      due_date: dueDate || null,
      due_time: dueDate && dueTime ? dueTime : null,
      remind_at,
      // Lembrete novo ou alterado volta a valer.
      reminded_at: task && task.remind_at === remind_at ? task.reminded_at : null,
    };
    if (task) void tasks.update(task.id, values);
    else tasks.insert({ ...values, completed_at: null });
    onClose();
  }

  function remove() {
    if (!task) return;
    void tasks.remove(task.id);
    showToast({ kind: "info", message: "Tarefa excluída", action: { label: "Desfazer", run: () => void tasks.restore(task) } });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={error} autoFocus />
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-ink-2">Prioridade</p>
        <Segmented<Priority>
          label="Prioridade"
          value={priority}
          onChange={setPriority}
          options={[
            { value: "high", label: "Alta" },
            { value: "medium", label: "Média" },
            { value: "low", label: "Baixa" },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <Field label="Horário" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} disabled={!dueDate} />
      </div>
      <Field
        label="Lembrete"
        type="datetime-local"
        value={remind}
        onChange={(e) => setRemind(e.target.value)}
        hint="Avisa na tela enquanto o Life OS estiver aberto."
      />
      <TextArea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
      <div className="flex items-center justify-between gap-3 pt-2">
        {task ? (
          <Button type="button" variant="quiet" onClick={remove} className="text-danger">
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">Salvar tarefa</Button>
      </div>
    </form>
  );
}

const REMIND = [
  { value: "", label: "Sem lembrete" },
  { value: "0", label: "Na hora" },
  { value: "10", label: "10 minutos antes" },
  { value: "30", label: "30 minutos antes" },
  { value: "60", label: "1 hora antes" },
  { value: "1440", label: "1 dia antes" },
];

export function EventEditor({ event, date, onClose }: { event?: CalEvent; date: string; onClose: () => void }) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [day, setDay] = useState(event ? isoDate(new Date(event.starts_at)) : date);
  const [start, setStart] = useState(event && !event.all_day ? timeOf(event.starts_at) : "09:00");
  const [end, setEnd] = useState(event && !event.all_day ? timeOf(event.ends_at) : "10:00");
  const [location, setLocation] = useState(event?.location ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [remind, setRemind] = useState(() => {
    if (!event?.remind_at) return "";
    const minutes = Math.round((new Date(event.starts_at).getTime() - new Date(event.remind_at).getTime()) / 60000);
    return REMIND.some((o) => o.value === String(minutes)) ? String(minutes) : "0";
  });
  const [errors, setErrors] = useState<{ title?: string; end?: string; day?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = title.trim();
    const found: typeof errors = {};
    if (!name) found.title = "Dê um título para o compromisso.";
    else if (name.length > 200) found.title = "Use até 200 caracteres no título.";
    if (!day) found.day = "Escolha o dia.";
    if (!allDay && (!start || !end || end <= start)) found.end = "O fim precisa ser depois do início.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const base = fromISODate(day);
    const at = (hhmm: string) => {
      const [h, m] = hhmm.split(":").map(Number);
      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    };
    const starts = allDay ? base : at(start);
    const ends = allDay ? fromISODate(addDays(day, 1)) : at(end);
    const remind_at = remind === "" ? null : new Date(starts.getTime() - Number(remind) * 60000).toISOString();
    const values = {
      title: name,
      notes: notes.trim(),
      location: location.trim(),
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      all_day: allDay,
      remind_at,
      reminded_at: event && event.remind_at === remind_at ? event.reminded_at : null,
    };
    if (event) void events.update(event.id, values);
    else events.insert(values);
    onClose();
  }

  function remove() {
    if (!event) return;
    void events.remove(event.id);
    showToast({
      kind: "info",
      message: "Compromisso excluído",
      action: { label: "Desfazer", run: () => void events.restore(event) },
    });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} autoFocus />
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium">Dia inteiro</span>
        <Switch label="Dia inteiro" checked={allDay} onChange={setAllDay} />
      </div>
      <Field label="Dia" type="date" value={day} onChange={(e) => setDay(e.target.value)} error={errors.day} />
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <Field label="Fim" type="time" value={end} onChange={(e) => setEnd(e.target.value)} error={errors.end} />
        </div>
      )}
      <Field label="Local" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />
      <Select label="Lembrete" value={remind} onChange={(e) => setRemind(e.target.value)}>
        {REMIND.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <TextArea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
      <div className="flex items-center justify-between gap-3 pt-2">
        {event ? (
          <Button type="button" variant="quiet" onClick={remove} className="text-danger">
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">Salvar compromisso</Button>
      </div>
    </form>
  );
}
