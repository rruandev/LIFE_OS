"use client";

import { ExternalLink, Newspaper, RefreshCw, Rss, Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { fmtShort, useNow } from "@/lib/dates";
import { SourcesManager } from "./Sources";
import { newsSources, type NewsItem, type NewsSource } from "./store";

const panel = "surface min-w-0 rounded-panel p-5 sm:p-6";
const ALL = "__all";

type FeedError = { source: string; message: string };
type FeedResult = { items: NewsItem[]; errors: FeedError[]; preview: boolean; failure: string | null };
type Feed = FeedResult & { key: string };

/** Busca as notícias no servidor. Nunca lança: falhas voltam como `failure`. */
async function fetchNews(refresh = false): Promise<FeedResult> {
  const empty = { items: [], errors: [], preview: false };
  try {
    const res = await fetch(refresh ? "/api/news?refresh=1" : "/api/news", { cache: "no-store" });
    const body = (await res.json().catch(() => null)) as
      | { items?: NewsItem[]; errors?: FeedError[]; preview?: boolean; error?: string }
      | null;
    if (!res.ok || !body || !Array.isArray(body.items)) {
      return { ...empty, failure: body?.error ?? "Não foi possível carregar as notícias agora." };
    }
    return { items: body.items, errors: body.errors ?? [], preview: Boolean(body.preview), failure: null };
  } catch {
    return { ...empty, failure: "Sem conexão com o servidor. Confira sua internet." };
  }
}

/** Muda quando muda o que o servidor vai ler: fontes ligadas, endereço, nome ou tema. */
const sourcesKey = (sources: NewsSource[]) =>
  sources
    .filter((s) => s.enabled)
    .map((s) => `${s.id}|${s.url}|${s.name}|${s.topic}`)
    .sort()
    .join("\n");

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function ago(iso: string | null, now: Date) {
  if (!iso) return null;
  const d = new Date(iso);
  const min = Math.round((now.getTime() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return fmtShort.format(d);
}

export function Intelligence() {
  const now = useNow();
  const sourceState = newsSources.use();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [topic, setTopic] = useState(ALL);
  const [query, setQuery] = useState("");

  const sources = sourceState.items;
  const ready = sourceState.status === "ready";
  const enabled = sources.filter((s) => s.enabled);
  const key = sourcesKey(sources);
  const hasEnabled = enabled.length > 0;

  // Busca ao abrir e sempre que as fontes ligadas mudam. O estado só muda depois da resposta.
  useEffect(() => {
    if (!ready || !hasEnabled) return;
    let alive = true;
    void fetchNews().then((r) => {
      if (alive) setFeed({ ...r, key });
    });
    return () => {
      alive = false;
    };
  }, [ready, hasEnabled, key]);

  function refresh() {
    const at = key;
    setRefreshing(true);
    void fetchNews(true).then((r) => {
      setFeed({ ...r, key: at });
      setRefreshing(false);
    });
  }

  const topics = useMemo(() => {
    const seen: string[] = [];
    for (const s of sources) if (s.enabled && !seen.includes(s.topic)) seen.push(s.topic);
    return seen;
  }, [sources]);
  const allTopics = useMemo(() => [...new Set(sources.map((s) => s.topic))].sort((a, b) => a.localeCompare(b, "pt-BR")), [sources]);
  const activeTopic = topic === ALL || topics.includes(topic) ? topic : ALL;

  const visible = useMemo(() => {
    if (!feed) return [];
    const q = fold(query.trim());
    return feed.items.filter(
      (i) =>
        (activeTopic === ALL || i.topic === activeTopic) && (!q || fold(i.title).includes(q) || fold(i.excerpt).includes(q)),
    );
  }, [feed, activeTopic, query]);

  const stale = Boolean(feed && feed.key !== key && hasEnabled);
  const busy = refreshing || stale;

  const header = (
    <header className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-ink-2">Notícias das suas fontes</p>
        <h1 className="text-[34px] font-light leading-tight tracking-tight sm:text-[44px]">Intelligence</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="soft"
          onClick={refresh}
          pending={busy}
          pendingLabel="Atualizando"
          disabled={!ready || !hasEnabled}
          className="h-10 px-4"
        >
          <RefreshCw aria-hidden className="size-4" />
          Atualizar
        </Button>
        <Button onClick={() => setSheet(true)} className="h-10 px-4">
          <Rss aria-hidden className="size-4" />
          Fontes
        </Button>
      </div>
    </header>
  );

  let body: ReactNode;
  if (!now || sourceState.status === "idle" || sourceState.status === "loading") {
    body = <Loading />;
  } else if (sourceState.error) {
    body = (
      <div className="space-y-3">
        <Notice kind="error">{sourceState.error}</Notice>
        <Button variant="soft" onClick={() => void newsSources.load(true)}>
          Tentar de novo
        </Button>
      </div>
    );
  } else if (!hasEnabled) {
    body = (
      <section className={`${panel} flex flex-col items-start gap-4`}>
        <Newspaper aria-hidden className="size-8 text-ember" />
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">Escolha de onde vêm suas notícias</h2>
          <p className="mt-2 max-w-prose text-ink-2">
            {sources.length === 0
              ? "Adicione os sites que você acompanha. As notícias chegam direto dos feeds deles, separadas por tema."
              : "Todas as suas fontes estão desligadas. Ligue pelo menos uma para ver as notícias."}
          </p>
        </div>
        <Button onClick={() => setSheet(true)}>
          <Rss aria-hidden className="size-4" />
          Fontes
        </Button>
      </section>
    );
  } else if (!feed) {
    body = <Loading />;
  } else if (feed.failure) {
    body = (
      <div className="space-y-3">
        <Notice kind="error">{feed.failure}</Notice>
        <Button variant="soft" onClick={refresh} pending={refreshing}>
          Tentar de novo
        </Button>
      </div>
    );
  } else if (feed.preview) {
    body = (
      <Notice>
        As fontes ficam salvas, mas os feeds só são lidos quando o banco de dados estiver conectado. Depois disso as notícias
        aparecem aqui.
      </Notice>
    );
  } else {
    body = (
      <News
        feed={feed}
        visible={visible}
        topics={topics}
        topic={activeTopic}
        onTopic={setTopic}
        query={query}
        onQuery={setQuery}
        now={now}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PreviewBanner />
      {header}
      {body}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Fontes">
        <SourcesManager sources={sources} topics={allTopics} />
      </Sheet>
    </div>
  );
}

function News({
  feed,
  visible,
  topics,
  topic,
  onTopic,
  query,
  onQuery,
  now,
}: {
  feed: Feed;
  visible: NewsItem[];
  topics: string[];
  topic: string;
  onTopic: (t: string) => void;
  query: string;
  onQuery: (q: string) => void;
  now: Date;
}) {
  const hero = visible.find((i) => i.image) ?? visible[0] ?? null;
  const rails = useMemo(() => {
    const rest = visible.filter((i) => i.id !== hero?.id);
    const order = [...topics, ...rest.map((i) => i.topic).filter((t) => !topics.includes(t))];
    return [...new Set(order)]
      .map((t) => ({ topic: t, items: rest.filter((i) => i.topic === t) }))
      .filter((r) => r.items.length > 0);
  }, [visible, topics, hero]);

  return (
    <div className="grid grid-cols-1 gap-6">
      {feed.errors.length > 0 && (
        <Notice kind="error">
          <p>Algumas fontes não puderam ser lidas:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {feed.errors.map((e, i) => (
              <li key={`${i}-${e.source}`}>{e.message}</li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {topics.length > 1 && (
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-max">
              <Segmented<string>
                label="Tema"
                value={topic}
                onChange={onTopic}
                options={[{ value: ALL, label: "Tudo" }, ...topics.map((t) => ({ value: t, label: t }))]}
              />
            </div>
          </div>
        )}
        <label className="relative block min-w-0 lg:w-72">
          <span className="sr-only">Buscar nas notícias</span>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar nas notícias"
            className="h-11 w-full rounded-full border border-line bg-field pl-10 pr-4 text-[15px] text-ink placeholder:text-ink-3 transition focus:border-ember focus:outline-none"
          />
        </label>
      </div>

      {feed.items.length === 0 ? (
        <section className={panel}>
          <p className="text-ink-2">Suas fontes não trouxeram notícias agora. Tente atualizar daqui a pouco.</p>
        </section>
      ) : visible.length === 0 ? (
        <section className={panel}>
          <p className="text-ink-2">Nada encontrado com esse filtro.</p>
        </section>
      ) : (
        <>
          {hero && <Hero item={hero} now={now} />}
          <Notice>
            Resumo por IA e motivo de relevância aparecem quando a IA for conectada. Por enquanto você vê o trecho original de
            cada fonte.
          </Notice>
          {rails.map((r) => (
            <Rail key={r.topic} topic={r.topic} items={r.items} now={now} />
          ))}
        </>
      )}
    </div>
  );
}

function Meta({ item, now, className = "" }: { item: NewsItem; now: Date; className?: string }) {
  const when = ago(item.published, now);
  return (
    <p className={`truncate text-[13px] ${className}`}>
      {item.source}
      {when && (
        <>
          {" · "}
          <time dateTime={item.published ?? undefined}>{when}</time>
        </>
      )}
    </p>
  );
}

/** Imagem remota que some sozinha se não carregar. */
function Thumb({ src, className }: { src: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={className} />
  );
}

function Hero({ item, now }: { item: NewsItem; now: Date }) {
  if (!item.image) {
    return (
      <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass min-w-0 rounded-panel p-6 sm:p-8">
        <Meta item={item} now={now} className="text-ink-2" />
        <h2 className="mt-2 line-clamp-4 text-[24px] font-semibold leading-tight tracking-tight sm:text-[32px]">{item.title}</h2>
        {item.excerpt && (
          <p className="mt-3 line-clamp-3 max-w-prose text-ink-2">
            <span className="sr-only">Trecho da fonte: </span>
            {item.excerpt}
          </p>
        )}
        <ReadLink href={item.link} />
      </motion.article>
    );
  }
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative isolate min-w-0 overflow-hidden rounded-panel bg-field"
    >
      <Thumb src={item.image} className="absolute inset-0 -z-10 size-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/55 to-black/5" />
      <div className="flex min-h-[340px] flex-col justify-end p-6 text-white sm:min-h-[420px] sm:p-8">
        <Meta item={item} now={now} className="text-white/75" />
        <h2 className="mt-2 line-clamp-4 max-w-3xl text-[24px] font-semibold leading-tight tracking-tight sm:text-[34px]">
          {item.title}
        </h2>
        {item.excerpt && (
          <p className="mt-3 line-clamp-2 max-w-2xl text-[15px] text-white/80">
            <span className="sr-only">Trecho da fonte: </span>
            {item.excerpt}
          </p>
        )}
        <ReadLink href={item.link} />
      </div>
    </motion.article>
  );
}

function ReadLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="press mt-5 inline-flex h-11 items-center gap-2 self-start rounded-full bg-ember px-5 text-[15px] font-semibold text-on-ember hover:brightness-110"
    >
      Ler na fonte
      <ExternalLink aria-hidden className="size-4" />
    </a>
  );
}

function Rail({ topic, items, now }: { topic: string; items: NewsItem[]; now: Date }) {
  return (
    <section aria-label={topic} className="min-w-0">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="truncate text-[19px] font-semibold">{topic}</h2>
        <span className="text-[13px] text-ink-3">
          {items.length} {items.length === 1 ? "notícia" : "notícias"}
        </span>
      </div>
      <ul className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3">
        {items.map((item) => (
          <li key={item.id} className="w-[min(280px,78vw)] shrink-0 snap-start">
            <Card item={item} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Card({ item, now }: { item: NewsItem; now: Date }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="press surface flex h-full min-w-0 flex-col overflow-hidden rounded-panel transition hover:border-ember"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 bg-field">
        <Newspaper aria-hidden className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-ink-3" />
        {item.image && <Thumb src={item.image} className="relative size-full object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-3 text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
        <Meta item={item} now={now} className="text-ink-3" />
        {item.excerpt && (
          <div className="mt-auto">
            <p className="text-[12px] font-medium text-ink-3">Trecho da fonte</p>
            <p className="line-clamp-2 text-[14px] text-ink-2">{item.excerpt}</p>
          </div>
        )}
      </div>
    </a>
  );
}

function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6" aria-busy="true" aria-label="Carregando notícias">
      <div className="h-[340px] animate-pulse rounded-panel bg-field sm:h-[420px]" />
      {[0, 1].map((r) => (
        <div key={r} className="min-w-0">
          <div className="mb-3 h-6 w-40 animate-pulse rounded-full bg-field" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((c) => (
              <div key={c} className="h-72 w-[min(280px,78vw)] shrink-0 animate-pulse rounded-panel bg-field" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
