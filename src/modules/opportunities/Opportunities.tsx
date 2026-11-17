"use client";

import { ArrowLeft, ExternalLink, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearOpenRequest, peekOpenRequest } from "@/lib/ui";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { showToast } from "@/lib/toast";
import { projects } from "@/modules/projects/store";
import { deleteOpportunity, OpportunityEditor } from "./Editor";
import { DATA_STATUS, DIFFICULTY, opportunities, OPP_STATUS, type DataStatus, type Opportunity, type OppStatus } from "./store";

const panel = "surface min-w-0 rounded-panel p-5 sm:p-6";
const titleCls = "text-[34px] font-light leading-tight tracking-tight sm:text-[44px]";

type Filter = "open" | "discarded" | "all";
type EditorState = { opportunity?: Opportunity } | null;

const EMPTY: Record<Filter, string> = {
  open: "Nenhuma oportunidade aberta no momento.",
  discarded: "Nenhuma oportunidade descartada.",
  all: "",
};

const BADGE: Record<DataStatus, string> = {
  insufficient: "border border-danger/50 bg-danger/10 text-danger font-semibold",
  partial: "bg-ember-soft text-ember",
  sufficient: "bg-ok/10 text-ok",
};

function DataBadge({ status }: { status: DataStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[13px] ${BADGE[status]}`}>{DATA_STATUS[status]}</span>;
}

function StatusPill({ status }: { status: OppStatus }) {
  const active = status === "validating" || status === "pursuing";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[13px] ${active ? "bg-ember-soft text-ember" : "bg-field text-ink-2"}`}>
      {OPP_STATUS[status]}
    </span>
  );
}

const difficultyLabel = (o: Opportunity) => (o.difficulty ? `Dificuldade: ${DIFFICULTY[o.difficulty]}` : "Dificuldade não avaliada");

