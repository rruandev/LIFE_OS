"use client";

import { Repeat } from "lucide-react";
import { fromISODate } from "@/lib/dates";
import { dueLabel, fmtDate, monthLabel, panel, panelTitle, payBill, RowAction, subheading, unpayBill } from "./shared";
import { brl, isOverdue, monthOf, num, type Bill } from "./store";

export function BillRow({ bill, today, onOpen }: { bill: Bill; today: string; onOpen: (b: Bill) => void }) {
  const paid = Boolean(bill.paid_at);
  const late = isOverdue(bill, today);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={() => onOpen(bill)}
        aria-label={`Editar conta: ${bill.name}`}
        className="press min-w-0 flex-1 basis-40 rounded-item px-2 py-2.5 text-left hover:bg-field"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className={`min-w-0 truncate ${paid ? "text-ink-3 line-through" : ""}`}>{bill.name}</span>
          {bill.amount !== null && <span className={`shrink-0 tabular-nums ${paid ? "text-ink-3" : ""}`}>{brl.format(num(bill.amount))}</span>}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-2">
          {paid ? (
            <span>
              Venceu em {fmtDate.format(fromISODate(bill.due_date))}, paga em {fmtDate.format(new Date(bill.paid_at!))}
            </span>
          ) : (
            <span className={late ? "text-danger" : ""}>
              {fmtDate.format(fromISODate(bill.due_date))}, {dueLabel(bill.due_date, today)}
            </span>
          )}
          {bill.repeat_monthly && (
            <span className="inline-flex items-center gap-1">
              <Repeat aria-hidden className="size-3.5" />
              Todo mês
            </span>
          )}
        </span>
      </button>
      <span className="ml-auto">
        {paid ? (
          <RowAction quiet onClick={() => unpayBill(bill)}>
            Desfazer pagamento
          </RowAction>
        ) : (
          <RowAction onClick={() => payBill(bill)}>Marcar como paga</RowAction>
        )}
      </span>
    </li>
  );
}

export function Bills({ bills, month, today, onOpen }: { bills: Bill[]; month: string; today: string; onOpen: (b: Bill) => void }) {
  const byDue = (a: Bill, b: Bill) => a.due_date.localeCompare(b.due_date);
  const open = bills.filter((b) => !b.paid_at);
  const upcoming = open.filter((b) => b.due_date >= today).sort(byDue);
  const late = open.filter((b) => b.due_date < today).sort(byDue);
  const paid = bills.filter((b) => b.paid_at && monthOf(b.due_date) === month).sort((a, b) => byDue(b, a));
  const openTotal = open.reduce((sum, b) => sum + num(b.amount), 0);

  if (bills.length === 0) {
    return (
      <section className={panel}>
        <h2 className={panelTitle}>Contas</h2>
        <p className="py-6 text-ink-2">Nenhuma conta cadastrada. Use &quot;Nova conta&quot; para lembrar de um vencimento.</p>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <section className={panel} aria-labelledby="contas-abertas">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 id="contas-abertas" className={panelTitle}>
            Em aberto
          </h2>
          {openTotal > 0 && <span className="text-[14px] tabular-nums text-ink-2">{brl.format(openTotal)} no total</span>}
        </div>

        <h3 className={subheading}>A vencer ({upcoming.length})</h3>
        {upcoming.length === 0 ? (
          <p className="py-3 text-ink-2">Nenhuma conta a vencer.</p>
        ) : (
          <ul>
            {upcoming.map((b) => (
              <BillRow key={b.id} bill={b} today={today} onOpen={onOpen} />
            ))}
          </ul>
        )}

        <h3 className={`${subheading} mt-4 ${late.length > 0 ? "text-danger" : ""}`}>Atrasadas ({late.length})</h3>
        {late.length === 0 ? (
          <p className="py-3 text-ink-2">Nenhuma conta atrasada.</p>
        ) : (
          <ul>
            {late.map((b) => (
              <BillRow key={b.id} bill={b} today={today} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </section>

      <section className={panel} aria-labelledby="contas-pagas">
        <h2 id="contas-pagas" className={panelTitle}>
          Pagas
        </h2>
        <p className="mb-2 text-[14px] text-ink-2">Com vencimento em {monthLabel(month).toLowerCase()}.</p>
        {paid.length === 0 ? (
          <p className="py-3 text-ink-2">Nenhuma conta paga com vencimento neste mês.</p>
        ) : (
          <ul>
            {paid.map((b) => (
              <BillRow key={b.id} bill={b} today={today} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
