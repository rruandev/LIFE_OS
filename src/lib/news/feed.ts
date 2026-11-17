import "server-only";

import { lookup } from "node:dns/promises";
import type { NewsItem } from "@/modules/intelligence/store";
import { dedupe, parseFeed, type FeedSource } from "./parse";

export { dedupe, parseFeed, type FeedSource };

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TTL_MS = 10 * 60 * 1000;
const MAX_CACHE = 300;
const USER_AGENT = "LifeOS/1.0 (+personal reader)";

/** Motivo de falha já em português, para mostrar ao usuário. */
export class FeedError extends Error {}

function isPrivateIPv4(host: string) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

const isIPv4Literal = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

/** Só http/https e nunca endereços da rede local (evita usar o servidor para sondar a rede interna). */
export function isSafeFeedUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (host === "0.0.0.0") return false;
  // Literais IPv6 aparecem entre colchetes; nenhum é aceito.
  if (host.startsWith("[") || host.includes(":")) return false;
  if (isPrivateIPv4(host)) return false;
  // Formas numéricas estranhas (ex.: 2130706433, 0x7f.1) que o URL não normalizou.
  if (/^[0-9.]+$/.test(host) && !isIPv4Literal(host)) return false;
  if (/^0x[0-9a-f]+/i.test(host)) return false;
  return true;
}

/** Confere também para onde o nome aponta: um domínio público pode resolver para a rede interna. */
async function resolvesSafely(url: string) {
  const host = new URL(url).hostname;
  if (isIPv4Literal(host)) return !isPrivateIPv4(host);
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => (a.family === 4 ? !isPrivateIPv4(a.address) : !isPrivateIPv6(a.address)));
  } catch {
    throw new FeedError("o endereço não foi encontrado.");
  }
}

function isPrivateIPv6(addr: string) {
  const a = addr.toLowerCase();
  if (a === "::" || a === "::1") return true;
  if (a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe8") || a.startsWith("fe9") || a.startsWith("fea") || a.startsWith("feb")) return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(a);
  return mapped ? isPrivateIPv4(mapped[1]) : false;
}

async function readCapped(res: Response): Promise<Uint8Array> {
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) throw new FeedError("o feed é grande demais.");
  if (!res.body) return new Uint8Array(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new FeedError("o feed é grande demais.");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/** Respeita o charset do cabeçalho ou da declaração XML (muitos sites brasileiros usam ISO-8859-1). */
function decode(bytes: Uint8Array, contentType: string) {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 200));
  const label =
    /charset=["']?([\w-]+)/i.exec(contentType)?.[1] ?? /<\?xml[^>]*encoding=["']([\w-]+)["']/i.exec(head)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

async function download(url: string): Promise<string> {
  let current = url;
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isSafeFeedUrl(current) || !(await resolvesSafely(current))) throw new FeedError("o endereço não é permitido.");
    let res: Response;
    try {
      res = await fetch(current, {
        signal,
        redirect: "manual",
        cache: "no-store",
        headers: {
          "user-agent": USER_AGENT,
          accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5",
        },
      });
    } catch {
      throw new FeedError("o endereço não respondeu.");
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) throw new FeedError("o endereço não respondeu.");
      current = new URL(next, current).href;
      continue;
    }
    if (res.status === 401 || res.status === 403) throw new FeedError(`o site recusou o acesso (erro ${res.status}).`);
    if (res.status === 404 || res.status === 410) throw new FeedError("o endereço não existe mais (erro 404).");
    if (!res.ok) throw new FeedError(`o site respondeu com erro ${res.status}.`);
    let bytes: Uint8Array;
    try {
      bytes = await readCapped(res);
    } catch (e) {
      if (e instanceof FeedError) throw e;
      throw new FeedError("o endereço não respondeu.");
    }
    return decode(bytes, res.headers.get("content-type") ?? "");
  }
  throw new FeedError("o endereço redireciona demais.");
}

const cache = new Map<string, { at: number; items: NewsItem[] }>();

/**
 * Busca e lê um feed. Guarda o resultado por 10 minutos por endereço;
 * `maxAge` menor força uma leitura nova (botão "Atualizar").
 */
export async function fetchFeed(source: FeedSource, maxAge = TTL_MS): Promise<NewsItem[]> {
  const hit = cache.get(source.url);
  const age = hit ? Date.now() - hit.at : Infinity;
  let items: NewsItem[];
  if (hit && age < Math.min(maxAge, TTL_MS)) {
    items = hit.items;
  } else {
    const xml = await download(source.url);
    try {
      items = parseFeed(xml, source);
    } catch {
      throw new FeedError("o conteúdo não é um feed RSS ou Atom.");
    }
    if (cache.size >= MAX_CACHE) {
      for (const [key, value] of cache) if (Date.now() - value.at >= TTL_MS) cache.delete(key);
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
    }
    cache.set(source.url, { at: Date.now(), items });
  }
  // O mesmo endereço pode ter nome e tema diferentes para cada pessoa.
  return items.map((i) => ({ ...i, source: source.name, topic: source.topic }));
}
