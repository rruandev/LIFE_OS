"use client";

import { Minus, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { fmtShort, fromISODate } from "@/lib/dates";
import { GoalEditor } from "./editors";
import { distinct, goals as goalStore, type Goal } from "./store";
import { Bar, IconButton, panel } from "./ui";

type Filter = "active" | "done";
type Editor = { goal?: Goal } | null;

export function Goals({ today, goals }: { today: string; goals: Goal[] }) {
  const [filter, setFilter] = useState<Filter>("active");
  const [editor, setEditor] = useState<Editor>(null);

  const areas = distinct(goals.map((g) => g.area));
  const shown = goals
    .filter((g) => g.status === filter)
    .sort((a, b) =>
      filter === "done"
        ? b.created_at.localeCompare(a.created_at)
        : (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999") || a.created_at.localeCompare(b.created_at),
    );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button onClick={() => setEditor({})}>
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          Nova meta
        </Button>
        <Segmented<Filter>
          label="Filtrar metas"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: "Ativas" },
            { value: "done", label: "Concluídas" },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <p className={`${panel} text-ink-2`}>
          {filter === "active"
            ? "Nenhuma meta ativa. Crie uma para acompanhar seu progresso."
            : "Nenhuma meta concluída ainda."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {shown.map((goal) => (
            <GoalCard key={goal.id} goal={goal} today={today} onEdit={() => setEditor({ goal })} />
          ))}
        </ul>
      )}

      <Sheet open={editor !== null} onClose={() => setEditor(null)} title={editor?.goal ? "Editar meta" : "Nova meta"}>
        {editor && (
          <GoalEditor key={editor.goal?.id ?? "new"} goal={editor.goal} areas={areas} onClose={() => setEditor(null)} />
        )}
      </Sheet>
    </>
  );
}

function GoalCard({ goal, today, onEdit }: { goal: Goal; today: string; onEdit: () => void }) {
  const done = goal.status === "done";
  const late = !done && goal.target_date !== null && goal.target_date < today;
  const step = (delta: number) =>
    void goalStore.update(goal.id, { progress: Math.max(0, Math.min(100, goal.progress + delta)) });

  return (
    <li className={panel}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-[17px] font-semibold leading-snug">{goal.title}</h3>
        <button
          type="button"
          aria-label={`Editar ${goal.title}`}
          onClick={onEdit}
          className="press flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-field hover:text-ink"
        >
          <Pencil aria-hidden className="size-4" />
        </button>
      </div>

      {(goal.area || goal.target_date) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-2">
          {goal.area && <span className="max-w-full truncate rounded-full bg-ember-soft px-2.5 py-0.5 text-ink">{goal.area}</span>}
          {goal.target_date &&
            (late ? (
              <span className="text-danger">Atrasada · {fmtShort.format(fromISODate(goal.target_date))}</span>
            ) : (
              <span>Até {fmtShort.format(fromISODate(goal.target_date))}</span>
            ))}
        </p>
      )}

      {goal.description && <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-[14px] text-ink-2">{goal.description}</p>}

      <div className="mt-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Bar value={goal.progress} done={done} label={`Progresso de ${goal.title}`} />
        </div>
        <span className="w-11 shrink-0 text-right text-[15px] font-semibold tabular-nums">{goal.progress}%</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {done ? (
          <Button variant="soft" className="h-10 px-4" onClick={() => void goalStore.update(goal.id, { status: "active" })}>
            Reabrir
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <IconButton label="Diminuir progresso em 5%" onClick={() => step(-5)} disabled={goal.progress <= 0}>
                <Minus aria-hidden className="size-4" />
              </IconButton>
              <IconButton label="Aumentar progresso em 5%" onClick={() => step(5)} disabled={goal.progress >= 100}>
                <Plus aria-hidden className="size-4" />
              </IconButton>
            </div>
            <Button
              variant="soft"
              className="h-10 px-4"
              onClick={() => void goalStore.update(goal.id, { status: "done", progress: 100 })}
            >
              Concluir
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
