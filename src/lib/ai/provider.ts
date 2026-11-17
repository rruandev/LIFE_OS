import "server-only";

/**
 * Ligação com o modelo de IA. Fica só no servidor: a chave nunca chega ao navegador.
 * Configure no .env.local (ou na Vercel):
 *   AI_PROVIDER=anthropic | openai | gemini
 *   AI_API_KEY=...
 *   AI_MODEL=...   (opcional para anthropic e openai; obrigatório para gemini)
 */
export type Provider = "anthropic" | "openai" | "gemini";
export type ChatTurn = { role: "user" | "assistant"; content: string };

const DEFAULT_MODEL: Partial<Record<Provider, string>> = {
  anthropic: "claude-haiku-5-5",
  openai: "gpt-5.4-mini",
};

export function aiConfig() {
  const provider = (process.env.AI_PROVIDER ?? "").trim().toLowerCase() as Provider;
  const key = (process.env.AI_API_KEY ?? "").trim();
  const model = (process.env.AI_MODEL ?? "").trim() || DEFAULT_MODEL[provider] || "";
  const valid = provider === "anthropic" || provider === "openai" || provider === "gemini";
  return { configured: valid && Boolean(key) && Boolean(model), provider: valid ? provider : null, model, key };
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

/** Mensagem de erro em português, sem expor detalhes da chave. */
function explain(status: number) {
  if (status === 401 || status === 403) return "A chave da IA foi recusada. Confira a AI_API_KEY.";
  if (status === 429) return "Limite de uso da IA atingido. Espere um pouco ou aumente o limite na conta do provedor.";
  if (status === 402) return "A conta da IA está sem crédito.";
  if (status >= 500) return "O serviço de IA está instável agora. Tente de novo em instantes.";
  return "A IA não aceitou o pedido. Confira o modelo em AI_MODEL.";
}

export async function complete(system: string, turns: ChatTurn[], maxTokens = 1200): Promise<string> {
  const cfg = aiConfig();
  if (!cfg.configured || !cfg.provider) throw new AiError("A IA ainda não foi configurada.", 503);
  const signal = AbortSignal.timeout(45000);
  let res: Response;
  try {
    if (cfg.provider === "anthropic") {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", "x-api-key": cfg.key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system, messages: turns }),
      });
    } else if (cfg.provider === "openai") {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
        body: JSON.stringify({
          model: cfg.model,
          max_completion_tokens: maxTokens,
          messages: [{ role: "system", content: system }, ...turns],
        }),
      });
    } else {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", "x-goog-api-key": cfg.key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      });
    }
  } catch {
    throw new AiError("Não foi possível falar com o serviço de IA. Confira a conexão.");
  }
  if (!res.ok) throw new AiError(explain(res.status));

  const data = await res.json();
  const text =
    cfg.provider === "anthropic"
      ? (data.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("")
      : cfg.provider === "openai"
        ? (data.choices?.[0]?.message?.content ?? "")
        : (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  if (!text.trim()) throw new AiError("A IA respondeu vazio. Tente reformular.");
  return text.trim();
}
