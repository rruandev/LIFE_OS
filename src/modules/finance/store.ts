"use client";

import { createCollection } from "@/lib/data/collection";

export type Transaction = {
  id: string;
  kind: "income" | "expense";
  /** Valor em reais, sempre positivo; o tipo diz se entra ou sai. */
  amount: number;
  description: string;
  category: string;
  occurred_on: string;
  notes: string;
  created_at: string;
};
export type FinancialGoal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  due_date: string | null;
  created_at: string;
};
export type Bill = {
  id: string;
  name: string;
  amount: number | null;
  due_date: string;
  repeat_monthly: boolean;
  paid_at: string | null;
  created_at: string;
};

export const transactions = createCollection<Transaction>("transactions", "suas movimentações");
export const financialGoals = createCollection<FinancialGoal>("financial_goals", "suas metas financeiras");
export const bills = createCollection<Bill>("bills", "suas contas");

export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** O banco pode devolver numeric como texto; normaliza para número. */
export const num = (v: number | string | null | undefined) => Number(v ?? 0);

export function totals(list: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.kind === "income") income += num(t.amount);
    else expense += num(t.amount);
  }
  return { income, expense, balance: income - expense };
}

export const inMonth = (list: Transaction[], month: string) => list.filter((t) => t.occurred_on.slice(0, 7) === month);

/* ───────── Ajudantes puros ───────── */

/** Mês (AAAA-MM) de uma data AAAA-MM-DD. */
export const monthOf = (date: string) => date.slice(0, 7);

/** Soma `n` meses a um mês AAAA-MM. */
export function shiftMonth(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const index = y * 12 + (m - 1) + n;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Os `count` meses que terminam em `month`, do mais antigo ao mais recente. */
export const monthsEndingAt = (month: string, count: number) =>
  Array.from({ length: count }, (_, i) => shiftMonth(month, i - (count - 1)));

/** Movimentações até o fim do mês informado. */
export const upToMonth = (list: Transaction[], month: string) => list.filter((t) => monthOf(t.occurred_on) <= month);

/** Mesma data no mês seguinte; se o dia não existir (31 → fevereiro), usa o último dia do mês. */
export function nextMonthSameDay(date: string) {
  const next = shiftMonth(monthOf(date), 1);
  const [y, m] = next.split("-").map(Number);
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const last = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  const day = Math.min(Number(date.slice(8, 10)), last);
  return `${next}-${String(day).padStart(2, "0")}`;
}

/** Dias entre duas datas AAAA-MM-DD (positivo quando `to` é depois de `from`). */
export function daysBetween(from: string, to: string) {
  const utc = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86400000);
}

/**
 * Lê um valor digitado: aceita "1.234,56", "1234,56", "1234.56" e "R$ 10".
 * Sem vírgula, ponto seguido de exatamente três dígitos conta como milhar ("1.500" = 1500).
 * Devolve null quando o texto não é um número.
 */
export function parseAmount(text: string): number | null {
  let s = text.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const value = Math.round(Number(s) * 100) / 100;
  return Number.isFinite(value) ? value : null;
}

/** Valor para preencher o campo de edição ("1234,50"). */
export const amountInput = (v: number | string | null | undefined) =>
  v === null || v === undefined ? "" : num(v).toFixed(2).replace(".", ",");

export const categoryLabel = (category: string) => category.trim() || "Sem categoria";

/** Categorias já usadas, em ordem alfabética, sem repetir. */
export function categoriesOf(list: Transaction[]) {
  const seen = new Map<string, string>();
  for (const t of list) {
    const c = t.category.trim();
    if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Despesas somadas por categoria, da maior para a menor, com a fatia de cada uma. */
export function expensesByCategory(list: Transaction[]) {
  const sums = new Map<string, number>();
  let total = 0;
  for (const t of list) {
    if (t.kind !== "expense") continue;
    const key = categoryLabel(t.category);
    const value = num(t.amount);
    sums.set(key, (sums.get(key) ?? 0) + value);
    total += value;
  }
  return [...sums.entries()]
    .map(([category, value]) => ({ category, value, share: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

/** Mais recentes primeiro: pela data e, no mesmo dia, pela ordem de criação. */
export const newestFirst = (a: Transaction, b: Transaction) =>
  b.occurred_on.localeCompare(a.occurred_on) || b.created_at.localeCompare(a.created_at);

export const isOverdue = (bill: Bill, today: string) => !bill.paid_at && bill.due_date < today;

/** Contas em aberto que vencem em até `days` dias ou já venceram, da mais antiga para a mais nova. */
export const billsDueSoon = (list: Bill[], today: string, days = 7) =>
  list
    .filter((b) => !b.paid_at && daysBetween(today, b.due_date) <= days)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

/** Fração guardada de uma meta (0 a 1, sem passar de 1). */
export function goalProgress(goal: FinancialGoal) {
  const target = num(goal.target_amount);
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, num(goal.saved_amount) / target));
}
