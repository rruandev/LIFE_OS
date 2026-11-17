import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type Scope = "my-day" | "projects" | "knowledge" | "growth" | "finance" | "opportunities";
const DEFAULT_SCOPES: Scope[] = ["my-day", "projects", "knowledge", "growth"];

const clip = (s: string | null | undefined, n: number) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

/**
 * Monta um retrato compacto dos dados que a pessoa liberou para a IA.
 * Lido com a sessão dela: o banco (RLS) só devolve as linhas da própria conta.
 */
export async function buildContext(db: SupabaseClient, userId: string, today: string) {
  const { data: prefs } = await db.from("settings").select("ai_scopes").eq("user_id", userId).maybeSingle();
  const scopes = new Set<Scope>((prefs?.ai_scopes as Scope[] | undefined) ?? DEFAULT_SCOPES);
  const parts: string[] = [`Hoje é ${today}.`];
  const month = today.slice(0, 7);

  if (scopes.has("my-day")) {
    const [t, e] = await Promise.all([
      db.from("tasks").select("title, priority, due_date, due_time, completed_at, project_id").is("completed_at", null).order("due_date", { nullsFirst: false }).limit(80),
      db.from("events").select("title, starts_at, ends_at, all_day, location").gte("ends_at", `${today}T00:00:00Z`).order("starts_at").limit(40),
    ]);
    parts.push(
      "## Tarefas abertas\n" +
        ((t.data ?? []).map((x) => `- ${clip(x.title, 120)} | prioridade ${x.priority} | prazo ${x.due_date ?? "sem data"}${x.due_time ? ` ${String(x.due_time).slice(0, 5)}` : ""}`).join("\n") || "(nenhuma)"),
      "## Próximos compromissos (horários em UTC)\n" +
        ((e.data ?? []).map((x) => `- ${clip(x.title, 120)} | ${x.all_day ? `dia todo ${String(x.starts_at).slice(0, 10)}` : `${x.starts_at} até ${x.ends_at}`}${x.location ? ` | ${clip(x.location, 60)}` : ""}`).join("\n") || "(nenhum)"),
    );
  }
  if (scopes.has("projects")) {
    const [p, pt] = await Promise.all([
      db.from("projects").select("id, name, goal, status, due_date").neq("status", "done").limit(30),
      db.from("tasks").select("project_id, completed_at").not("project_id", "is", null).limit(500),
    ]);
    parts.push(
      "## Projetos ativos e pausados\n" +
        ((p.data ?? [])
          .map((x) => {
            const mine = (pt.data ?? []).filter((y) => y.project_id === x.id);
            const done = mine.filter((y) => y.completed_at).length;
            return `- ${clip(x.name, 80)} | ${x.status} | prazo ${x.due_date ?? "sem prazo"} | ${done} de ${mine.length} tarefas | objetivo: ${clip(x.goal, 160)}`;
          })
          .join("\n") || "(nenhum)"),
    );
  }
  if (scopes.has("knowledge")) {
    const n = await db.from("notes").select("title, kind, category, tags, body").order("created_at", { ascending: false }).limit(25);
    parts.push("## Notas recentes\n" + ((n.data ?? []).map((x) => `- [${x.kind}] ${clip(x.title, 100)}${x.category ? ` (${x.category})` : ""}: ${clip(x.body, 160)}`).join("\n") || "(nenhuma)"));
  }
  if (scopes.has("growth")) {
    const [g, h] = await Promise.all([
      db.from("goals").select("title, area, progress, target_date, status").eq("status", "active").limit(20),
      db.from("habits").select("name, weekly_target").eq("archived", false).limit(20),
    ]);
    parts.push(
      "## Metas pessoais ativas\n" + ((g.data ?? []).map((x) => `- ${clip(x.title, 100)} | ${x.progress}% | ${x.area || "sem área"} | data alvo ${x.target_date ?? "sem data"}`).join("\n") || "(nenhuma)"),
      "## Hábitos\n" + ((h.data ?? []).map((x) => `- ${clip(x.name, 80)} | meta ${x.weekly_target}x por semana`).join("\n") || "(nenhum)"),
    );
  }
  if (scopes.has("finance")) {
    const [tr, b] = await Promise.all([
      db.from("transactions").select("kind, amount, category").gte("occurred_on", `${month}-01`).limit(1000),
      db.from("bills").select("name, amount, due_date").is("paid_at", null).order("due_date").limit(20),
    ]);
    let income = 0;
    let expense = 0;
    const byCat = new Map<string, number>();
    for (const x of tr.data ?? []) {
      const v = Number(x.amount);
      if (x.kind === "income") income += v;
      else {
        expense += v;
        byCat.set(x.category || "Sem categoria", (byCat.get(x.category || "Sem categoria") ?? 0) + v);
      }
    }
    parts.push(
      `## Finanças do mês ${month}\nEntradas R$ ${income.toFixed(2)} | Despesas R$ ${expense.toFixed(2)} | Saldo R$ ${(income - expense).toFixed(2)}\n` +
        [...byCat].sort((a, c) => c[1] - a[1]).slice(0, 8).map(([k, v]) => `- ${k}: R$ ${v.toFixed(2)}`).join("\n"),
      "## Contas em aberto\n" + ((b.data ?? []).map((x) => `- ${clip(x.name, 60)} | vence ${x.due_date}${x.amount ? ` | R$ ${Number(x.amount).toFixed(2)}` : ""}`).join("\n") || "(nenhuma)"),
    );
  }
  if (scopes.has("opportunities")) {
    const o = await db.from("opportunities").select("title, status, data_status, problem").neq("status", "discarded").limit(20);
    parts.push("## Oportunidades abertas\n" + ((o.data ?? []).map((x) => `- ${clip(x.title, 100)} | ${x.status} | dados: ${x.data_status} | problema: ${clip(x.problem, 140)}`).join("\n") || "(nenhuma)"));
  }

  const hidden = (["my-day", "projects", "knowledge", "growth", "finance", "opportunities"] as Scope[]).filter((s) => !scopes.has(s));
  if (hidden.length) parts.push(`Módulos que a pessoa NÃO liberou para você ler: ${hidden.join(", ")}. Se perguntarem sobre eles, diga que o acesso está desligado em Configurações.`);
  return parts.join("\n\n");
}
