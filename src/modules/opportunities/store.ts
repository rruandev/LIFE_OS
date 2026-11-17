"use client";

import { createCollection } from "@/lib/data/collection";

export type Difficulty = "low" | "medium" | "high";
export type DataStatus = "insufficient" | "partial" | "sufficient";
export type OppStatus = "new" | "validating" | "pursuing" | "discarded";

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  /** De onde veio a ideia (empresa, país, notícia, conversa). */
  origin: string;
  origin_url: string;
  problem: string;
  audience: string;
  brazil_fit: string;
  difficulty: Difficulty | null;
  costs_risks: string;
  next_steps: string;
  /** Dados e fontes que sustentam a oportunidade. */
  evidence: string;
  /** Quanto de dado real existe; "insufficient" deixa isso explícito na tela. */
  data_status: DataStatus;
  status: OppStatus;
  project_id: string | null;
  created_at: string;
};

export const opportunities = createCollection<Opportunity>("opportunities", "suas oportunidades");

export const DIFFICULTY: Record<Difficulty, string> = { low: "Baixa", medium: "Média", high: "Alta" };
export const DATA_STATUS: Record<DataStatus, string> = {
  insufficient: "Dados insuficientes",
  partial: "Dados parciais",
  sufficient: "Dados suficientes",
};
export const OPP_STATUS: Record<OppStatus, string> = {
  new: "Nova",
  validating: "Validando",
  pursuing: "Em execução",
  discarded: "Descartada",
};
