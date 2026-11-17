"use client";

import { useActionState } from "react";
import { AuthCard } from "@/components/shell/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { updatePassword, type FormState } from "../actions";

export default function ResetPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <AuthCard title="Criar senha nova" lead="Depois de salvar, você já entra no Life OS.">
      <form action={action} className="space-y-4" noValidate>
        {state.message && <Notice kind="error">{state.message}</Notice>}
        <Field
          label="Senha nova"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres."
          error={state.errors?.password}
        />
        <Field
          label="Repita a senha"
          name="confirm"
          type="password"
          autoComplete="new-password"
          error={state.errors?.confirm}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" pending={pending} pendingLabel="Salvando">
            Salvar senha
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
