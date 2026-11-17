# Life OS

Centro de comando pessoal: rotina, projetos, conhecimento, finanças, metas e IA.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Motion · Supabase (Postgres + Auth)

## Estado atual

Fases 1, 2 e 3 construídas: My Day, Projects, Knowledge, Finance, Growth, captura rápida (Ctrl J),
busca global (Ctrl K), notificações, Opportunities, Intelligence (notícias por RSS) e Assistant
(briefing diário por regras; resumo e conversa por IA quando a chave for configurada).

### Histórico

Fase 1, passo 1 concluído:

- Design system de vidro (tema claro/escuro, automático ou manual; opção de reduzir transparência)
- Autenticação: entrar, criar conta, recuperar e redefinir senha, sair
- Rotas protegidas em `src/proxy.ts`
- Navegação: barra lateral recolhível no computador, barra inferior + "Mais" no celular
- Home com saudação, data e hora
- Configurações com nome, tema e preferências (salvas no aparelho e, com banco, na nuvem)

Os demais módulos têm página própria dizendo em que fase entram. Nada é simulado.

## Rodar

```bash
npm install
npm run dev
```

Sem variáveis de ambiente o app abre em **modo de pré-visualização**: sem login, com as
preferências guardadas só no navegador. Um aviso fica visível enquanto for assim.

## Ligar o banco (Supabase)

1. Crie um projeto em supabase.com.
2. No SQL Editor, rode os arquivos de `supabase/migrations` em ordem.
3. Copie `.env.example` para `.env.local` e preencha a URL e a chave anon
   (Project Settings → API). Na Vercel, cadastre as mesmas duas variáveis.
4. Em Authentication → URL Configuration, coloque o endereço do app em *Site URL*
   e adicione `https://SEU-DOMINIO/auth/callback` em *Redirect URLs*.

A chave anon é pública por desenho; quem protege os dados é o Row Level Security
definido nas migrações. Chaves secretas (service role, API de IA) nunca vão para
variáveis `NEXT_PUBLIC_`.

## Ligar a IA

O assistente funciona com Claude (Anthropic), OpenAI ou Gemini. A chave fica só no servidor.
No `.env.local` (e na Vercel, se publicar):

```
AI_PROVIDER=anthropic        # ou openai, ou gemini
AI_API_KEY=sua-chave
AI_MODEL=                    # opcional; padrão claude-haiku-5-5 ou gpt-5.4-mini; obrigatório no gemini
```

Depois rode `npm run build` e `npm start` de novo. Em Configurações → Assistente de IA você escolhe
quais módulos a IA pode ler (Finance vem desligado). A IA sugere ações (criar tarefa ou nota), mas
nada é criado sem você clicar em Confirmar.

## Estrutura

```
src/app/(auth)        telas e ações de autenticação
src/app/(app)         app autenticado: Home, módulos, configurações
src/components/ui     componentes base (Button, Field, Segmented, Switch, Notice)
src/components/shell  navegação e moldura do app
src/lib/modules.ts    registro dos módulos (rótulo, ícone, fase)
src/lib/settings      preferências (aparelho + nuvem)
src/lib/supabase      clientes de navegador e servidor
supabase/migrations   esquema do banco, uma migração por etapa
```
