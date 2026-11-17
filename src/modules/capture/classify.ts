import { addDays } from "@/lib/dates";

export type CaptureType = "task" | "event" | "note" | "idea" | "link";
export type Suggestion = {
  type: CaptureType;
  /** Por que essa sugestão, em palavras simples. */
  reason: string;
  date: string | null;
  time: string | null;
  url: string | null;
};

const URL = /https?:\/\/[^\s]+/i;
const TIME = /\b(?:às\s*)?(\d{1,2})(?:h(\d{2})?|:(\d{2}))\b/i;
const EVENT_WORDS = /\b(reuni[aã]o|consulta|call|encontro|compromisso|almo[cç]o com|jantar com|entrevista|aula|prova|visita)\b/i;
const IDEA_WORDS = /^(ideia|id[eé]ia|e se\b|neg[oó]cio:|oportunidade)/i;
const TASK_VERBS =
  /^(comprar|ligar|pagar|enviar|mandar|fazer|marcar|lembrar|agendar|estudar|revisar|terminar|finalizar|criar|responder|buscar|levar|pegar|resolver|cancelar|renovar|entregar|montar|gravar|editar|postar|publicar|limpar|arrumar|organizar|preparar|treinar|ler)\b/i;

/**
 * Sugere o tipo do que foi escrito usando regras simples de texto.
 * Não é IA: a classificação por IA entra na Fase 3. A pessoa sempre pode trocar.
 */
export function classify(text: string, today: string): Suggestion {
  const t = text.trim();
  const url = t.match(URL)?.[0] ?? null;
  const time = t.match(TIME);
  const hhmm = time ? `${time[1].padStart(2, "0")}:${time[2] ?? time[3] ?? "00"}` : null;
  const validTime = hhmm && Number(hhmm.slice(0, 2)) < 24 && Number(hhmm.slice(3)) < 60 ? hhmm : null;

  let date: string | null = null;
  if (/\bdepois de amanh[aã]\b/i.test(t)) date = addDays(today, 2);
  else if (/\bamanh[aã]\b/i.test(t)) date = addDays(today, 1);
  else if (/\bhoje\b/i.test(t)) date = today;
  else {
    const dm = t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (dm && Number(dm[1]) >= 1 && Number(dm[1]) <= 31 && Number(dm[2]) >= 1 && Number(dm[2]) <= 12) {
      const candidate = `${today.slice(0, 4)}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
      date = candidate < today ? `${Number(today.slice(0, 4)) + 1}${candidate.slice(4)}` : candidate;
    }
  }

  const base = { date, time: validTime, url };
  if (url && t.replace(URL, "").trim().length < 80) return { ...base, type: "link", reason: "tem um endereço de site" };
  if (IDEA_WORDS.test(t)) return { ...base, type: "idea", reason: "começa como uma ideia" };
  if (EVENT_WORDS.test(t) || (validTime && date)) return { ...base, type: "event", reason: validTime ? "tem dia e horário" : "parece um compromisso" };
  if (TASK_VERBS.test(t) || date) return { ...base, type: "task", reason: date ? "tem uma data" : "começa com uma ação" };
  return { ...base, type: "note", reason: "parece uma anotação" };
}
