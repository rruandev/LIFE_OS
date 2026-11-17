"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/config";
import { getServerSupabase } from "@/lib/supabase/server";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

const email = z.email("Digite um e-mail válido, como nome@exemplo.com.");
const password = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.");
const name = z
  .string()
  .trim()
  .min(1, "Diga como você quer ser chamado.")
  .max(40, "Use até 40 caracteres.");

function parse<T extends z.ZodType>(schema: T, data: Record<string, unknown>) {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data as z.infer<T>, errors: null };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { data: null, errors };
}

const NOT_CONFIGURED: FormState = {
  message: "O banco de dados ainda não está conectado, então o login não funciona.",
};

/** Traduz os erros mais comuns do Supabase para algo que diga o que fazer. */
function explain(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("already registered")) return "Já existe uma conta com este e-mail. Entre ou recupere a senha.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (m.includes("different from the old")) return "A senha nova precisa ser diferente da atual.";
  if (m.includes("weak")) return "Senha fraca demais. Misture letras, números e símbolos.";
  return "Não deu certo agora. Confira sua conexão e tente de novo.";
}

async function origin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const raw = { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };
  const { data, errors } = parse(
    z.object({ email, password: z.string().min(1, "Digite sua senha.") }),
    raw,
  );
  if (!data) return { errors, values: { email: raw.email } };

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) return { message: explain(error.message), values: { email: raw.email } };
  redirect("/");
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const raw = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
  const values = { name: raw.name, email: raw.email };
  const { data, errors } = parse(z.object({ name, email, password }), raw);
  if (!data) return { errors, values };

  const supabase = await getServerSupabase();
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { display_name: data.name },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });
  if (error) return { message: explain(error.message), values };
  if (result.session) redirect("/");
  return {
    ok: true,
    message: `Enviamos um link de confirmação para ${data.email}. Abra o e-mail para ativar a conta.`,
  };
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const raw = { email: String(form.get("email") ?? "") };
  const { data, errors } = parse(z.object({ email }), raw);
  if (!data) return { errors, values: raw };

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${await origin()}/auth/callback?next=/redefinir-senha`,
  });
  if (error) return { message: explain(error.message), values: raw };
  // Mesma resposta exista ou não a conta, para não revelar quem está cadastrado.
  return {
    ok: true,
    message: `Se houver uma conta com ${data.email}, o link para criar uma senha nova chega em instantes.`,
  };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const raw = {
    password: String(form.get("password") ?? ""),
    confirm: String(form.get("confirm") ?? ""),
  };
  const { data, errors } = parse(
    z
      .object({ password, confirm: z.string() })
      .refine((v) => v.password === v.confirm, {
        path: ["confirm"],
        message: "As duas senhas precisam ser iguais.",
      }),
    raw,
  );
  if (!data) return { errors };

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) return { message: explain(error.message) };
  redirect("/");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
