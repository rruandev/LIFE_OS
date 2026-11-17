"use client";

import { useState } from "react";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { isoDate, useNow } from "@/lib/dates";
import { Achievements } from "./Achievements";
import { Goals } from "./Goals";
import { Habits } from "./Habits";
import { Studies } from "./Studies";
import { achievements, goals, habitLogs, habits, studySessions } from "./store";
import { panel } from "./ui";

type Section = "habits" | "goals" | "studies" | "achievements";

const stores = [habits, habitLogs, goals, studySessions, achievements];

export function Growth() {
  const now = useNow();
  const today = now ? isoDate(now) : null;
  const [section, setSection] = useState<Section>("habits");
  const habitState = habits.use();
  const logState = habitLogs.use();
  const goalState = goals.use();
  const studyState = studySessions.use();
  const achievementState = achievements.use();

  const states = [habitState, logState, goalState, studyState, achievementState];
  const loading = !today || states.some((s) => s.status === "idle" || s.status === "loading");
  const failure = states.find((s) => s.error)?.error ?? null;

  return (
    <div className="mx-auto max-w-5xl">
      <PreviewBanner />

      <header className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-ink-2">Desenvolvimento pessoal</p>
          <h1 className="text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">Growth</h1>
        </div>
        <Segmented<Section>
          label="Seção"
          value={section}
          onChange={setSection}
          options={[
            { value: "habits", label: "Hábitos" },
            { value: "goals", label: "Metas" },
            { value: "studies", label: "Estudos" },
            { value: "achievements", label: "Conquistas" },
          ]}
        />
      </header>

      {failure ? (
        <div className="space-y-3">
          <Notice kind="error">{failure}</Notice>
          <Button variant="soft" onClick={() => stores.forEach((s) => void s.load(true))}>
            Tentar de novo
          </Button>
        </div>
      ) : loading || !today ? (
        <div aria-busy="true" aria-label="Carregando">
          <div className="mb-5 h-11 w-40 animate-pulse rounded-full bg-field" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className={`${panel} h-64 animate-pulse`} />
            <div className={`${panel} h-64 animate-pulse`} />
          </div>
        </div>
      ) : (
        <>
          {section === "habits" && <Habits today={today} habits={habitState.items} logs={logState.items} />}
          {section === "goals" && <Goals today={today} goals={goalState.items} />}
          {section === "studies" && <Studies today={today} sessions={studyState.items} />}
          {section === "achievements" && <Achievements today={today} achievements={achievementState.items} />}
        </>
      )}
    </div>
  );
}
