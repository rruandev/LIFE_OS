"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { MODULES } from "@/lib/modules";
import { useSettings } from "@/lib/settings/store";

/** Minuto atual; null no servidor, para a hora nunca divergir do HTML inicial. */
function useMinute() {
  return useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, 1000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 60000),
    () => null,
  );
}

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function HomePage() {
  const minute = useMinute();
  const { settings } = useSettings();
  const now = minute === null ? null : new Date(minute * 60000);
  const name = settings.displayName.trim();
  const modules = MODULES.filter((m) => m.id !== "home");

  return (
    <div className="mx-auto max-w-5xl">
      <PreviewBanner />

      <header className="flex flex-col gap-6 pb-10 pt-4 sm:flex-row sm:items-end sm:justify-between lg:pt-10">
        <div aria-live="off">
          {now ? (
            <>
              <p className="text-ink-2 first-letter:uppercase">{dateFormat.format(now)}</p>
              <h1 className="mt-1 text-[44px] font-light leading-[1.05] tracking-[-0.03em] sm:text-[64px]">
                {greetingFor(now.getHours())}
                {name ? `, ${name}` : ""}
              </h1>
            </>
          ) : (
            <div aria-busy="true" aria-label="Carregando">
              <div className="h-5 w-48 animate-pulse rounded-full bg-field" />
              <div className="mt-3 h-12 w-72 animate-pulse rounded-full bg-field sm:h-16" />
            </div>
          )}
        </div>
        {now && (
          <time
            dateTime={now.toISOString()}
            className="text-[44px] font-extralight leading-none tracking-[-0.04em] tabular-nums text-ink-2 sm:text-[64px]"
          >
            {timeFormat.format(now)}
          </time>
        )}
      </header>

      <section aria-labelledby="modulos" className="glass rounded-panel p-3 sm:p-4">
        <div className="px-3 pb-3 pt-2 sm:px-4">
          <h2 id="modulos" className="text-[19px] font-semibold">
            Módulos
          </h2>
          <p className="text-[14px] text-ink-2">
            A Home passa a mostrar tarefas, compromissos e projetos conforme cada módulo entra no ar.
          </p>
        </div>
        <ul className="grid gap-1 md:grid-cols-2">
          {modules.map((m) => (
            <li key={m.id} className="min-w-0">
              <Link
                href={m.href}
                className="group flex min-h-[68px] items-center gap-4 rounded-item px-3 py-2 transition-colors hover:bg-field sm:px-4"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                    m.ready ? "bg-ember text-on-ember" : "bg-field text-ink-2"
                  }`}
                >
                  <m.icon aria-hidden className="size-5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{m.label}</span>
                  <span className="block text-[14px] leading-snug text-ink-2 sm:truncate">{m.summary}</span>
                </span>
                {m.ready ? (
                  <ChevronRight aria-hidden className="size-5 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                ) : (
                  <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2">
                    {m.phase}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
