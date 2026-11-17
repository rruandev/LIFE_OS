"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { fromISODate } from "@/lib/dates";
import { capitalize, fmtDayFull, panel, panelTitle } from "./shared";
import { brl, categoriesOf, categoryLabel, inMonth, newestFirst, num, totals, type Transaction } from "./store";

type KindFilter = "all" | "income" | "expense";
const NONE = "__sem_categoria__";

export function Transactions({ month, transactions, onOpen }: { month: string; transactions: Transaction[]; onOpen: (t: Transaction) => void }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [picked, setPicked] = useState("");
  const [query, setQuery] = useState("");

  const monthly = inMonth(transactions, month);
  const options = categoriesOf(monthly);
  const hasUncategorised = monthly.some((t) => !t.category.trim());
  // Categoria escolhida em outro mês pode não existir neste: volta para "todas".
  const category = picked === NONE ? (hasUncategorised ? NONE : "") : options.some((c) => c.toLowerCase() === picked.toLowerCase()) ? picked : "";
  const needle = query.trim().toLowerCase();

  const shown = monthly
    .filter((t) => kind === "all" || t.kind === kind)
    .filter((t) => (category === "" ? true : category === NONE ? !t.category.trim() : t.category.trim().toLowerCase() === category.toLowerCase()))
    .filter((t) => !needle || t.description.toLowerCase().includes(needle))
    .sort(newestFirst);
  const days = [...new Set(shown.map((t) => t.occurred_on.slice(0, 10)))];
  const sum = totals(shown);
  const filtering = kind !== "all" || category !== "" || needle !== "";

  return (
    <section className={panel} aria-labelledby="movimentacoes">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="movimentacoes" className={panelTitle}>
          Movimentações
        </h2>
        {shown.length > 0 && (
          <span className="text-[14px] tabular-nums text-ink-2">
            {shown.length} {shown.length === 1 ? "registro" : "registros"}, saldo{" "}
            <span className={sum.balance < 0 ? "text-danger" : ""}>{brl.format(sum.balance)}</span>
          </span>
        )}
      </div>

      {monthly.length > 0 && (
        <div className="mb-5 grid grid-cols-1 items-end gap-3 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <Segmented<KindFilter>
              label="Filtrar por tipo"
              value={kind}
              onChange={setKind}
              options={[
                { value: "all", label: "Todas" },
                { value: "income", label: "Entradas" },
                { value: "expense", label: "Despesas" },
              ]}
            />
          </div>
          <Select label="Categoria" value={category} onChange={(e) => setPicked(e.target.value)} className="min-w-0">
            <option value="">Todas as categorias</option>
            {options.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {hasUncategorised && <option value={NONE}>Sem categoria</option>}
          </Select>
          <label className="relative block min-w-0">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Buscar</span>
            <Search aria-hidden className="pointer-events-none absolute bottom-4 left-4 size-4 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar na descrição"
              className="h-12 w-full rounded-item border border-line bg-field pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-3 focus:border-ember focus:outline-none"
            />
          </label>
        </div>
      )}

      {monthly.length === 0 ? (
        <p className="py-6 text-ink-2">Nenhuma movimentação neste mês. Use &quot;Nova movimentação&quot; para registrar a primeira.</p>
      ) : shown.length === 0 ? (
        <p className="py-6 text-ink-2">{filtering ? "Nenhuma movimentação combina com os filtros." : "Nenhuma movimentação neste mês."}</p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day}>
              <h3 className="text-[13px] font-medium text-ink-3">{capitalize(fmtDayFull.format(fromISODate(day)))}</h3>
              <ul>
                {shown
                  .filter((t) => t.occurred_on.slice(0, 10) === day)
                  .map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(t)}
                        className="press -mx-2 flex w-[calc(100%+16px)] items-center justify-between gap-3 rounded-item px-2 py-2.5 text-left hover:bg-field"
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{t.description}</span>
                          <span className="block truncate text-[13px] text-ink-2">{categoryLabel(t.category)}</span>
                        </span>
                        <span className={`shrink-0 tabular-nums ${t.kind === "income" ? "text-ok" : ""}`}>
                          <span className="sr-only">{t.kind === "income" ? "Entrada de " : "Despesa de "}</span>
                          <span aria-hidden>{t.kind === "income" ? "+ " : "− "}</span>
                          {brl.format(num(t.amount))}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
