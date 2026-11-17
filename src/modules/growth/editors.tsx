"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { showToast } from "@/lib/toast";
import {
  achievements,
  goals,
  habitLogs,
  habits,
  studySessions,
  type Achievement,
  type Goal,
  type Habit,
  type StudySession,
} from "./store";
import { EditorActions } from "./ui";

/* ───────── Hábito ───────── */
export function removeHabit(habit: Habit) {
  // O banco apaga os registros junto com o hábito; aqui guardamos para poder desfazer.
  const logs = habitLogs.get().items.filter((l) => l.habit_id === habit.id);
  void habits.remove(habit.id).then((ok) => {
    if (ok) logs.forEach((l) => void habitLogs.remove(l.id));
  });
  showToast({
    kind: "info",
    message: "Hábito excluído",
    action: {
      label: "Desfazer",
      run: () =>
        void habits.restore(habit).then((ok) => {
          if (ok) logs.forEach((l) => void habitLogs.restore(l));
        }),
    },
  });
}

export function HabitEditor({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const [name, setName] = useState(habit?.name ?? "");
  const [target, setTarget] = useState(String(habit?.weekly_target ?? 7));
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return setError("Dê um nome para o hábito.");
    if (value.length > 120) return setError("Use até 120 caracteres no nome.");
    const values = { name: value, weekly_target: Number(target) };
    if (habit) void habits.update(habit.id, values);
    else habits.insert({ ...values, archived: false });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={error} autoFocus />
      <Select label="Dias por semana" value={target} onChange={(e) => setTarget(e.target.value)}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <option key={n} value={n}>
            {n === 7 ? "Todos os dias" : n === 1 ? "1 dia" : `${n} dias`}
          </option>
        ))}
      </Select>
      <EditorActions
        submit="Salvar hábito"
        onRemove={
          habit &&
          (() => {
            removeHabit(habit);
            onClose();
          })
        }
        extra={
          habit && (
            <Button
              type="button"
              variant="quiet"
              className="px-4"
              onClick={() => {
                void habits.update(habit.id, { archived: !habit.archived });
                onClose();
              }}
            >
              {habit.archived ? "Restaurar" : "Arquivar"}
            </Button>
          )
        }
      />
    </form>
  );
}

/* ───────── Meta ───────── */
export function removeGoal(goal: Goal) {
  void goals.remove(goal.id);
  showToast({ kind: "info", message: "Meta excluída", action: { label: "Desfazer", run: () => void goals.restore(goal) } });
}

export function GoalEditor({ goal, areas, onClose }: { goal?: Goal; areas: string[]; onClose: () => void }) {
  const listId = useId();
  const rangeId = useId();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [area, setArea] = useState(goal?.area ?? "");
  const [target, setTarget] = useState(goal?.target_date ?? "");
  const [progress, setProgress] = useState(goal?.progress ?? 0);
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return setError("Dê um título para a meta.");
    if (value.length > 160) return setError("Use até 160 caracteres no título.");
    const values = {
      title: value,
      description: description.trim(),
      area: area.trim(),
      target_date: target || null,
      progress,
    };
    if (goal) void goals.update(goal.id, values);
    else goals.insert({ ...values, status: "active" });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={error} autoFocus />
      <TextArea label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Área"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          list={listId}
          maxLength={60}
          placeholder="Saúde, Carreira..."
          className="min-w-0"
        />
        <Field label="Data alvo" type="date" value={target} onChange={(e) => setTarget(e.target.value)} className="min-w-0" />
      </div>
      <datalist id={listId}>
        {areas.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor={rangeId} className="text-[13px] font-medium text-ink-2">
            Progresso
          </label>
          <output htmlFor={rangeId} className="text-[15px] font-semibold tabular-nums">
            {progress}%
          </output>
        </div>
        <input
          id={rangeId}
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="h-8 w-full accent-ember"
        />
      </div>
      <EditorActions
        submit="Salvar meta"
        onRemove={
          goal &&
          (() => {
            removeGoal(goal);
            onClose();
          })
        }
      />
    </form>
  );
}

/* ───────── Estudo ───────── */
export function StudyEditor({
  session,
  subjects,
  today,
  onClose,
}: {
  session?: StudySession;
  subjects: string[];
  today: string;
  onClose: () => void;
}) {
  const listId = useId();
  const [subject, setSubject] = useState(session?.subject ?? "");
  const [minutes, setMinutes] = useState(session ? String(session.minutes) : "");
  const [day, setDay] = useState(session?.studied_on.slice(0, 10) ?? today);
  const [notes, setNotes] = useState(session?.notes ?? "");
  const [errors, setErrors] = useState<{ subject?: string; minutes?: string; day?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = subject.trim();
    const amount = Number(minutes);
    const found: typeof errors = {};
    if (!name) found.subject = "Diga o que você estudou.";
    else if (name.length > 120) found.subject = "Use até 120 caracteres no assunto.";
    if (!minutes.trim() || !Number.isInteger(amount) || amount < 1 || amount > 1440)
      found.minutes = "Informe de 1 a 1440 minutos.";
    if (!day) found.day = "Escolha a data.";
    setErrors(found);
    if (Object.keys(found).length) return;
    const values = { subject: name, minutes: amount, studied_on: day, notes: notes.trim() };
    if (session) void studySessions.update(session.id, values);
    else studySessions.insert(values);
    onClose();
  }

  function remove() {
    if (!session) return;
    void studySessions.remove(session.id);
    showToast({
      kind: "info",
      message: "Estudo excluído",
      action: { label: "Desfazer", run: () => void studySessions.restore(session) },
    });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field
        label="Assunto"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        error={errors.subject}
        list={listId}
        autoFocus
      />
      <datalist id={listId}>
        {subjects.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Minutos"
          type="number"
          inputMode="numeric"
          min={1}
          max={1440}
          step={1}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          error={errors.minutes}
          className="min-w-0"
        />
        <Field
          label="Data"
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          error={errors.day}
          className="min-w-0"
        />
      </div>
      <TextArea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      <EditorActions submit="Salvar estudo" onRemove={session && remove} />
    </form>
  );
}

/* ───────── Conquista ───────── */
export function AchievementEditor({
  achievement,
  today,
  onClose,
}: {
  achievement?: Achievement;
  today: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(achievement?.title ?? "");
  const [day, setDay] = useState(achievement?.achieved_on.slice(0, 10) ?? today);
  const [notes, setNotes] = useState(achievement?.notes ?? "");
  const [errors, setErrors] = useState<{ title?: string; day?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    const found: typeof errors = {};
    if (!value) found.title = "Dê um título para a conquista.";
    else if (value.length > 160) found.title = "Use até 160 caracteres no título.";
    if (!day) found.day = "Escolha a data.";
    setErrors(found);
    if (Object.keys(found).length) return;
    const values = { title: value, achieved_on: day, notes: notes.trim() };
    if (achievement) void achievements.update(achievement.id, values);
    else achievements.insert(values);
    onClose();
  }

  function remove() {
    if (!achievement) return;
    void achievements.remove(achievement.id);
    showToast({
      kind: "info",
      message: "Conquista excluída",
      action: { label: "Desfazer", run: () => void achievements.restore(achievement) },
    });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} autoFocus />
      <Field label="Data" type="date" value={day} onChange={(e) => setDay(e.target.value)} error={errors.day} />
      <TextArea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      <EditorActions submit="Salvar conquista" onRemove={achievement && remove} />
    </form>
  );
}
