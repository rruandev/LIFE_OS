"use client";

import { useEffect } from "react";
import { showToast } from "@/lib/toast";
import { events, tasks } from "./store";

/** Dispara os lembretes vencidos enquanto o app está aberto. Cada um avisa uma única vez. */
export function Reminders() {
  tasks.use();
  events.use();

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const due = (r: { remind_at: string | null; reminded_at: string | null }) =>
        r.remind_at !== null &&
        r.reminded_at === null &&
        new Date(r.remind_at).getTime() <= now &&
        new Date(r.remind_at).getTime() > now - 12 * 3600_000;
      const stamp = new Date().toISOString();
      for (const t of tasks.get().items) {
        if (t.completed_at || !due(t)) continue;
        void tasks.update(t.id, { reminded_at: stamp });
        showToast({
          kind: "reminder",
          message: `Lembrete: ${t.title}`,
          action: { label: "Concluir", run: () => void tasks.update(t.id, { completed_at: new Date().toISOString() }) },
        });
      }
      for (const e of events.get().items) {
        if (!due(e)) continue;
        void events.update(e.id, { reminded_at: stamp });
        showToast({ kind: "reminder", message: `Compromisso: ${e.title}` });
      }
    };
    const id = setInterval(check, 15000);
    const first = setTimeout(check, 2500);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);

  return null;
}
