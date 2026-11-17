import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "@/modules/intelligence/store";

/**
 * Leitura de feeds RSS 2.0, RSS 1.0 (RDF) e Atom. Funções puras, sem rede:
 * quem busca o feed é `feed.ts` (só no servidor).
 */

export type FeedSource = { name: string; url: string; topic: string };

const MAX_ITEMS_PER_FEED = 40;
const MAX_EXCERPT = 280;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
});

type Node = Record<string, unknown>;

const isNode = (v: unknown): v is Node => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

/** Texto de um nó, com ou sem atributos (`{ "#text": ..., "@_type": ... }`). */
function text(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (isNode(v)) return text(v["#text"]);
  return "";
}

const attr = (v: unknown, name: string) => (isNode(v) ? text(v[`@_${name}`]) : "");

/** Hash estável (cyrb53) em base 36: o mesmo link gera sempre o mesmo id. */
export function hashId(s: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
};

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    }
    return NAMED[code.toLowerCase()] ?? whole;
  });
}

/** HTML para texto corrido: sem tags, entidades decodificadas, espaços colapsados. */
export function htmlToText(html: string) {
  const stripped = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

function clip(s: string, max: number) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** Só aceita http/https; resolve endereços relativos a partir do feed. */
function absoluteUrl(raw: string, base: string): string | null {
  const value = decodeEntities(raw.trim());
  if (!value) return null;
  try {
    const u = new URL(value, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function toISO(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

const looksLikeImage = (url: string) => /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(url);

function firstImgInHtml(html: string, base: string) {
  const m = /<img\b[^>]*?\ssrc\s*=\s*["']([^"']+)["']/i.exec(html);
  return m ? absoluteUrl(m[1], base) : null;
}

function pickImage(entry: Node, html: string[], base: string): string | null {
  const groups = list(entry["media:group"]).filter(isNode);
  const media = [...list(entry["media:content"]), ...groups.flatMap((g) => list(g["media:content"]))];
  for (const m of media) {
    const url = attr(m, "url");
    const type = attr(m, "type");
    const medium = attr(m, "medium");
    const isImage = type ? type.startsWith("image") : medium ? medium === "image" : looksLikeImage(url);
    const abs = isImage && url ? absoluteUrl(url, base) : null;
    if (abs) return abs;
  }
  const thumbs = [...list(entry["media:thumbnail"]), ...groups.flatMap((g) => list(g["media:thumbnail"]))];
  for (const t of thumbs) {
    const abs = absoluteUrl(attr(t, "url"), base);
    if (abs) return abs;
  }
  const enclosures = [...list(entry.enclosure), ...list(entry.link).filter((l) => attr(l, "rel") === "enclosure")];
  for (const e of enclosures) {
    const url = attr(e, "url") || attr(e, "href");
    if (!attr(e, "type").startsWith("image")) continue;
    const abs = absoluteUrl(url, base);
    if (abs) return abs;
  }
  for (const h of html) {
    const abs = firstImgInHtml(h, base);
    if (abs) return abs;
  }
  return null;
}

function atomLink(entry: Node, base: string) {
  const links = list(entry.link);
  const alternate =
    links.find((l) => isNode(l) && (attr(l, "rel") === "" || attr(l, "rel") === "alternate") && attr(l, "href")) ??
    links.find((l) => isNode(l) && attr(l, "href"));
  if (alternate) return absoluteUrl(attr(alternate, "href"), base);
  // Alguns feeds misturam: <link>texto</link> dentro de entry.
  const plain = links.map(text).find(Boolean);
  return plain ? absoluteUrl(plain, base) : null;
}

function rssLink(entry: Node, base: string) {
  const plain = list(entry.link).map(text).find(Boolean);
  if (plain) return absoluteUrl(plain, base);
  const href = list(entry.link).map((l) => attr(l, "href")).find(Boolean) ?? "";
  if (href) return absoluteUrl(href, base);
  const guid = entry.guid;
  if (guid !== undefined && attr(guid, "isPermaLink") !== "false") return absoluteUrl(text(guid), base);
  return null;
}

/** Lê o XML de um feed e devolve as notícias. Lança erro se não for RSS nem Atom. */
export function parseFeed(xml: string, source: FeedSource): NewsItem[] {
  let doc: Node;
  try {
    doc = parser.parse(xml) as Node;
  } catch {
    throw new Error("not-a-feed");
  }
  const rss = isNode(doc.rss) ? doc.rss : null;
  const rdf = isNode(doc["rdf:RDF"]) ? doc["rdf:RDF"] : null;
  const atom = isNode(doc.feed) ? doc.feed : null;

  let entries: unknown[];
  let kind: "rss" | "atom";
  if (rss) {
    const channel = list(rss.channel).find(isNode);
    entries = channel ? list(channel.item) : [];
    kind = "rss";
  } else if (rdf) {
    entries = list(rdf.item);
    kind = "rss";
  } else if (atom) {
    entries = list(atom.entry);
    kind = "atom";
  } else {
    throw new Error("not-a-feed");
  }

  const base = source.url;
  const items: NewsItem[] = [];
  for (const entry of entries) {
    if (!isNode(entry) || items.length >= MAX_ITEMS_PER_FEED) continue;
    const link = kind === "atom" ? atomLink(entry, base) : rssLink(entry, base);
    const title = htmlToText(text(entry.title));
    if (!link || !title) continue;

    const html =
      kind === "atom"
        ? [text(entry.summary), text(entry.content)]
        : [text(entry.description), text(entry["content:encoded"])];
    const body = html.map(htmlToText).find(Boolean) ?? "";
    const published =
      toISO(text(entry.pubDate)) ??
      toISO(text(entry.published)) ??
      toISO(text(entry.updated)) ??
      toISO(text(entry["dc:date"]));

    items.push({
      id: hashId(link),
      title: clip(title, 300),
      link,
      source: source.name,
      topic: source.topic,
      published,
      image: pickImage(entry, html.filter(Boolean), base),
      excerpt: clip(body === title ? "" : body, MAX_EXCERPT),
    });
  }
  return items;
}

/** Título comparável: minúsculas, sem acentos e sem pontuação. */
export function normaliseTitle(title: string) {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Tira repetidas (mesmo link ou mesmo título) e ordena das mais novas para as mais antigas. */
export function dedupe(items: NewsItem[]): NewsItem[] {
  const ids = new Set<string>();
  const titles = new Set<string>();
  const out: NewsItem[] = [];
  const sorted = [...items].sort((a, b) => {
    if (a.published === b.published) return 0;
    if (!a.published) return 1;
    if (!b.published) return -1;
    return a.published < b.published ? 1 : -1;
  });
  for (const item of sorted) {
    const key = normaliseTitle(item.title);
    if (ids.has(item.id) || (key && titles.has(key))) continue;
    ids.add(item.id);
    if (key) titles.add(key);
    out.push(item);
  }
  return out;
}
