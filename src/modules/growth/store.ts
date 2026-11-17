"use client";

import { createCollection } from "@/lib/data/collection";
import { addDays, isoDate } from "@/lib/dates";

export type Goal = {
  id: string;
  title: string;
  description: string;
  area: string;
  target_date: string | null;
  /** 0 a 100. */
  progress: number;
  status: "active" | "done";
  created_at: string;
};
export type Habit = {
  id: string;
  name: string;
  /** Quantos dias por semana (1 a 7). */
  weekly_target: number;
  archived: boolean;
  created_at: string;
};
export type HabitLog = { id: string; habit_id: string; done_on: string; created_at: string };
export type StudySession = {
  id: string;
  subject: string;
  minutes: number;
  studied_on: string;
  notes: string;
  created_at: string;
};
export type Achievement = { id: string; title: string; achieved_on: string; notes: string; created_at: string };

export const goals = createCollection<Goal>("goals", "suas metas");
export const habits = createCollection<Habit>("habits", "seus hábitos");
export const habitLogs = createCollection<HabitLog>("habit_logs", "o registro de hábitos");
export const studySessions = createCollection<StudySession>("study_sessions", "seus estudos");
export const achievements = createCollection<Achievement>("achievements", "suas conquistas");

/* ───────── Cálculos (funções puras) ───────── */

const dayOf = (iso: string) => isoDate(new Date(iso));
const shift = addDays;

export const logKey = (habitId: string, day: string) => `${habitId}|${day}`;

/** Registros indexados por hábito e dia, para consultar sem percorrer a lista. */
export function indexLogs(logs: HabitLog[]) {
  const index = new Map<string, HabitLog>();
  for (const log of logs) index.set(logKey(log.habit_id, log.done_on.slice(0, 10)), log);
  return index;
}

/** Dias feitos na semana que começa em `weekStart` (domingo). */
export function weekCount(index: Map<string, HabitLog>, habitId: string, weekStart: string) {
  let count = 0;
  for (let i = 0; i < 7; i++) if (index.has(logKey(habitId, shift(weekStart, i)))) count++;
  return count;
}

/** Dias seguidos terminando hoje ou ontem. */
export function streak(index: Map<string, HabitLog>, habitId: string, today: string) {
  let day = index.has(logKey(habitId, today)) ? today : shift(today, -1);
  let count = 0;
  while (index.has(logKey(habitId, day))) {
    count++;
    day = shift(day, -1);
  }
  return count;
}

/**
 * Quanto das metas semanais foi cumprido (0 a 100) entre os hábitos ativos que
 * já existiam naquela semana; null se não havia nenhum.
 */
export function weekCompletion(list: Habit[], index: Map<string, HabitLog>, weekStart: string) {
  const weekEnd = shift(weekStart, 6);
  let target = 0;
  let met = 0;
  for (const habit of list) {
    if (habit.archived || dayOf(habit.created_at) > weekEnd) continue;
    target += habit.weekly_target;
    met += Math.min(weekCount(index, habit.id, weekStart), habit.weekly_target);
  }
  return target ? Math.round((met / target) * 100) : null;
}

/** 200 → "3h 20min". */
export function fmtMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export const sumMinutes = (sessions: StudySession[]) => sessions.reduce((sum, s) => sum + s.minutes, 0);

/** Tempo por assunto, do maior para o menor. */
export function minutesBySubject(sessions: StudySession[]) {
  const totals = new Map<string, number>();
  for (const s of sessions) totals.set(s.subject, (totals.get(s.subject) ?? 0) + s.minutes);
  return [...totals].map(([subject, minutes]) => ({ subject, minutes })).sort((a, b) => b.minutes - a.minutes);
}

/** Valores distintos e não vazios, em ordem alfabética (para sugestões). */
export const distinct = (values: string[]) =>
  [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
