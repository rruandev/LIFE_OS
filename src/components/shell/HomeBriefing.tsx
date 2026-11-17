"use client";

import { ChevronRight, Globe, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";
import { buildBriefing } from "@/modules/assistant/briefing";
import { briefings } from "@/modules/assistant/store";
import { habitLogs, habits } from "@/modules/growth/store";
import { events, tasks } from "@/modules/my-day/store";
import { opportunities } from "@/modules/opportunities/store";
import { projects } from "@/modules/projects/store";

/** Briefing curto na Home: o resumo da IA do dia, ou as sugestões por regras. */
export function HomeBriefing({ today, now }: { today: string; now: Date }) {
  const t = tasks.use();
  const e = events.use();
  const p = projects.use();
  const h = habits.use();
  const hl = habitLogs.use();
  const o = opportunities.use();
  const b = briefings.use();
  const ready = [t, e, p, h, hl, o].every((s) => s.status === "ready");

  const saved = b.items.find((x) => x.day === today);
  const brief = ready ? buildBriefing({ today, now, tasks: t.items, events: e.items, projects: p.items, habits: h.items, habitLogs: hl.items }) : null;
  const openOpps = o.items.filter((x) => x.status === "new" || x.status === "validating").length;

  return (
    <section aria-labelledby="briefing" className="glass rounded-panel p-5 sm:p-6">
      <Link href="/assistant" className="press mb-3 flex items-center justify-between gap-3 rounded-full">
        <h2 id="briefing" className="flex items-center gap-2 text-[19px] font-semibold">
          <Sparkles aria-hidden className="size-5 text-ember" />
          Briefing do dia
        </h2>
        <ChevronRight aria-hidden className="size-4 text-ink-3" />
      </Link>
      {!brief ? (
        <div className="h-16 animate-pulse rounded-item bg-field" aria-busy="true" aria-label="Carregando" />
      ) : saved ? (
        <p className="line-clamp-4 whitespace-pre-line text-ink-2">{saved.content}</p>
      ) : brief.suggestions.length === 0 ? (
        <p className="text-ink-2">Dia sem pendências urgentes.</p>
      ) : (
        <ul className="space-y-1.5">
          {brief.suggestions.slice(0, 3).map((s) => (
            <li key={s} className="flex gap-2.5">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ember" />
              <span className="min-w-0">{s}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-[14px]">
        <Link href="/opportunities" className="press flex items-center gap-1.5 rounded-full border border-line bg-field px-3 py-1.5">
          <Lightbulb aria-hidden className="size-4 text-ink-2" />
          {openOpps === 0 ? "Oportunidades" : `${openOpps} oportunidade${openOpps > 1 ? "s" : ""} para avaliar`}
        </Link>
        <Link href="/intelligence" className="press flex items-center gap-1.5 rounded-full border border-line bg-field px-3 py-1.5">
          <Globe aria-hidden className="size-4 text-ink-2" />
          Notícias do dia
        </Link>
      </div>
    </section>
  );
}
