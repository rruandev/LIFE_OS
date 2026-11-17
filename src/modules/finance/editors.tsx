"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { showToast } from "@/lib/toast";
import {
  amountInput,
  bills,
  financialGoals,
  num,
  parseAmount,
  transactions,
  type Bill,
  type FinancialGoal,
  type Transaction,
} from "./store";

const AMOUNT_ERROR = "Digite um valor maior que zero, como 1.234,56.";

function Actions({ onRemove, submitLabel }: { onRemove?: () => void; submitLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onRemove ? (
        <Button type="button" variant="quiet" onClick={onRemove} className="text-danger">
          Excluir
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit">{submitLabel}</Button>
    </div>
  );
}

/* ───────── Movimentação ───────── */
export function TransactionEditor({
  transaction,
  date,
  categories,
  onClose,
}: {
  transaction?: Transaction;
  /** Data sugerida para uma movimentação nova. */
  date: string;
  categories: string[];
  onClose: () => void;
}) {
  const listId = useId();
  const [kind, setKind] = useState<Transaction["kind"]>(transaction?.kind ?? "expense");
  const [amount, setAmount] = useState(transaction ? amountInput(transaction.amount) : "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [day, setDay] = useState(transaction?.occurred_on.slice(0, 10) ?? date);
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [errors, setErrors] = useState<{ amount?: string; description?: string; day?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseAmount(amount);
    const text = description.trim();
    const found: typeof errors = {};
    if (value === null || value <= 0) found.amount = AMOUNT_ERROR;
    if (!text) found.description = "Descreva a movimentação.";
    else if (text.length > 200) found.description = "Use até 200 caracteres na descrição.";
    if (!day) found.day = "Escolha a data.";
    setErrors(found);
    if (value === null || value <= 0 || Object.keys(found).length) return;

    const values = { kind, amount: value, description: text, category: category.trim().slice(0, 60), occurred_on: day, notes: notes.trim() };
    if (transaction) void transactions.update(transaction.id, values);
    else transactions.insert(values);
    onClose();
  }

  function remove() {
    if (!transaction) return;
    void transactions.remove(transaction.id);
    showToast({
      kind: "info",
      message: "Movimentação excluída",
      action: { label: "Desfazer", run: () => void transactions.restore(transaction) },
    });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-ink-2">Tipo</p>
        <Segmented<Transaction["kind"]>
          label="Tipo"
          value={kind}
          onChange={setKind}
          options={[
            { value: "expense", label: "Despesa" },
            { value: "income", label: "Entrada" },
          ]}
        />
      </div>
      <Field
        label="Valor (R$)"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
        autoFocus={!transaction}
      />
      <Field label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Categoria"
          list={listId}
          autoComplete="off"
          maxLength={60}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-w-0"
        />
        <Field label="Data" type="date" value={day} onChange={(e) => setDay(e.target.value)} error={errors.day} className="min-w-0" />
      </div>
      <datalist id={listId}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <TextArea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
      <Actions onRemove={transaction ? remove : undefined} submitLabel="Salvar movimentação" />
    </form>
  );
}

/* ───────── Meta ───────── */
export function GoalEditor({ goal, onClose }: { goal?: FinancialGoal; onClose: () => void }) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? amountInput(goal.target_amount) : "");
  const [saved, setSaved] = useState(goal && num(goal.saved_amount) > 0 ? amountInput(goal.saved_amount) : "");
  const [due, setDue] = useState(goal?.due_date?.slice(0, 10) ?? "");
  const [errors, setErrors] = useState<{ name?: string; target?: string; saved?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const title = name.trim();
    const targetValue = parseAmount(target);
    const savedValue = saved.trim() ? parseAmount(saved) : 0;
    const found: typeof errors = {};
    if (!title) found.name = "Dê um nome para a meta.";
    else if (title.length > 120) found.name = "Use até 120 caracteres no nome.";
    if (targetValue === null || targetValue <= 0) found.target = AMOUNT_ERROR;
    if (savedValue === null) found.saved = "Digite um valor como 250,00 ou deixe em branco.";
    setErrors(found);
    if (targetValue === null || savedValue === null || Object.keys(found).length) return;

    const values = { name: title, target_amount: targetValue, saved_amount: savedValue, due_date: due || null };
    if (goal) void financialGoals.update(goal.id, values);
    else financialGoals.insert(values);
    onClose();
  }

  function remove() {
    if (!goal) return;
    void financialGoals.remove(goal.id);
    showToast({ kind: "info", message: "Meta excluída", action: { label: "Desfazer", run: () => void financialGoals.restore(goal) } });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus={!goal} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Valor da meta (R$)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          error={errors.target}
          className="min-w-0"
        />
        <Field
          label="Já guardado (R$)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={saved}
          onChange={(e) => setSaved(e.target.value)}
          error={errors.saved}
          className="min-w-0"
        />
      </div>
      <Field label="Prazo" type="date" value={due} onChange={(e) => setDue(e.target.value)} hint="Opcional." />
      <Actions onRemove={goal ? remove : undefined} submitLabel="Salvar meta" />
    </form>
  );
}

/* ───────── Conta ───────── */
export function BillEditor({ bill, date, onClose }: { bill?: Bill; date: string; onClose: () => void }) {
  const [name, setName] = useState(bill?.name ?? "");
  const [amount, setAmount] = useState(bill ? amountInput(bill.amount) : "");
  const [due, setDue] = useState(bill?.due_date.slice(0, 10) ?? date);
  const [repeat, setRepeat] = useState(bill?.repeat_monthly ?? false);
  const [errors, setErrors] = useState<{ name?: string; amount?: string; due?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const title = name.trim();
    const value = amount.trim() ? parseAmount(amount) : null;
    const found: typeof errors = {};
    if (!title) found.name = "Dê um nome para a conta.";
    else if (title.length > 120) found.name = "Use até 120 caracteres no nome.";
    if (amount.trim() && (value === null || value <= 0)) found.amount = "Digite um valor maior que zero ou deixe em branco.";
    if (!due) found.due = "Escolha o vencimento.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const values = { name: title, amount: value, due_date: due, repeat_monthly: repeat };
    if (bill) void bills.update(bill.id, values);
    else bills.insert({ ...values, paid_at: null });
    onClose();
  }

  function remove() {
    if (!bill) return;
    void bills.remove(bill.id);
    showToast({ kind: "info", message: "Conta excluída", action: { label: "Desfazer", run: () => void bills.restore(bill) } });
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus={!bill} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Valor (R$)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          hint={errors.amount ? undefined : "Opcional."}
          className="min-w-0"
        />
        <Field label="Vencimento" type="date" value={due} onChange={(e) => setDue(e.target.value)} error={errors.due} className="min-w-0" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">Repete todo mês</p>
          <p className="text-[13px] text-ink-3">Ao marcar como paga, a conta do mês seguinte é criada.</p>
        </div>
        <Switch label="Repete todo mês" checked={repeat} onChange={setRepeat} />
      </div>
      <Actions onRemove={bill ? remove : undefined} submitLabel="Salvar conta" />
    </form>
  );
}
