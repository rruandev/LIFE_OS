import { pad } from "@/lib/dates";
import type { Habit, HabitLog } from "@/modules/growth/store";
import { byPriority, conflicts, eventsOn, overdue, tasksOn, type CalEvent, type Task } from "@/modules/my-day/store";
import type { Project } from "@/modules/projects/store";

export type BriefingData = {
  today: string;
  now: Date;
  tasks: Task[];
  events: CalEvent[];
  projects: Project[];
  habits: Habit[];
  habitLogs: HabitLog[];
};

/** Maior janela livre do dia (entre 8h e 21h, a partir de agora), em minutos do dia. */
function freeWindow(dayEvents: CalEvent[], now: Date) {
  const minutes = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };
  const busy = dayEvents
    .filter((e) => !e.all_day)
    .map((e) => [minutes(e.starts_at), minutes(e.ends_at) || 24 * 60] as const)
    .sort((a, b) => a[0] - b[0]);
  let cursor = Math.max(8 * 60, Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15);
  const end = 21 * 60;
  let best: [number, number] | null = null;
  for (const [s, e] of [...busy, [end, end] as const]) {
    const gapEnd = Math.min(s, end);
    if (gapEnd - cursor >= 60 && (!best || gapEnd - cursor > best[1] - best[0])) best = [cursor, gapEnd];
    cursor = Math.max(cursor, e);
    if (cursor >= end) break;
  }
  return best;
}
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/**
 * Briefing do dia montado por regras, só com os seus dados.
 * Funciona sem IA; com IA ligada, ganha um resumo escrito por cima.
 */
export function buildBriefing({ today, now, tasks, events, projects, habits, habitLogs }: BriefingData) {
  const agenda = eventsOn(events, today).filter((e) => e.all_day || new Date(e.ends_at) > now);
  const todays = tasksOn(tasks, today).filter((t) => !t.completed_at);
  const late = overdue(tasks, today);
  const priorities = [...late, ...todays].sort(byPriority).slice(0, 3);
  const clash = conflicts(eventsOn(events, today));

  const doneToday = new Set(habitLogs.filter((l) => l.done_on === today).map((l) => l.habit_id));
  const habitsLeft = habits.filter((h) => !h.archived && !doneToday.has(h.id));

  const active = projects.filter((p) => p.status === "active");
  const projectLines = active.slice(0, 5).map((p) => {
    const mine = tasks.filter((t) => t.project_id === p.id);
    const done = mine.filter((t) => t.completed_at).length;
    const next = mine.filter((t) => !t.completed_at).sort(byPriority)[0];
    return { project: p, done, total: mine.length, next };
  });

  const suggestions: string[] = [];
  if (late.length > 0)
    suggestions.push(`Você tem ${late.length} tarefa${late.length > 1 ? "s" : ""} atrasada${late.length > 1 ? "s" : ""}. Conclua, reagende ou exclua antes de pegar coisas novas.`);
  if (todays.length > 5) suggestions.push(`São ${todays.length} tarefas para hoje. Escolha as 3 que realmente precisam sair e passe o resto para outro dia.`);
  if (clash.size > 0) suggestions.push("Há compromissos no mesmo horário hoje. Decida qual mantém e remarque o outro.");
  const window = freeWindow(eventsOn(events, today), now);
  const highUntimed = todays.filter((t) => t.priority === "high" && !t.due_time);
  if (window && highUntimed.length > 0)
    suggestions.push(`Seu maior bloco livre é das ${hhmm(window[0])} às ${hhmm(window[1])}. Bom momento para: ${highUntimed[0].title}.`);
  else if (window && window[1] - window[0] >= 120) suggestions.push(`Você tem um bloco livre das ${hhmm(window[0])} às ${hhmm(window[1])}.`);
  const stalled = projectLines.filter((l) => l.total > 0 && !l.next);
  for (const l of stalled.slice(0, 1)) suggestions.push(`O projeto ${l.project.name} não tem próxima tarefa definida. Crie uma para ele não parar.`);
  if (active.length > 0 && projectLines.every((l) => l.total === 0)) suggestions.push("Seus projetos ainda não têm tarefas. Quebre cada um em um primeiro passo.");

  return { agenda, priorities, lateCount: late.length, habitsLeft, projectLines, suggestions };
}
