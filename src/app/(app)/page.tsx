"use client";

import { HomeBriefing } from "@/components/shell/HomeBriefing";
import { HomePanels } from "@/components/shell/HomePanels";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { isoDate, useNow } from "@/lib/dates";
import { useSettings } from "@/lib/settings/store";
import { TodayPanel } from "@/modules/my-day/TodayPanel";

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function HomePage() {
  const now = useNow();
  const { settings } = useSettings();
  const name = settings.displayName.trim();

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

      {now && (
        <div className="mb-5 space-y-5">
          <HomeBriefing today={isoDate(now)} now={now} />
          <TodayPanel today={isoDate(now)} now={now} />
          <HomePanels today={isoDate(now)} />
        </div>
      )}

    </div>
  );
}
