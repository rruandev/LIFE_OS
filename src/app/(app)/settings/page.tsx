"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState, type FormEvent } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { isSupabaseConfigured } from "@/lib/config";
import { AI_SCOPES, updateSettings, useMounted, useSettings, type ThemeChoice } from "@/lib/settings/store";
import { useAiStatus } from "@/modules/assistant/store";

function NameForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return setError("Diga como você quer ser chamado.");
    if (name.length > 40) return setError("Use até 40 caracteres.");
    setError(undefined);
    setState("saving");
    const ok = await updateSettings({ displayName: name });
    setState(ok ? "saved" : "idle");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Field
        className="flex-1"
        label="Como quer ser chamado"
        name="name"
        autoComplete="given-name"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setState("idle");
        }}
        error={error}
        hint={state === "saved" ? "Nome salvo." : "Aparece na saudação da Home."}
      />
      <Button type="submit" pending={state === "saving"} pendingLabel="Salvando" className="sm:mt-[26px]">
        Salvar nome
      </Button>
    </form>
  );
}

const section = "surface rounded-panel p-6 sm:p-8";

export default function SettingsPage() {
  const mounted = useMounted();
  const { settings, sync, error, email } = useSettings();
  const ai = useAiStatus();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="pb-3 text-[34px] font-light tracking-tight">Configurações</h1>

      {error && <Notice kind="error">{error}</Notice>}

      <section className={section} aria-labelledby="perfil">
        <h2 id="perfil" className="mb-5 text-[19px] font-semibold">
          Perfil
        </h2>
        {mounted && sync !== "loading" ? (
          <NameForm initial={settings.displayName} />
        ) : (
          <div className="h-[74px] animate-pulse rounded-item bg-field" aria-busy="true" aria-label="Carregando" />
        )}
      </section>

      <section className={section} aria-labelledby="aparencia">
        <h2 id="aparencia" className="mb-5 text-[19px] font-semibold">
          Aparência
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Tema</p>
            <p className="text-[14px] text-ink-2">Automático segue o tema do aparelho.</p>
          </div>
          <Segmented<ThemeChoice>
            label="Tema"
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: "system", label: "Automático", icon: Monitor },
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Escuro", icon: Moon },
            ]}
          />
        </div>
        <div className="mt-6 flex items-center justify-between gap-6 border-t border-line pt-6">
          <div>
            <p className="font-medium">Reduzir transparência</p>
            <p className="text-[14px] text-ink-2">
              Troca o vidro por superfícies opacas. Melhora a leitura e alivia aparelhos mais lentos.
            </p>
          </div>
          <Switch
            label="Reduzir transparência"
            checked={settings.solid}
            onChange={(solid) => updateSettings({ solid })}
          />
        </div>
      </section>

      <section id="assistente" className={`${section} scroll-mt-6`} aria-labelledby="assistente-titulo">
        <h2 id="assistente-titulo" className="mb-2 text-[19px] font-semibold">
          Assistente de IA
        </h2>
        <p className="mb-5 text-ink-2">
          {ai.state === "loading"
            ? "Verificando a conexão com a IA…"
            : ai.configured
              ? `Conectado: ${ai.provider} · ${ai.model}.`
              : "Ainda não conectado. Coloque no arquivo .env.local as linhas AI_PROVIDER (anthropic, openai ou gemini) e AI_API_KEY, e rode npm run build de novo. A chave fica só no servidor."}
        </p>
        <p className="mb-2 font-medium">O que o assistente pode ler</p>
        <ul className="divide-y divide-line">
          {AI_SCOPES.map((scope) => {
            const on = settings.aiScopes.includes(scope.id);
            return (
              <li key={scope.id} className="flex items-center justify-between gap-6 py-3">
                <span>{scope.label}</span>
                <Switch
                  label={scope.label}
                  checked={on}
                  onChange={(next) =>
                    updateSettings({
                      aiScopes: next ? [...settings.aiScopes, scope.id] : settings.aiScopes.filter((x) => x !== scope.id),
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section id="conta" className={`${section} scroll-mt-6`} aria-labelledby="conta-titulo">
        <h2 id="conta-titulo" className="mb-5 text-[19px] font-semibold">
          Conta
        </h2>
        {isSupabaseConfigured ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{email ?? "Sessão ativa"}</p>
              <p className="text-[14px] text-ink-2">Seus dados ficam no banco e só a sua conta os lê.</p>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="soft">
                Sair
              </Button>
            </form>
          </div>
        ) : (
          <>
            <p className="text-ink-2">
              O app está em pré-visualização: sem login, com as preferências guardadas só neste
              aparelho. Para ligar o banco:
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 marker:text-ink-3">
              <li>Crie um projeto gratuito em supabase.com.</li>
              <li>
                No SQL Editor, rode os arquivos da pasta <code className="text-ember">supabase/migrations</code>, em ordem.
              </li>
              <li>
                Em Project Settings, API, copie a URL e a chave anon para as variáveis{" "}
                <code className="text-ember">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                <code className="text-ember">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </li>
              <li>Publique de novo. O login e o salvamento na nuvem passam a valer.</li>
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
