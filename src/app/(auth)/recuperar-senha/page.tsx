"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/shell/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { requestPasswordReset, type FormState } from "../actions";

export default function RecoverPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <AuthCard
      title="Recuperar senha"
      lead="Enviamos um link para você criar uma senha nova."
      footer={
        <Link href="/login" className="text-ember underline underline-offset-4">
          Voltar para o login
        </Link>
      }
    >
      {state.ok ? (
        <Notice kind="ok">{state.message}</Notice>
      ) : (
        <form action={action} className="space-y-4" noValidate>
          {state.message && <Notice kind="error">{state.message}</Notice>}
          <Field
            label="E-mail da conta"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={state.values?.email}
            error={state.errors?.email}
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" pending={pending} pendingLabel="Enviando">
              Enviar link
            </Button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
