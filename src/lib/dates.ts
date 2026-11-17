"use client";

import { useSyncExternalStore } from "react";

export const pad = (n: number) => String(n).padStart(2, "0");

/** Data local no formato AAAA-MM-DD. */
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s: string, n: number) => {
  const d = fromISODate(s);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
export const addMonths = (s: string, n: number) => {
  const d = fromISODate(s);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return isoDate(d);
};
/** Domingo da semana da data. */
export const startOfWeek = (s: string) => addDays(s, -fromISODate(s).getDay());
export const timeOf = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** Valor para <input type="datetime-local"> a partir de um instante. */
export const toLocalInput = (iso: string) => `${isoDate(new Date(iso))}T${timeOf(iso)}`;

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", o);
export const fmtFull = fmt({ weekday: "long", day: "numeric", month: "long" });
export const fmtDayMonth = fmt({ day: "numeric", month: "long" });
export const fmtShort = fmt({ day: "numeric", month: "short" });
export const fmtWeekday = fmt({ weekday: "short" });
export const fmtMonthYear = fmt({ month: "long", year: "numeric" });

export function relativeDay(date: string, today: string) {
  if (date === today) return "Hoje";
  if (date === addDays(today, 1)) return "Amanhã";
  if (date === addDays(today, -1)) return "Ontem";
  const w = fmt({ weekday: "long" }).format(fromISODate(date));
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** Relógio que anda de minuto em minuto; null no servidor para o HTML inicial nunca divergir. */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, 1000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 60000),
    () => null,
  );
  return minute === null ? null : new Date(minute * 60000);
}
