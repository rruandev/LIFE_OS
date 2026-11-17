"use client";

import type { ReactNode } from "react";
import { fromISODate } from "@/lib/dates";
import { showToast } from "@/lib/toast";
import { bills, daysBetween, nextMonthSameDay, num, type Bill } from "./store";

export const panel = "surface min-w-0 rounded-panel p-5 sm:p-6";
export const panelTitle = "text-[19px] font-semibold";
export const subheading = "text-[13px] font-medium text-ink-3";

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", o);
export const fmtDate = fmt({ day: "numeric", month: "short", year: "numeric" });
export const fmtMonthShort = fmt({ month: "short" });
export const fmtDayFull = fmt({ weekday: "long", day: "numeric", month: "long" });

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const monthLabel = (month: string) => capitalize(fmt({ month: "long", year: "numeric" }).format(fromISODate(`${month}-01`)));
export const monthShort = (month: string) => fmtMonthShort.format(fromISODate(`${month}-01`)).replace(".", "");

/** "vence hoje", "vence em 3 dias", "venceu há 2 dias". */
export function dueLabel(due: string, today: string) {
  const days = daysBetween(today, due);
  if (days === 0) return "vence hoje";
  if (days === 1) return "vence amanhã";
  if (days === -1) return "venceu ontem";
  return days > 0 ? `vence em ${days} dias` : `venceu há ${-days} dias`;
}

/** Marca a conta como paga agora; se ela repete todo mês, cria a do mês seguinte. */
export function payBill(bill: Bill) {
  void bills.update(bill.id, { paid_at: new Date().toISOString() });
  if (!bill.repeat_monthly) return;
  const due = nextMonthSameDay(bill.due_date);
  // Pagar, desfazer e pagar de novo não pode criar a próxima conta duas vezes.
  const exists = bills.get().items.some((b) => b.id !== bill.id && b.name === bill.name && b.due_date === due);
  if (exists) return;
  bills.insert({
    name: bill.name,
    amount: bill.amount === null ? null : num(bill.amount),
    due_date: due,
    repeat_monthly: true,
    paid_at: null,
  });
  showToast({ kind: "info", message: `Próxima conta criada para ${fmtDate.format(fromISODate(due))}` });
}

export const unpayBill = (bill: Bill) => void bills.update(bill.id, { paid_at: null });

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="press flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-field text-ink hover:bg-ember-soft"
    >
      {children}
    </button>
  );
}

/** Botão pequeno para ações dentro de listas. */
export function RowAction({ onClick, children, quiet = false }: { onClick: () => void; children: ReactNode; quiet?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[14px] ${
        quiet ? "text-ink-2 hover:bg-field hover:text-ink" : "border border-line bg-field text-ink hover:bg-ember-soft"
      }`}
    >
      {children}
    </button>
  );
}
