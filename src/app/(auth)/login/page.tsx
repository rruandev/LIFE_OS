"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/shell/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { signIn, type FormState } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <AuthCard
      title="Entrar"
      lead="Seu centro de comando pessoal."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-ember underline underline-offset-4">
            Criar conta
          </Link>
        </>
      }
    >
      <form action={action} className="space-y-4" noValidate>
        {state.message && <Notice kind="error">{state.message}</Notice>}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          error={state.errors?.email}
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          error={state.errors?.password}
        />
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link href="/recuperar-senha" className="text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink">
            Esqueci a senha
          </Link>
          <Button type="submit" pending={pending} pendingLabel="Entrando">
            Entrar
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