export function Opportunities() {
  const [selectedId, setSelectedId] = useState<string | null>(() => peekOpenRequest("opportunity"));
  useEffect(() => clearOpenRequest("opportunity"), []);
  const [filter, setFilter] = useState<Filter>("open");
  const [editor, setEditor] = useState<EditorState>(null);
  const state = opportunities.use();
  const loading = state.status === "idle" || state.status === "loading";
  const selected = selectedId ? (state.items.find((o) => o.id === selectedId) ?? null) : null;
  const close = () => setEditor(null);

  return (
    <div className="mx-auto max-w-5xl">
      <PreviewBanner />

      {state.error ? (
        <div className="space-y-3">
          <h1 className={`pb-3 ${titleCls}`}>Opportunities</h1>
          <Notice kind="error">{state.error}</Notice>
          <Button variant="soft" onClick={() => void opportunities.load(true)}>
            Tentar de novo
          </Button>
        </div>
      ) : loading ? (
        <div aria-busy="true" aria-label="Carregando">
          <div className="h-12 w-56 animate-pulse rounded-full bg-field" />
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className={`${panel} h-44 animate-pulse`} />
            <div className={`${panel} h-44 animate-pulse`} />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={selected ? selected.id : "list"}
            initial={{ opacity: 0, x: selected ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: selected ? 40 : -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 32, opacity: { duration: 0.18 } }}
          >
            {selected ? (
              <Detail
                opp={selected}
                onBack={() => setSelectedId(null)}
                onEdit={() => setEditor({ opportunity: selected })}
              />
            ) : (
              <List
                list={state.items}
                filter={filter}
                setFilter={setFilter}
                onOpen={setSelectedId}
                onNew={() => setEditor({})}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <Sheet open={editor !== null} onClose={close} title={editor?.opportunity ? "Editar oportunidade" : "Nova oportunidade"}>
        {editor && (
          <OpportunityEditor
            key={editor.opportunity?.id ?? "new"}
            opportunity={editor.opportunity}
            onClose={close}
            onCreated={(o) => setSelectedId(o.id)}
            onDeleted={() => setSelectedId(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

export default Opportunities;

function List({
  list,
  filter,
  setFilter,
  onOpen,
  onNew,
}: {
  list: Opportunity[];
  filter: Filter;
  setFilter: (f: Filter) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const shown = list
    .filter((o) => filter === "all" || (filter === "discarded" ? o.status === "discarded" : o.status !== "discarded"))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const newButton = (
    <Button onClick={onNew}>
      <Plus aria-hidden className="size-4" strokeWidth={2.5} />
      Nova oportunidade
    </Button>
  );

  return (
    <div>
      <header className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-ink-2">Ideias de negócio para avaliar com calma</p>
          <h1 className={titleCls}>Opportunities</h1>
        </div>
        {list.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<Filter>
              label="Filtrar oportunidades"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "open", label: "Abertas" },
                { value: "discarded", label: "Descartadas" },
                { value: "all", label: "Todas" },
              ]}
            />
            {newButton}
          </div>
        )}
      </header>

      {list.length === 0 ? (
        <section className={panel}>
          <p className="mb-4 text-ink-2">
            Nenhuma oportunidade registrada. Anote a primeira ideia de negócio para avaliar problema, público e riscos com calma.
          </p>
          {newButton}
        </section>
      ) : shown.length === 0 ? (
        <p className="py-6 text-ink-2">{EMPTY[filter]}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {shown.map((o) => (
            <li key={o.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpen(o.id)}
                className={`${panel} press flex h-full w-full flex-col gap-3 text-left hover:border-ember`}
              >
                <span className="block w-full min-w-0">
                  <span className="block truncate text-[19px] font-semibold">{o.title}</span>
                  {o.origin && <span className="mt-0.5 block truncate text-[13px] text-ink-3">Origem: {o.origin}</span>}
                  {o.problem && <span className="mt-1.5 line-clamp-2 break-words text-[14px] text-ink-2">{o.problem}</span>}
                </span>
                <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-2">
                  <StatusPill status={o.status} />
                  <DataBadge status={o.data_status} />
                  <span>{difficultyLabel(o)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Block({ title, text, wide, children }: { title: string; text: string; wide?: boolean; children?: ReactNode }) {
  return (
    <section className={`${panel} ${wide ? "lg:col-span-2" : ""}`}>
      <h2 className="mb-2 text-[17px] font-semibold">{title}</h2>
      {text ? (
        <p className="whitespace-pre-wrap break-words text-ink-2">{text}</p>
      ) : (
        <p className="text-ink-3">Ainda não preenchido</p>
      )}
      {children}
    </section>
  );
}

function Detail({ opp, onBack, onEdit }: { opp: Opportunity; onBack: () => void; onEdit: () => void }) {
  const router = useRouter();
  // Carrega os projetos antes de inserir, para não sobrescrever a lista local.
  const projectState = projects.use();

  function toProject() {
    const goal = (opp.problem || opp.description).slice(0, 2000);
    const created = projects.insert({ name: opp.title.slice(0, 120), goal, status: "active", due_date: null });
    void opportunities.update(opp.id, { project_id: created.id, status: "pursuing" });
    showToast({ kind: "info", message: "Projeto criado", action: { label: "Abrir", run: () => router.push("/projects") } });
  }

  function remove() {
    deleteOpportunity(opp);
    onBack();
  }

  return (
    <div>
      <Button variant="quiet" onClick={onBack} className="-ml-3 mb-3 h-10 px-3">
        <ArrowLeft aria-hidden className="size-4" />
        Voltar
      </Button>

      <header className="pb-6">
        <h1 className={`break-words ${titleCls}`}>{opp.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-2">
          <StatusPill status={opp.status} />
          <DataBadge status={opp.data_status} />
        </div>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented<OppStatus>
            label="Situação da oportunidade"
            value={opp.status}
            onChange={(status) => void opportunities.update(opp.id, { status })}
            options={[
              { value: "new", label: "Nova" },
              { value: "validating", label: "Validando" },
              { value: "pursuing", label: "Em execução" },
              { value: "discarded", label: "Descartada" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            {opp.project_id ? (
              <Link href="/projects" className="press inline-flex h-11 items-center gap-2 rounded-full bg-ember-soft px-5 text-[15px] text-ember">
                <FolderPlus aria-hidden className="size-4" />
                Já virou projeto
              </Link>
            ) : (
              <Button onClick={toProject} disabled={projectState.status !== "ready"}>
                <FolderPlus aria-hidden className="size-4" />
                Transformar em projeto
              </Button>
            )}
            <Button variant="soft" onClick={onEdit}>
              <Pencil aria-hidden className="size-4" />
              Editar
            </Button>
            <Button variant="quiet" onClick={remove} className="text-danger">
              <Trash2 aria-hidden className="size-4" />
              Excluir
            </Button>
          </div>
        </div>
      </header>

      {opp.data_status === "insufficient" && (
        <div className="mb-5">
          <Notice kind="error">
            Não há dados de mercado suficientes para esta oportunidade. Registre fontes em Evidências antes de decidir.
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Block title="Descrição" text={opp.description} wide />
        <Block title="Origem da ideia" text={opp.origin}>
          {opp.origin_url && (
            <a
              href={opp.origin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="press mt-3 flex min-w-0 items-center gap-2 rounded-item text-[14px] text-ember hover:underline"
            >
              <ExternalLink aria-hidden className="size-4 shrink-0" />
              <span className="truncate">{opp.origin_url.replace(/^https?:\/\//i, "")}</span>
            </a>
          )}
        </Block>
        <Block title="Problema que resolve" text={opp.problem} />
        <Block title="Público potencial" text={opp.audience} />
        <Block title="Adaptação ao Brasil" text={opp.brazil_fit} />
        <Block title="Dificuldade de execução" text={opp.difficulty ? DIFFICULTY[opp.difficulty] : ""} />
        <Block title="Custos e riscos" text={opp.costs_risks} />
        <Block title="Próximos passos para validação" text={opp.next_steps} wide />
        <Block title="Evidências e fontes" text={opp.evidence} wide>
          <div className="mt-3">
            <DataBadge status={opp.data_status} />
          </div>
        </Block>
      </div>
    </div>
  );
}
