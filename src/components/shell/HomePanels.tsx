"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { brl, inMonth, totals, transactions } from "@/modules/finance/store";
import { goals } from "@/modules/growth/store";
import { tasks } from "@/modules/my-day/store";
import { projectProgress, projects } from "@/modules/projects/store";

function Panel({ title, href, children, ready }: { title: string; href: string; children: ReactNode; ready: boolean }) {
  return (
    <section className="glass min-w-0 rounded-panel p-5">
      <Link href={href} className="press mb-3 flex items-center justify-between gap-3 rounded-full">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <ChevronRight aria-hidden className="size-4 text-ink-3" />
      </Link>
      {ready ? children : <div className="h-20 animate-pulse rounded-item bg-field" aria-busy="true" aria-label="Carregando" />}
    </section>
  );
}

const Bar = ({ pct }: { pct: number }) => (
  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-field">
    <div className="h-full rounded-full bg-ember" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
  </div>
);

/** Resumos da Home: projetos em andamento, finanças do mês e progresso das metas. */
export function HomePanels({ today }: { today: string }) {
  const p = projects.use();
  const t = tasks.use();
  const tr = transactions.use();
  const g = goals.use();

  const active = p.items.filter((x) => x.status === "active").slice(0, 4);
  const month = totals(inMonth(tr.items, today.slice(0, 7)));
  const activeGoals = g.items.filter((x) => x.status === "active").slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Panel title="Projetos em andamento" href="/projects" ready={p.status === "ready" && t.status === "ready"}>
        {active.length === 0 ? (
          <p className="text-[14px] text-ink-2">Nenhum projeto ativo.</p>
        ) : (
          <ul className="space-y-3">
            {active.map((x) => {
              const prog = projectProgress(t.items, x.id);
              return (
                <li key={x.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{x.name}</span>
                    <span className="shrink-0 text-[13px] tabular-nums text-ink-2">
                      {prog.done} de {prog.total}
                    </span>
                  </div>
                  <Bar pct={prog.pct} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Finanças do mês" href="/finance" ready={tr.status === "ready"}>
        {month.income === 0 && month.expense === 0 ? (
          <p className="text-[14px] text-ink-2">Nenhuma movimentação registrada neste mês.</p>
        ) : (
          <dl className="space-y-1.5 tabular-nums">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">Entradas</dt>
              <dd className="text-ok">{brl.format(month.income)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">Despesas</dt>
              <dd>{brl.format(month.expense)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-1.5 font-semibold">
              <dt>Saldo</dt>
              <dd className={month.balance < 0 ? "text-danger" : ""}>{brl.format(month.balance)}</dd>
            </div>
          </dl>
        )}
      </Panel>

      <Panel title="Metas" href="/growth" ready={g.status === "ready"}>
        {activeGoals.length === 0 ? (
          <p className="text-[14px] text-ink-2">Nenhuma meta ativa.</p>
        ) : (
          <ul className="space-y-3">
            {activeGoals.map((x) => (
              <li key={x.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium">{x.title}</span>
                  <span className="shrink-0 text-[13px] tabular-nums text-ink-2">{x.progress}%</span>
                </div>
                <Bar pct={x.progress} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
