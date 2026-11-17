"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { showToast } from "@/lib/toast";
import { newsSources, type NewsSource } from "./store";

const SUGGESTIONS: { name: string; url: string; topic: string }[] = [
  { name: "g1", url: "https://g1.globo.com/rss/g1/", topic: "Brasil" },
  { name: "g1 Economia", url: "https://g1.globo.com/rss/g1/economia/", topic: "Economia" },
  { name: "g1 Tecnologia", url: "https://g1.globo.com/rss/g1/tecnologia/", topic: "Tecnologia" },
  { name: "BBC News Brasil", url: "https://feeds.bbci.co.uk/portuguese/rss.xml", topic: "Mundo" },
  { name: "InfoMoney", url: "https://www.infomoney.com.br/feed/", topic: "Mercado" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", topic: "Tecnologia e IA" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", topic: "Tecnologia e IA" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", topic: "Inovação" },
];

/** Endereço comparável: sem barra final, sem diferença de maiúsculas no domínio. */
export function sameFeed(a: string, b: string) {
  const norm = (s: string) => s.trim().replace(/\/+$/, "").replace(/^https?:\/\//i, "").toLowerCase();
  return norm(a) === norm(b);
}

function isHttpUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function removeSource(source: NewsSource) {
  void newsSources.remove(source.id);
  showToast({
    kind: "info",
    message: "Fonte excluída",
    action: { label: "Desfazer", run: () => void newsSources.restore(source) },
  });
}

export function SourcesManager({ sources, topics }: { sources: NewsSource[]; topics: string[] }) {
  const listId = useId();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [errors, setErrors] = useState<{ name?: string; url?: string; topic?: string }>({});
  const suggestions = SUGGESTIONS.filter((s) => !sources.some((x) => sameFeed(x.url, s.url)));

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const cleanName = name.trim();
    const cleanUrl = url.trim();
    const cleanTopic = topic.trim();
    if (!cleanName) next.name = "Dê um nome para a fonte.";
    else if (cleanName.length > 80) next.name = "Use até 80 caracteres.";
    if (!cleanUrl) next.url = "Cole o endereço do feed.";
    else if (!isHttpUrl(cleanUrl)) next.url = "Use um endereço completo, começando com http:// ou https://.";
    else if (cleanUrl.length > 2000) next.url = "Endereço longo demais.";
    else if (sources.some((s) => sameFeed(s.url, cleanUrl))) next.url = "Essa fonte já está na lista.";
    if (cleanTopic.length > 40) next.topic = "Use até 40 caracteres.";
    setErrors(next);
    if (Object.keys(next).length) return;
    newsSources.insert({ name: cleanName, url: cleanUrl, topic: cleanTopic || "Geral", enabled: true });
    setName("");
    setUrl("");
    setTopic("");
  }

  return (
    <div className="space-y-7">
      <section aria-label="Suas fontes">
        {sources.length === 0 ? (
          <p className="text-[14px] text-ink-2">Nenhuma fonte ainda. Adicione uma abaixo ou escolha uma sugestão.</p>
        ) : (
          <ul className="divide-y divide-line rounded-item border border-line">
            {sources.map((s) => (
              <li key={s.id} className="flex min-w-0 items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[15px] font-medium ${s.enabled ? "text-ink" : "text-ink-3"}`}>{s.name}</p>
                  <p className="truncate text-[13px] text-ink-3">
                    {s.topic} · {hostOf(s.url)}
                  </p>
                </div>
                <Switch
                  checked={s.enabled}
                  onChange={(enabled) => void newsSources.update(s.id, { enabled })}
                  label={`${s.enabled ? "Desligar" : "Ligar"} ${s.name}`}
                />
                <button
                  type="button"
                  aria-label={`Excluir ${s.name}`}
                  onClick={() => removeSource(s)}
                  className="press flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-field hover:text-danger"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={submit} noValidate className="space-y-4" aria-label="Adicionar fonte">
        <h3 className="text-[17px] font-semibold">Adicionar fonte</h3>
        <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} error={errors.name} placeholder="Ex.: g1" />
        <Field
          label="Endereço do feed"
          type="url"
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
          placeholder="https://site.com/feed"
          hint="Endereço RSS ou Atom do site."
        />
        <Field
          label="Tema"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={40}
          list={listId}
          error={errors.topic}
          placeholder="Geral"
        />
        <datalist id={listId}>
          {topics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <Button type="submit">
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          Adicionar
        </Button>
      </form>

      {suggestions.length > 0 && (
        <section aria-label="Sugestões" className="space-y-3">
          <div>
            <h3 className="text-[17px] font-semibold">Sugestões</h3>
            <p className="mt-1 text-[13px] text-ink-3">Confira se o feed abre; sites mudam seus endereços.</p>
          </div>
          <ul className="divide-y divide-line rounded-item border border-line">
            {suggestions.map((s) => (
              <li key={s.url} className="flex min-w-0 items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{s.name}</p>
                  <p className="truncate text-[13px] text-ink-3">
                    {s.topic} · {hostOf(s.url)}
                  </p>
                </div>
                <Button
                  variant="soft"
                  className="h-9 px-4 text-[14px]"
                  aria-label={`Adicionar ${s.name}`}
                  onClick={() => newsSources.insert({ ...s, enabled: true })}
                >
                  Adicionar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
