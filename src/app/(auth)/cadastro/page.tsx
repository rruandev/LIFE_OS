"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/shell/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { signUp, type FormState } from "../actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  return (
    <AuthCard
      title="Criar conta"
      lead="Uma conta só sua. Seus dados ficam visíveis apenas para você."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="text-ember underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      {state.ok ? (
        <Notice kind="ok">{state.message}</Notice>
      ) : (
        <form action={action} className="space-y-4" noValidate>
          {state.message && <Notice kind="error">{state.message}</Notice>}
          <Field
            label="Como quer ser chamado"
            name="name"
            autoComplete="given-name"
            defaultValue={state.values?.name}
            error={state.errors?.name}
          />
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
            autoComplete="new-password"
            hint="Pelo menos 8 caracteres."
            error={state.errors?.password}
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" pending={pending} pendingLabel="Criando conta">
              Criar conta
            </Button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
