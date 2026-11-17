"use client";

import { ArrowUp, CalendarDays, Check, CircleAlert, FolderKanban, Lightbulb, Sparkles, Sprout, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { useAlerts } from "@/components/shell/useAlerts";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { isSupabaseConfigured } from "@/lib/config";
import { fmtFull, isoDate, timeOf, useNow } from "@/lib/dates";
import { showToast } from "@/lib/toast";
import { habitLogs, habits } from "@/modules/growth/store";
import { notes } from "@/modules/knowledge/store";
import { events, taskTime, tasks } from "@/modules/my-day/store";
import { opportunities } from "@/modules/opportunities/store";
import { projects } from "@/modules/projects/store";
import { buildBriefing } from "./briefing";
import { aiMessages, askAi, briefings, splitActions, useAiStatus, type Proposed } from "./store";

const panel = "surface min-w-0 rounded-panel p-5 sm:p-6";
type Tab = "briefing" | "chat";

export function Assistant() {
  const [tab, setTab] = useState<Tab>("briefing");
  const ai = useAiStatus();
  return (
    <div className="mx-auto max-w-5xl">
      <PreviewBanner />
      <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-ink-2">Seu dia, suas pendências e o que fazer a seguir</p>
          <h1 className="text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">Assistant</h1>
        </div>
        <Segmented<Tab>
          label="Seção"
          value={tab}
          onChange={setTab}
          options={[
            { value: "briefing", label: "Briefing" },
            { value: "chat", label: "Conversa" },
          ]}
        />
      </header>
      {ai.state === "ready" && !ai.configured && <AiOffNotice />}
      {tab === "briefing" ? <BriefingView aiOn={ai.configured} /> : <ChatView aiOn={ai.configured} loading={ai.state === "loading"} />}
    </div>
  );
}

function AiOffNotice() {
  return (
    <div className="mb-5">
      <Notice>
        A IA ainda não está conectada. O briefing abaixo já funciona com regras e com os seus dados; o resumo escrito e a
        conversa entram quando você adicionar a chave. <Link href="/settings#assistente" className="text-ember underline underline-offset-4">Como conectar</Link>
      </Notice>
    </div>
  );
}

/* ───────── Briefing ───────── */
function BriefingView({ aiOn }: { aiOn: boolean }) {
  const now = useNow();
  const t = tasks.use();
  const e = events.use();
  const p = projects.use();
  const h = habits.use();
  const hl = habitLogs.use();
  const o = opportunities.use();
  const b = briefings.use();
  const alerts = useAlerts();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const ready = [t, e, p, h, hl, o].every((s) => s.status === "ready");
  if (!now || !ready) return <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-busy="true" aria-label="Carregando">{[0, 1, 2, 3].map((i) => <div key={i} className={`${panel} h-40 animate-pulse`} />)}</div>;

  const today = isoDate(now);
  const brief = buildBriefing({ today, now, tasks: t.items, events: e.items, projects: p.items, habits: h.items, habitLogs: hl.items });
  const saved = b.items.find((x) => x.day === today);
  const openOpps = o.items.filter((x) => x.status === "new" || x.status === "validating");

  async function writeSummary() {
    setBusy(true);
    setError(undefined);
    try {
      const content = await askAi({ mode: "briefing", today });
      if (saved) await briefings.update(saved.id, { content });
      else briefings.insert({ day: today, content });
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-panel p-5 sm:p-6" aria-labelledby="resumo">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="resumo" className="flex items-center gap-2 text-[19px] font-semibold">
            <Sparkles aria-hidden className="size-5 text-ember" />
            <span className="first-letter:uppercase">{fmtFull.format(now)}</span>
          </h2>
          {aiOn && (
            <Button variant="soft" onClick={writeSummary} pending={busy} pendingLabel="Escrevendo">
              {saved ? "Escrever de novo" : "Escrever resumo com IA"}
            </Button>
          )}
        </div>
        {error && <div className="mt-3"><Notice kind="error">{error}</Notice></div>}
        {saved ? (
          <p className="mt-3 whitespace-pre-line leading-relaxed">{saved.content}</p>
        ) : brief.suggestions.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {brief.suggestions.map((s) => (
              <li key={s} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ember" />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-ink-2">Dia sem pendências urgentes. Bom momento para avançar um projeto.</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className={panel} aria-labelledby="b-agenda">
          <h2 id="b-agenda" className="mb-3 flex items-center gap-2 text-[17px] font-semibold"><CalendarDays aria-hidden className="size-5 text-ink-2" />Hoje</h2>
          {brief.agenda.length === 0 ? <p className="text-ink-2">Nenhum compromisso restante hoje.</p> : (
            <ul className="divide-y divide-line">{brief.agenda.map((ev) => (
              <li key={ev.id} className="flex gap-3 py-2"><span className="w-16 shrink-0 tabular-nums text-ink-2">{ev.all_day ? "Dia todo" : timeOf(ev.starts_at)}</span><span className="truncate">{ev.title}</span></li>
            ))}</ul>
          )}
          <h3 className="mb-1 mt-4 text-[13px] font-medium text-ink-3">Prioridades</h3>
          {brief.priorities.length === 0 ? <p className="text-ink-2">Nenhuma tarefa pendente para hoje.</p> : (
            <ol className="space-y-1.5">{brief.priorities.map((x, i) => (
              <li key={x.id} className="flex gap-3"><span className="w-4 shrink-0 tabular-nums text-ember">{i + 1}</span><span className="min-w-0 flex-1 truncate">{x.title}</span>{taskTime(x) && <span className="tabular-nums text-ink-2">{taskTime(x)}</span>}</li>
            ))}</ol>
          )}
          <Link href="/my-day" className="press mt-4 inline-block text-[14px] text-ember">Abrir My Day</Link>
        </section>

        <section className={panel} aria-labelledby="b-atencao">
          <h2 id="b-atencao" className="mb-3 flex items-center gap-2 text-[17px] font-semibold"><CircleAlert aria-hidden className="size-5 text-ink-2" />Precisa de atenção</h2>
          {alerts.length === 0 ? <p className="text-ink-2">Nada atrasado ou vencendo.</p> : (
            <ul className="divide-y divide-line">{alerts.slice(0, 6).map((a) => (
              <li key={a.id} className="py-2"><span className={`block truncate font-medium ${a.tone === "urgent" ? "text-danger" : ""}`}>{a.title}</span><span className="block truncate text-[13px] text-ink-2">{a.detail}</span></li>
            ))}</ul>
          )}
        </section>

        <section className={panel} aria-labelledby="b-projetos">
          <h2 id="b-projetos" className="mb-3 flex items-center gap-2 text-[17px] font-semibold"><FolderKanban aria-hidden className="size-5 text-ink-2" />Projetos</h2>
          {brief.projectLines.length === 0 ? <p className="text-ink-2">Nenhum projeto ativo.</p> : (
            <ul className="space-y-3">{brief.projectLines.map((l) => (
              <li key={l.project.id}>
                <div className="flex items-baseline justify-between gap-3"><span className="truncate font-medium">{l.project.name}</span><span className="shrink-0 text-[13px] tabular-nums text-ink-2">{l.done} de {l.total}</span></div>
                <p className="truncate text-[13px] text-ink-2">{l.next ? `Próximo passo: ${l.next.title}` : "Sem próximo passo definido"}</p>
              </li>
            ))}</ul>
          )}
        </section>

        <section className={panel} aria-labelledby="b-habitos">
          <h2 id="b-habitos" className="mb-3 flex items-center gap-2 text-[17px] font-semibold"><Sprout aria-hidden className="size-5 text-ink-2" />Hábitos de hoje</h2>
          {h.items.filter((x) => !x.archived).length === 0 ? <p className="text-ink-2">Nenhum hábito cadastrado.</p> : brief.habitsLeft.length === 0 ? <p className="text-ok">Todos os hábitos de hoje marcados.</p> : (
            <ul className="space-y-1">{brief.habitsLeft.map((x) => <li key={x.id} className="truncate">{x.name}</li>)}</ul>
          )}
          <h3 className="mb-1 mt-4 flex items-center gap-1.5 text-[13px] font-medium text-ink-3"><Lightbulb aria-hidden className="size-3.5" />Oportunidades em aberto</h3>
          <p className="text-ink-2">{openOpps.length === 0 ? "Nenhuma oportunidade para avaliar." : `${openOpps.length} para avaliar.`} <Link href="/opportunities" className="text-ember">Ver</Link></p>
          <p className="mt-3 text-[13px] text-ink-3">Notícias do dia ficam em <Link href="/intelligence" className="text-ember">Intelligence</Link>.</p>
        </section>
      </div>
    </div>
  );
}

/* ───────── Conversa ───────── */
function ActionCard({ action }: { action: Proposed }) {
  const [done, setDone] = useState(false);
  const run = () => {
    if (action.kind === "tarefa") {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(action.extra) ? action.extra : null;
      tasks.insert({ title: action.title.slice(0, 200), notes: "", priority: "medium", due_date: date, due_time: null, remind_at: null, reminded_at: null, completed_at: null });
    } else {
      notes.insert({ title: action.title.slice(0, 200), body: action.extra.slice(0, 50000), kind: "note", category: "", tags: [], url: "", project_id: null, pinned: false });
    }
    setDone(true);
    showToast({ kind: "info", message: action.kind === "tarefa" ? "Tarefa criada no My Day" : "Nota criada no Knowledge" });
  };
  return (
    <div className="mt-2 flex items-center gap-3 rounded-item border border-line bg-field px-3 py-2 text-[14px]">
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-ink-3">{action.kind === "tarefa" ? `Criar tarefa${action.extra ? ` para ${action.extra}` : ""}` : "Criar nota"}</span>
        <span className="block truncate">{action.title}</span>
      </span>
      {done ? (
        <span className="flex items-center gap-1 text-ok"><Check aria-hidden className="size-4" />Criada</span>
      ) : (
        <button type="button" onClick={run} className="press shrink-0 rounded-full bg-ember px-3 py-1.5 text-[13px] font-semibold text-on-ember">Confirmar</button>
      )}
    </div>
  );
}

function ChatView({ aiOn, loading }: { aiOn: boolean; loading: boolean }) {
  const m = aiMessages.use();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const end = useRef<HTMLDivElement>(null);
  const count = m.items.length;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [count, busy]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const question = text.trim();
    if (!question || busy) return;
    setText("");
    setError(undefined);
    aiMessages.insert({ role: "user", content: question.slice(0, 4000) });
    const history = aiMessages.get().items.slice(-12).map((x) => ({ role: x.role, content: x.content.slice(0, 4000) }));
    setBusy(true);
    try {
      const reply = await askAi({ mode: "chat", today: isoDate(new Date()), messages: history });
      aiMessages.insert({ role: "assistant", content: reply.slice(0, 20000) });
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  function clearAll() {
    const all = aiMessages.get().items;
    for (const x of all) void aiMessages.remove(x.id);
    showToast({ kind: "info", message: "Conversa apagada", action: { label: "Desfazer", run: () => all.forEach((x) => void aiMessages.restore(x)) } });
  }

  const disabled = !aiOn || !isSupabaseConfigured;
  return (
    <section className={`${panel} flex min-h-[60dvh] flex-col`} aria-label="Conversa com o assistente">
      <div className="flex items-center justify-between gap-3 pb-3">
        <p className="text-[13px] text-ink-3">O assistente lê só os módulos liberados em <Link href="/settings#assistente" className="text-ember">Configurações</Link> e nunca age sem sua confirmação.</p>
        {count > 0 && (
          <button type="button" onClick={clearAll} aria-label="Apagar conversa" className="press flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-field"><Trash2 aria-hidden className="size-4" /></button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto" aria-live="polite">
        {m.status === "loading" || m.status === "idle" ? (
          <div className="h-24 animate-pulse rounded-item bg-field" />
        ) : count === 0 ? (
          <div className="py-8 text-ink-2">
            {disabled ? (
              <p>{!isSupabaseConfigured ? "A conversa precisa do banco de dados conectado." : loading ? "Verificando a IA…" : "A conversa abre quando a IA estiver conectada."}</p>
            ) : (
              <>
                <p className="mb-3">Pergunte sobre o seu dia, projetos, metas ou notas. Por exemplo:</p>
                <div className="flex flex-wrap gap-2">
                  {["O que eu deveria fazer primeiro hoje?", "Quais projetos estão parados?", "Resuma minhas notas desta semana"].map((q) => (
                    <button key={q} type="button" onClick={() => setText(q)} className="press rounded-full border border-line bg-field px-3 py-1.5 text-[14px] text-ink">{q}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          m.items.map((msg) => {
            const { text: body, actions } = msg.role === "assistant" ? splitActions(msg.content) : { text: msg.content, actions: [] };
            return (
              <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[85%] rounded-[20px] px-4 py-2.5 ${msg.role === "user" ? "bg-ember text-on-ember" : "bg-field"}`}>
                  <p className="whitespace-pre-line leading-relaxed">{body}</p>
                  {actions.map((a, i) => <ActionCard key={i} action={a} />)}
                </div>
              </div>
            );
          })
        )}
        {busy && <div className="w-fit animate-pulse rounded-[20px] bg-field px-4 py-2.5 text-ink-2">Pensando…</div>}
        {error && <Notice kind="error">{error}</Notice>}
        <div ref={end} />
      </div>

      <form onSubmit={send} className="mt-4 flex items-end gap-2">
        <label htmlFor="ask" className="sr-only">Pergunta</label>
        <textarea
          id="ask"
          rows={1}
          value={text}
          disabled={disabled}
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          placeholder={disabled ? "Disponível quando a IA estiver conectada" : "Pergunte algo"}
          className="max-h-40 min-h-12 flex-1 resize-none rounded-[24px] border border-line bg-field px-4 py-3 text-[16px] placeholder:text-ink-3 focus:border-ember focus:outline-none disabled:opacity-60"
        />
        <button type="submit" disabled={disabled || busy || !text.trim()} aria-label="Enviar" className="press flex size-12 shrink-0 items-center justify-center rounded-full bg-ember text-on-ember disabled:opacity-40">
          <ArrowUp aria-hidden className="size-5" strokeWidth={2.4} />
        </button>
      </form>
    </section>
  );
}
