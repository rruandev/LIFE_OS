import { connection } from "next/server";
import { aiConfig } from "@/lib/ai/provider";

/** Diz ao app se a IA está ligada, sem revelar a chave. */
export async function GET() {
  // Lê as variáveis a cada pedido, não no momento do build.
  await connection();
  const cfg = aiConfig();
  return Response.json({ configured: cfg.configured, provider: cfg.provider, model: cfg.configured ? cfg.model : null });
}
