"use client";

import { CircleCheck, Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { fromISODate } from "@/lib/dates";
import { fmtDate, IconButton, panel, panelTitle, RowAction } from "./shared";
import { brl, financialGoals, goalProgress, num, parseAmount, type FinancialGoal } from "./store";

const reached = (g: FinancialGoal) => num(g.target_amount) > 0 && num(g.saved_amount) >= num(g.target_amount);

export function Goals({ goals, today, onOpen }: { goals: FinancialGoal[]; today: string; onOpen: (g: FinancialGoal) => void }) {
  if (goals.length === 0) {
    return (
      <section className={panel}>
        <h2 className={panelTitle}>Metas</h2>
        <p className="py-6 text-ink-2">Nenhuma meta ainda. Use &quot;Nova meta&quot; para definir quanto quer guardar.</p>
      </section>
    );
  }
  // Em andamento primeiro (prazo mais próximo no topo), alcançadas no fim.
  const sorted = [...goals].sort(
    (a, b) => Number(reached(a)) - Number(reached(b)) || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.created_at.localeCompare(b.created_at),
  );
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      {sorted.map((g) => (
        <GoalCard key={g.id} goal={g} today={today} onOpen={onOpen} />
      ))}
    </div>
  );
}

function GoalCard({ goal, today, onOpen }: { goal: FinancialGoal; today: string; onOpen: (g: FinancialGoal) => void }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const done = reached(goal);
  const pct = Math.floor(goalProgress(goal) * 100);
  const missing = num(goal.target_amount) - num(goal.saved_amount);
  const late = !done && goal.due_date !== null && goal.due_date < today;

  function add(e: FormEvent) {
    e.preventDefault();
    const amount = parseAmount(value);
    if (amount === null || amount <= 0) return setError("Digite um valor maior que zero, como 150,00.");
    void financialGoals.update(goal.id, { saved_amount: Math.round((num(goal.saved_amount) + amount) * 100) / 100 });
    setValue("");
    setError(undefined);
    setAdding(false);
  }

  return (
    <section className={`${panel} ${done ? "border-ok/50" : ""}`} aria-label={`Meta: ${goal.name}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`${panelTitle} break-words`}>{goal.name}</h2>
          {done && (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[14px] font-medium text-ok">
              <CircleCheck aria-hidden className="size-4" />
              Meta alcançada
            </p>
          )}
        </div>
        <IconButton label={`Editar meta: ${goal.name}`} onClick={() => onOpen(goal)}>
          <Pencil aria-hidden className="size-4" />
        </IconButton>
      </div>

      <p className="mt-3 tabular-nums">
        <span className="text-[22px] font-light tracking-tight">{brl.format(num(goal.saved_amount))}</span>{" "}
        <span className="text-ink-2">de {brl.format(num(goal.target_amount))}</span>
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-field"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso da meta ${goal.name}`}
        >
          <div className={`h-full rounded-full transition-[width] duration-300 ${done ? "bg-ok" : "bg-ember"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`shrink-0 text-[14px] tabular-nums ${done ? "font-semibold text-ok" : "text-ink-2"}`}>{pct}%</span>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 text-[14px] text-ink-2">
        {!done && <span className="tabular-nums">Faltam {brl.format(missing)}</span>}
        {goal.due_date ? (
          <span className={late ? "text-danger" : ""}>
            {late ? "Prazo vencido em" : "Prazo:"} {fmtDate.format(fromISODate(goal.due_date))}
          </span>
        ) : (
          <span>Sem prazo</span>
        )}
      </p>

      <div className="mt-4">
        {adding ? (
          <form onSubmit={add} noValidate>
            <div className="flex gap-2">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                aria-label={`Valor a adicionar em ${goal.name}`}
                aria-invalid={error ? true : undefined}
                placeholder="0,00"
                className={`h-11 min-w-0 flex-1 rounded-full border bg-field px-4 text-[15px] placeholder:text-ink-3 focus:border-ember focus:outline-none ${error ? "border-danger" : "border-line"}`}
              />
              <Button type="submit" className="px-4">
                Adicionar
              </Button>
            </div>
            {error && (
              <p role="alert" className="mt-1.5 text-[13px] text-danger">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setValue("");
                setError(undefined);
              }}
              className="press mt-2 rounded-full px-2 py-1 text-[14px] text-ink-2 hover:text-ink"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <RowAction onClick={() => setAdding(true)}>Adicionar valor</RowAction>
        )}
      </div>
    </section>
  );
}
