"use client";

import { BillRow } from "./Bills";
import { monthLabel, monthShort, panel, panelTitle } from "./shared";
import { billsDueSoon, brl, expensesByCategory, inMonth, monthsEndingAt, totals, upToMonth, type Bill, type Transaction } from "./store";

const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

export function Overview({
  month,
  today,
  transactions,
  bills,
  onOpenBill,
}: {
  month: string;
  today: string;
  transactions: Transaction[];
  bills: Bill[];
  onOpenBill: (b: Bill) => void;
}) {
  const current = totals(inMonth(transactions, month));
  const accumulated = totals(upToMonth(transactions, month)).balance;
  const history = monthsEndingAt(month, 6).map((m) => ({ month: m, ...totals(inMonth(transactions, m)) }));
  const categories = expensesByCategory(inMonth(transactions, month));
  const due = billsDueSoon(bills, today);

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Entradas" value={current.income} />
        <Figure label="Despesas" value={current.expense} />
        <Figure label="Saldo do mês" value={current.balance} highlight />
        <Figure label="Saldo acumulado" value={accumulated} note={`Até o fim de ${monthLabel(month).toLowerCase()}`} />
      </dl>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <HistoryChart history={history} selected={month} />
        <CategoryChart rows={categories} />
      </div>

      <section className={panel} aria-labelledby="contas-proximas">
        <h2 id="contas-proximas" className={panelTitle}>
          Contas próximas
        </h2>
        <p className="mb-2 text-[14px] text-ink-2">Em aberto que vencem nos próximos 7 dias ou já venceram.</p>
        {due.length === 0 ? (
          <p className="py-3 text-ink-2">Nenhuma conta vencendo nos próximos 7 dias.</p>
        ) : (
          <ul>
            {due.map((b) => (
              <BillRow key={b.id} bill={b} today={today} onOpen={onOpenBill} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Figure({ label, value, highlight = false, note }: { label: string; value: number; highlight?: boolean; note?: string }) {
  return (
    <div className={`${highlight ? "glass" : "surface"} flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 rounded-item px-5 py-4 sm:block`}>
      <dt className="text-[14px] text-ink-2">{label}</dt>
      <dd className={`text-[22px] font-light tabular-nums tracking-tight sm:mt-1 sm:text-[24px] ${value < 0 ? "text-danger" : ""}`}>{brl.format(value)}</dd>
      {note && <dd className="w-full text-[13px] text-ink-3">{note}</dd>}
    </div>
  );
}

/* ───────── Entradas x despesas, 6 meses ───────── */
type MonthTotals = { month: string; income: number; expense: number };

function HistoryChart({ history, selected }: { history: MonthTotals[]; selected: string }) {
  const max = Math.max(0, ...history.flatMap((m) => [m.income, m.expense]));
  return (
    <section className={panel} aria-labelledby="grafico-meses">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="grafico-meses" className={panelTitle}>
          Entradas e despesas
        </h2>
        <ul className="flex gap-4 text-[13px] text-ink-2">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: "var(--ok)" }} />
            Entradas
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: "var(--ember)" }} />
            Despesas
          </li>
        </ul>
      </div>
      <p className="mb-4 text-[14px] text-ink-2">Últimos 6 meses até {monthLabel(selected).toLowerCase()}.</p>

      {max === 0 ? (
        <p className="py-6 text-ink-2">Nenhuma movimentação nestes 6 meses.</p>
      ) : (
        <>
          <p className="mb-1 text-[13px] tabular-nums text-ink-3">Topo da escala: {brl.format(max)}</p>
          <div className="flex h-44 items-end gap-2 border-b border-t border-line pt-1" role="group" aria-label="Gráfico de entradas e despesas por mês">
            {history.map((m) => {
              const name = monthLabel(m.month).toLowerCase();
              return (
                <div key={m.month} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1">
                  <Bar value={m.income} max={max} color="var(--ok)" label={`Entradas em ${name}: ${brl.format(m.income)}`} />
                  <Bar value={m.expense} max={max} color="var(--ember)" label={`Despesas em ${name}: ${brl.format(m.expense)}`} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2 text-center text-[13px]" aria-hidden>
            {history.map((m) => (
              <span key={m.month} className={`min-w-0 flex-1 truncate ${m.month === selected ? "font-semibold text-ink" : "text-ink-2"}`}>
                {monthShort(m.month)}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className="w-full max-w-6 rounded-t-md transition-[height] duration-300"
      style={{ height: `${max > 0 ? (value / max) * 100 : 0}%`, minHeight: value > 0 ? 3 : 0, background: color }}
    />
  );
}

/* ───────── Despesas por categoria ───────── */
function CategoryChart({ rows }: { rows: { category: string; value: number; share: number }[] }) {
  const max = rows[0]?.value ?? 0;
  return (
    <section className={panel} aria-labelledby="grafico-categorias">
      <h2 id="grafico-categorias" className={`${panelTitle} mb-4`}>
        Despesas por categoria
      </h2>
      {rows.length === 0 ? (
        <p className="py-6 text-ink-2">Nenhuma despesa registrada neste mês.</p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((r) => (
            <li key={r.category}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">{r.category}</span>
                <span className="shrink-0 tabular-nums">
                  {brl.format(r.value)} <span className="text-[13px] text-ink-2">({pct.format(r.share)})</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-field" aria-hidden>
                <div className="h-full rounded-full bg-ember transition-[width] duration-300" style={{ width: `${max > 0 ? Math.max(2, (r.value / max) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
