"use client";

import { createCollection } from "@/lib/data/collection";

export type NewsSource = {
  id: string;
  name: string;
  /** Endereço do feed RSS ou Atom. */
  url: string;
  topic: string;
  enabled: boolean;
  created_at: string;
};

/** Notícia lida de um feed. Não é guardada no banco: vem sempre da fonte. */
export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  topic: string;
  published: string | null;
  image: string | null;
  excerpt: string;
};

export const newsSources = createCollection<NewsSource>("news_sources", "suas fontes de notícias");
