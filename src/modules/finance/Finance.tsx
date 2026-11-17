"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { PreviewBanner } from "@/components/shell/PreviewBanner";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { isoDate, useNow } from "@/lib/dates";
import { Bills } from "./Bills";
import { BillEditor, GoalEditor, TransactionEditor } from "./editors";
import { Goals } from "./Goals";
import { Overview } from "./Overview";
import { IconButton, monthLabel, panel } from "./shared";
import {
  bills as billStore,
  categoriesOf,
  financialGoals as goalStore,
  monthOf,
  shiftMonth,
  transactions as transactionStore,
  type Bill,
  type FinancialGoal,
  type Transaction,
} from "./store";
import { Transactions } from "./Transactions";

type Section = "overview" | "transactions" | "goals" | "bills";
type Editor =
  | { kind: "transaction"; item?: Transaction }
  | { kind: "goal"; item?: FinancialGoal }
  | { kind: "bill"; item?: Bill }
  | null;

const SECTIONS: { value: Section; label: string }[] = [
  { value: "overview", label: "Visão geral" },
  { value: "transactions", label: "Movimentações" },
  { value: "goals", label: "Metas" },
  { value: "bills", label: "Contas" },
];

const NEW_LABEL = { transaction: "Nova movimentação", goal: "Nova meta", bill: "Nova conta" } as const;
const EDIT_LABEL = { transaction: "Editar movimentação", goal: "Editar meta", bill: "Editar conta" } as const;

export function Finance() {
  const now = useNow();
  const today = now ? isoDate(now) : null;
  const [section, setSection] = useState<Section>("overview");
  const [picked, setPicked] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const transactionState = transactionStore.use();
  const goalState = goalStore.use();
  const billState = billStore.use();

  if (!today) return <Skeleton />;
  const currentMonth = monthOf(today);
  const month = picked ?? currentMonth;
  // Registro novo cai em hoje; olhando outro mês, no dia 1º dele.
  const suggestedDate = month === currentMonth ? today : `${month}-01`;

  const states = [transactionState, goalState, billState];
  const loading = states.some((s) => s.status === "idle" || s.status === "loading");
  const failure = transactionState.error ?? goalState.error ?? billState.error;
  const creates = section === "goals" ? "goal" : section === "bills" ? "bill" : "transaction";

  return (
    <div className="mx-auto max-w-5xl">
      <PreviewBanner />

      <header className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-ink-2">Finance</p>
          <h1 className="text-[34px] font-light leading-tight tracking-tight sm:text-[44px]" aria-live="polite">
            {monthLabel(month)}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Mês anterior" onClick={() => setPicked(shiftMonth(month, -1))}>
            <ChevronLeft aria-hidden className="size-5" />
          </IconButton>
          <Button variant="soft" onClick={() => setPicked(null)} disabled={month === currentMonth} className="h-10 px-4">
            Mês atual
          </Button>
          <IconButton label="Próximo mês" onClick={() => setPicked(shiftMonth(month, 1))}>
            <ChevronRight aria-hidden className="size-5" />
          </IconButton>
        </div>
      </header>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Quatro opções não cabem em 390px: a faixa rola de lado em vez de estourar a página. */}
        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-max sm:min-w-0">
            <Segmented<Section> label="Seção" value={section} onChange={setSection} options={SECTIONS} />
          </div>
        </div>
        <Button onClick={() => setEditor({ kind: creates })} className="self-start lg:self-auto">
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          {NEW_LABEL[creates]}
        </Button>
      </div>

      {failure ? (
        <div className="space-y-3">
          <Notice kind="error">{failure}</Notice>
          <Button
            variant="soft"
            onClick={() => {
              void transactionStore.load(true);
              void goalStore.load(true);
              void billStore.load(true);
            }}
          >
            Tentar de novo
          </Button>
        </div>
      ) : loading ? (
        <Loading />
      ) : (
        <motion.div
          key={section === "goals" ? section : `${section}-${month}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {section === "overview" && (
            <Overview
              month={month}
              today={today}
              transactions={transactionState.items}
              bills={billState.items}
              onOpenBill={(item) => setEditor({ kind: "bill", item })}
            />
          )}
          {section === "transactions" && (
            <Transactions month={month} transactions={transactionState.items} onOpen={(item) => setEditor({ kind: "transaction", item })} />
          )}
          {section === "goals" && <Goals goals={goalState.items} today={today} onOpen={(item) => setEditor({ kind: "goal", item })} />}
          {section === "bills" && (
            <Bills bills={billState.items} month={month} today={today} onOpen={(item) => setEditor({ kind: "bill", item })} />
          )}
        </motion.div>
      )}

      <Sheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor ? (editor.item ? EDIT_LABEL[editor.kind] : NEW_LABEL[editor.kind]) : NEW_LABEL[creates]}
      >
        {editor?.kind === "transaction" && (
          <TransactionEditor
            key={editor.item?.id ?? "new"}
            transaction={editor.item}
            date={suggestedDate}
            categories={categoriesOf(transactionState.items)}
            onClose={() => setEditor(null)}
          />
        )}
        {editor?.kind === "goal" && <GoalEditor key={editor.item?.id ?? "new"} goal={editor.item} onClose={() => setEditor(null)} />}
        {editor?.kind === "bill" && (
          <BillEditor key={editor.item?.id ?? "new"} bill={editor.item} date={suggestedDate} onClose={() => setEditor(null)} />
        )}
      </Sheet>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-busy="true" aria-label="Carregando">
      <div className={`${panel} h-64 animate-pulse`} />
      <div className={`${panel} h-64 animate-pulse`} />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true" aria-label="Carregando">
      <div className="h-12 w-56 animate-pulse rounded-full bg-field" />
      <div className="mt-8">
        <Loading />
      </div>
    </div>
  );
}
