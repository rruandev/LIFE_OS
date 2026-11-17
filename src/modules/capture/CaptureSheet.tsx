"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { addDays, fromISODate, isoDate } from "@/lib/dates";
import { showToast } from "@/lib/toast";
import { requestOpen, type OpenKind } from "@/lib/ui";
import { notes } from "@/modules/knowledge/store";
import { events, tasks } from "@/modules/my-day/store";
import { classify, type CaptureType } from "./classify";

const TYPES: { value: CaptureType; label: string; where: string }[] = [
  { value: "task", label: "Tarefa", where: "My Day" },
  { value: "event", label: "Compromisso", where: "My Day" },
  { value: "note", label: "Nota", where: "Knowledge" },
  { value: "idea", label: "Ideia", where: "Knowledge" },
  { value: "link", label: "Link", where: "Knowledge" },
];

export function CaptureSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Captura rápida">
      {open && <CaptureForm onClose={onClose} />}
    </Sheet>
  );
}

function CaptureForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  // O formulário só existe com a folha aberta, a pedido da pessoa: aqui "hoje" é lido uma vez.
  const [today] = useState(() => isoDate(new Date()));
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<CaptureType | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const suggestion = classify(text, today);
  const type = picked ?? suggestion.type;
  const day = date ?? suggestion.date ?? (type === "event" ? today : "");
  const hour = time ?? suggestion.time ?? "09:00";
  const where = TYPES.find((t) => t.value === type)!;

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return setError("Escreva o que você quer guardar.");
    const [first, ...rest] = clean.split("\n");
    const title = first.slice(0, 200);
    const body = rest.join("\n").trim();
    let saved: { kind: OpenKind; id: string; href: string };

    if (type === "task") {
      const row = tasks.insert({
        title,
        notes: body,
        priority: "medium",
        due_date: day || null,
        due_time: day && suggestion.time ? suggestion.time : null,
        remind_at: null,
        reminded_at: null,
        completed_at: null,
      });
      saved = { kind: "task", id: row.id, href: "/my-day" };
    } else if (type === "event") {
      if (!day) return setError("Escolha o dia do compromisso.");
      const base = fromISODate(day);
      const [h, m] = hour.split(":").map(Number);
      const starts = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
      const row = events.insert({
        title,
        notes: body,
        location: "",
        starts_at: starts.toISOString(),
        ends_at: new Date(starts.getTime() + 3600_000).toISOString(),
        all_day: false,
        remind_at: null,
        reminded_at: null,
      });
      saved = { kind: "event", id: row.id, href: "/my-day" };
    } else {
      const url = type === "link" ? (suggestion.url ?? "") : "";
      if (type === "link" && !url) return setError("Para salvar como link, inclua o endereço começando com http:// ou https://.");
      const row = notes.insert({
        title: type === "link" ? (title.replace(url, "").trim() || url).slice(0, 200) : title,
        body,
        kind: type,
        category: "",
        tags: [],
        url,
        project_id: null,
        pinned: false,
      });
      saved = { kind: "note", id: row.id, href: "/knowledge" };
    }

    showToast({
      kind: "info",
      message: `${where.label} salva em ${where.where}`.replace("Compromisso salva", "Compromisso salvo").replace("Link salva", "Link salvo"),
      action: {
        label: "Abrir",
        run: () => {
          requestOpen(saved.kind, saved.id);
          router.push(saved.href);
        },
      },
    });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="capture-text" className="sr-only">
          O que você quer guardar
        </label>
        <textarea
          id="capture-text"
          autoFocus
          rows={4}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          placeholder="Uma tarefa, um compromisso, uma ideia, um link…"
          className="w-full resize-y rounded-item border border-line bg-field px-4 py-3 text-[16px] placeholder:text-ink-3 focus:border-ember focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-1.5 text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-[13px] text-ink-2">
          {text.trim() ? (
            <>
              Sugestão: <strong className="font-semibold text-ink">{TYPES.find((t) => t.value === suggestion.type)!.label}</strong>, porque{" "}
              {suggestion.reason}.
            </>
          ) : (
            "Salvar como"
          )}
        </p>
        <div role="radiogroup" aria-label="Tipo" className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => setPicked(t.value)}
              className={`press h-10 rounded-full border px-4 text-[14px] ${
                type === t.value ? "border-transparent bg-ember font-semibold text-on-ember" : "border-line bg-field text-ink-2"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(type === "task" || type === "event") && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={type === "task" ? "Prazo (opcional)" : "Dia"}
            type="date"
            value={day}
            onChange={(e) => setDate(e.target.value)}
            min={type === "event" ? addDays(today, -365) : undefined}
          />
          {type === "event" && <Field label="Início" type="time" value={hour} onChange={(e) => setTime(e.target.value)} />}
        </div>
      )}

      <p className="text-[13px] text-ink-3">
        A sugestão usa regras simples de texto. A classificação por IA entra na Fase 3.
      </p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-ink-2">Vai para {where.where}</span>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
