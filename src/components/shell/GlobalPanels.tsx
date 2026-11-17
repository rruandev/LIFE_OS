"use client";

import { BookOpen, CalendarDays, CircleAlert, Clock, FolderKanban, Search, Sprout, SquareCheck, Wallet, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { fmtShort, fromISODate, timeOf } from "@/lib/dates";
import { requestOpen, setPanel, usePanel, type OpenKind } from "@/lib/ui";
import { CaptureSheet } from "@/modules/capture/CaptureSheet";
import { brl, num, transactions } from "@/modules/finance/store";
import { goals, habits } from "@/modules/growth/store";
import { fold, notes, searchNotes } from "@/modules/knowledge/store";
import { events, tasks } from "@/modules/my-day/store";
import { projects } from "@/modules/projects/store";
import { useAlerts, type Alert } from "./useAlerts";

/** Captura, busca e notificações: abrem de qualquer tela, por botão ou atalho. */
export function GlobalPanels() {
  const panel = usePanel();
  const alerts = useAlerts();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setPanel("search");
      } else if (key === "j") {
        e.preventDefault();
        setPanel("capture");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setPanel(null);
  return (
    <>
      <CaptureSheet open={panel === "capture"} onClose={close} />
      <Sheet open={panel === "search"} onClose={close} title="Buscar">
        {panel === "search" && <SearchBody onClose={close} />}
      </Sheet>
      <Sheet open={panel === "alerts"} onClose={close} title="Notificações">
        <AlertList alerts={alerts} onClose={close} />
      </Sheet>
    </>
  );
}

type Hit = { key: string; icon: LucideIcon; title: string; detail: string; href: string; open?: { kind: OpenKind; id: string } };

function SearchBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const t = tasks.use();
  const e = events.use();
  const p = projects.use();
  const n = notes.use();
  const tr = transactions.use();
  const g = goals.use();
  const h = habits.use();
  const loading = [t, e, p, n, tr, g, h].some((s) => s.status === "loading" || s.status === "idle");

  const words = fold(query).split(/\s+/).filter(Boolean);
  const match = (...parts: string[]) => {
    const text = fold(parts.join("\n"));
    return words.every((w) => text.includes(w));
  };
  const groups: { label: string; hits: Hit[] }[] = [];
  if (words.length > 0) {
    const add = (label: string, hits: Hit[]) => hits.length > 0 && groups.push({ label, hits: hits.slice(0, 6) });
    add(
      "Tarefas",
      t.items.filter((x) => match(x.title, x.notes)).map((x) => ({
        key: x.id,
        icon: SquareCheck,
        title: x.title,
        detail: x.completed_at ? "Concluída" : x.due_date ? `Prazo: ${fmtShort.format(fromISODate(x.due_date))}` : "Sem data",
        href: "/my-day",
        open: { kind: "task" as const, id: x.id },
      })),
    );
    add(
      "Compromissos",
      e.items.filter((x) => match(x.title, x.location, x.notes)).map((x) => ({
        key: x.id,
        icon: CalendarDays,
        title: x.title,
        detail: `${fmtShort.format(new Date(x.starts_at))}${x.all_day ? "" : ` às ${timeOf(x.starts_at)}`}`,
        href: "/my-day",
        open: { kind: "event" as const, id: x.id },
      })),
    );
    add(
      "Projetos",
      p.items.filter((x) => match(x.name, x.goal)).map((x) => ({ key: x.id, icon: FolderKanban, title: x.name, detail: x.goal || "Projeto", href: "/projects", open: { kind: "project" as const, id: x.id } })),
    );
    add(
      "Notas",
      searchNotes(n.items, query).map((x) => ({ key: x.id, icon: BookOpen, title: x.title, detail: x.body.slice(0, 80) || x.category || "Nota", href: "/knowledge", open: { kind: "note" as const, id: x.id } })),
    );
    add(
      "Movimentações",
      tr.items.filter((x) => match(x.description, x.category)).map((x) => ({
        key: x.id,
        icon: Wallet,
        title: x.description,
        detail: `${x.kind === "income" ? "+" : "−"} ${brl.format(num(x.amount))} · ${fmtShort.format(fromISODate(x.occurred_on))}`,
        href: "/finance",
      })),
    );
    add("Metas e hábitos", [
      ...g.items.filter((x) => match(x.title, x.description, x.area)).map((x) => ({ key: x.id, icon: Sprout, title: x.title, detail: "Meta", href: "/growth" })),
      ...h.items.filter((x) => match(x.name)).map((x) => ({ key: x.id, icon: Sprout, title: x.name, detail: "Hábito", href: "/growth" })),
    ]);
  }

  const go = (hit: Hit) => {
    if (hit.open) requestOpen(hit.open.kind, hit.open.id);
    router.push(hit.href);
    onClose();
  };

  return (
    <div>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          aria-label="Buscar em tudo"
          placeholder="Tarefas, projetos, notas, movimentações…"
          className="h-12 w-full rounded-full border border-line bg-field pl-12 pr-4 text-[16px] placeholder:text-ink-3 focus:border-ember focus:outline-none"
        />
      </div>
      <div className="mt-4 min-h-40" aria-live="polite">
        {words.length === 0 ? (
          <p className="text-ink-2">Digite para procurar em todos os módulos.</p>
        ) : loading ? (
          <p className="text-ink-2">Carregando seus dados…</p>
        ) : groups.length === 0 ? (
          <p className="text-ink-2">Nada encontrado para “{query.trim()}”. Tente outra palavra.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-4">
              <h3 className="mb-1 text-[13px] font-medium text-ink-3">{group.label}</h3>
              <ul>
                {group.hits.map((hit) => (
                  <li key={hit.key}>
                    <button type="button" onClick={() => go(hit)} className="press flex w-full items-center gap-3 rounded-item px-2 py-2.5 text-left hover:bg-field">
                      <hit.icon aria-hidden className="size-5 shrink-0 text-ink-2" strokeWidth={1.8} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{hit.title}</span>
                        <span className="block truncate text-[13px] text-ink-2">{hit.detail}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function AlertList({ alerts, onClose }: { alerts: Alert[]; onClose: () => void }) {
  const router = useRouter();
  if (alerts.length === 0) return <p className="pb-4 text-ink-2">Nada pedindo atenção agora. Prazos, contas e compromissos próximos aparecem aqui.</p>;
  return (
    <ul className="-mx-2">
      {alerts.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => {
              if (a.open) requestOpen(a.open.kind, a.open.id);
              router.push(a.href);
              onClose();
            }}
            className="press flex w-full items-center gap-3 rounded-item px-2 py-2.5 text-left hover:bg-field"
          >
            {a.tone === "urgent" ? (
              <CircleAlert aria-hidden className="size-5 shrink-0 text-danger" strokeWidth={1.8} />
            ) : (
              <Clock aria-hidden className="size-5 shrink-0 text-ember" strokeWidth={1.8} />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{a.title}</span>
              <span className="block truncate text-[13px] text-ink-2">{a.detail}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
