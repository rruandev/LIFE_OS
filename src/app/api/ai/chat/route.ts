import { z } from "zod";
import { buildContext } from "@/lib/ai/context";
import { AiError, aiConfig, complete } from "@/lib/ai/provider";
import { ASSISTANT_SYSTEM, BRIEFING_PROMPT } from "@/lib/ai/prompts";
import { isSupabaseConfigured } from "@/lib/config";
import { getServerSupabase } from "@/lib/supabase/server";

const Body = z.object({
  mode: z.enum(["chat", "briefing"]),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .max(20)
    .default([]),
});

const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!aiConfig().configured) return fail("A IA ainda não foi configurada.", 503);
  if (!isSupabaseConfigured) return fail("O assistente precisa do banco de dados conectado.", 503);

  const db = await getServerSupabase();
  const { data: auth } = await db.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return fail("Entre na sua conta para usar o assistente.", 401);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Pedido inválido.", 400);
  const { mode, today, messages } = parsed.data;
  if (mode === "chat" && (messages.length === 0 || messages.at(-1)!.role !== "user")) return fail("Escreva uma pergunta.", 400);

  try {
    const context = await buildContext(db, String(userId), today);
    const system = `${ASSISTANT_SYSTEM}\n\n# Dados do usuário\n${context}`;
    const turns = mode === "briefing" ? [{ role: "user" as const, content: BRIEFING_PROMPT }] : messages;
    const reply = await complete(system, turns, mode === "briefing" ? 900 : 1200);
    return Response.json({ reply });
  } catch (e) {
    if (e instanceof AiError) return fail(e.message, e.status);
    return fail("Algo falhou ao montar a resposta. Tente de novo.", 500);
  }
}
