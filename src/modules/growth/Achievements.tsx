"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { fmtDayMonth, fmtMonthYear, fromISODate } from "@/lib/dates";
import { AchievementEditor } from "./editors";
import type { Achievement } from "./store";
import { capitalize, panel } from "./ui";

type Editor = { achievement?: Achievement } | null;

export function Achievements({ today, achievements }: { today: string; achievements: Achievement[] }) {
  const [editor, setEditor] = useState<Editor>(null);

  const ordered = [...achievements].sort(
    (a, b) => b.achieved_on.localeCompare(a.achieved_on) || b.created_at.localeCompare(a.created_at),
  );
  const months: { month: string; items: Achievement[] }[] = [];
  for (const item of ordered) {
    const month = item.achieved_on.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.month === month) last.items.push(item);
    else months.push({ month, items: [item] });
  }

  return (
    <>
      <div className="mb-5">
        <Button onClick={() => setEditor({})}>
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          Nova conquista
        </Button>
      </div>

      {months.length === 0 ? (
        <p className={`${panel} text-ink-2`}>Nenhuma conquista registrada ainda. Anote a primeira, por menor que seja.</p>
      ) : (
        <div className={`${panel} space-y-6`}>
          {months.map(({ month, items }) => (
            <section key={month} aria-labelledby={`conquistas-${month}`}>
              <h2 id={`conquistas-${month}`} className="mb-2 text-[13px] font-medium text-ink-3">
                {capitalize(fmtMonthYear.format(fromISODate(`${month}-01`)))}
              </h2>
              <ol className="ml-1.5 border-l border-line">
                {items.map((a) => (
                  <li key={a.id} className="relative pl-5">
                    <span aria-hidden className="absolute -left-[5px] top-[18px] size-[9px] rounded-full bg-ember" />
                    <button
                      type="button"
                      onClick={() => setEditor({ achievement: a })}
                      aria-label={`Editar conquista: ${a.title}`}
                      className="press block w-full rounded-item px-2 py-2.5 text-left hover:bg-field"
                    >
                      <span className="block text-[13px] text-ink-2">{fmtDayMonth.format(fromISODate(a.achieved_on.slice(0, 10)))}</span>
                      <span className="block break-words font-medium">{a.title}</span>
                      {a.notes && <span className="mt-0.5 block whitespace-pre-line break-words text-[14px] text-ink-2">{a.notes}</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      <Sheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.achievement ? "Editar conquista" : "Nova conquista"}
      >
        {editor && (
          <AchievementEditor
            key={editor.achievement?.id ?? "new"}
            achievement={editor.achievement}
            today={today}
            onClose={() => setEditor(null)}
          />
        )}
      </Sheet>
    </>
  );
}
