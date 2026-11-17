"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { addDays, fmtMonthYear, fmtShort, fromISODate, startOfWeek } from "@/lib/dates";
import { StudyEditor } from "./editors";
import { distinct, fmtMinutes, minutesBySubject, sumMinutes, type StudySession } from "./store";
import { panel } from "./ui";

type Editor = { session?: StudySession } | null;

export function Studies({ today, sessions }: { today: string; sessions: StudySession[] }) {
  const [editor, setEditor] = useState<Editor>(null);

  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const month = today.slice(0, 7);
  const inWeek = sessions.filter((s) => s.studied_on >= weekStart && s.studied_on.slice(0, 10) <= weekEnd);
  const inMonth = sessions.filter((s) => s.studied_on.slice(0, 7) === month);
  const bySubject = minutesBySubject(inMonth);
  const top = bySubject[0]?.minutes ?? 0;
  const ordered = [...sessions].sort(
    (a, b) => b.studied_on.localeCompare(a.studied_on) || b.created_at.localeCompare(a.created_at),
  );
  const subjects = distinct(sessions.map((s) => s.subject));

  return (
    <>
      <div className="mb-5">
        <Button onClick={() => setEditor({})}>
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          Registrar estudo
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <section className="grid grid-cols-2 gap-3" aria-label="Tempo de estudo">
            <Total label="Esta semana" minutes={sumMinutes(inWeek)} count={inWeek.length} />
            <Total label="Este mês" minutes={sumMinutes(inMonth)} count={inMonth.length} />
          </section>

          <section className={panel} aria-labelledby="estudos-assuntos">
            <h2 id="estudos-assuntos" className="text-[19px] font-semibold">
              Por assunto
            </h2>
            <p className="text-[14px] text-ink-2 first-letter:uppercase">{fmtMonthYear.format(fromISODate(today))}</p>
            {bySubject.length === 0 ? (
              <p className="py-4 text-ink-2">Nenhum estudo registrado neste mês.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {bySubject.map((row) => (
                  <li key={row.subject}>
                    <div className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="min-w-0 truncate">{row.subject}</span>
                      <span className="shrink-0 tabular-nums text-ink-2">{fmtMinutes(row.minutes)}</span>
                    </div>
                    <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-field">
                      <div className="h-full rounded-full bg-ember" style={{ width: `${Math.max(2, (row.minutes / top) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className={panel} aria-labelledby="estudos-sessoes">
          <h2 id="estudos-sessoes" className="mb-2 text-[19px] font-semibold">
            Sessões
          </h2>
          {ordered.length === 0 ? (
            <p className="py-4 text-ink-2">Nenhuma sessão ainda. Registre o primeiro estudo.</p>
          ) : (
            <ul>
              {ordered.map((s) => (
                <li key={s.id} className="border-t border-line first:border-t-0">
                  <button
                    type="button"
                    onClick={() => setEditor({ session: s })}
                    aria-label={`Editar estudo: ${s.subject}, ${fmtMinutes(s.minutes)}`}
                    className="press -mx-2 flex w-[calc(100%+16px)] items-start justify-between gap-3 rounded-item px-2 py-3 text-left hover:bg-field"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.subject}</span>
                      <span className="block text-[13px] text-ink-2">{fmtShort.format(fromISODate(s.studied_on.slice(0, 10)))}</span>
                      {s.notes && <span className="mt-0.5 line-clamp-2 break-words text-[13px] text-ink-3">{s.notes}</span>}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-2">{fmtMinutes(s.minutes)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Sheet open={editor !== null} onClose={() => setEditor(null)} title={editor?.session ? "Editar estudo" : "Registrar estudo"}>
        {editor && (
          <StudyEditor
            key={editor.session?.id ?? "new"}
            session={editor.session}
            subjects={subjects}
            today={today}
            onClose={() => setEditor(null)}
          />
        )}
      </Sheet>
    </>
  );
}

function Total({ label, minutes, count }: { label: string; minutes: number; count: number }) {
  return (
    <div className="glass min-w-0 rounded-panel p-4 sm:p-5">
      <p className="text-[13px] font-medium text-ink-3">{label}</p>
      <p className="mt-1 text-[26px] font-light leading-tight tracking-tight tabular-nums sm:text-[30px]">{fmtMinutes(minutes)}</p>
      <p className="text-[13px] text-ink-2">
        {count} {count === 1 ? "sessão" : "sessões"}
      </p>
    </div>
  );
}
