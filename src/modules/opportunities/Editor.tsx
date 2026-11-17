"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { showToast } from "@/lib/toast";
import { DATA_STATUS, opportunities, type DataStatus, type Difficulty, type Opportunity } from "./store";

/** Exclui a oportunidade com opção de desfazer. */
export function deleteOpportunity(opp: Opportunity) {
  void opportunities.remove(opp.id);
  showToast({
    kind: "info",
    message: "Oportunidade excluída",
    action: { label: "Desfazer", run: () => void opportunities.restore(opp) },
  });
}

type Text = {
  title: string;
  description: string;
  origin: string;
  origin_url: string;
  problem: string;
  audience: string;
  brazil_fit: string;
  costs_risks: string;
  next_steps: string;
  evidence: string;
};

const LIMITS: Record<keyof Text, number> = {
  title: 160,
  description: 4000,
  origin: 300,
  origin_url: 2000,
  problem: 2000,
  audience: 1000,
  brazil_fit: 2000,
  costs_risks: 2000,
  next_steps: 2000,
  evidence: 4000,
};

const blank: Text = {
  title: "",
  description: "",
  origin: "",
  origin_url: "",
  problem: "",
  audience: "",
  brazil_fit: "",
  costs_risks: "",
  next_steps: "",
  evidence: "",
};

export function OpportunityEditor({
  opportunity,
  onClose,
  onCreated,
  onDeleted,
}: {
  opportunity?: Opportunity;
  onClose: () => void;
  onCreated: (o: Opportunity) => void;
  onDeleted: () => void;
}) {
  const [text, setText] = useState<Text>(() =>
    opportunity ? (Object.fromEntries(Object.keys(blank).map((k) => [k, opportunity[k as keyof Text]])) as Text) : blank,
  );
  const [difficulty, setDifficulty] = useState<Difficulty | "">(opportunity?.difficulty ?? "");
  const [dataStatus, setDataStatus] = useState<DataStatus>(opportunity?.data_status ?? "insufficient");
  const [errors, setErrors] = useState<Partial<Record<keyof Text, string>>>({});

  const set = (key: keyof Text) => (e: { target: { value: string } }) => setText((t) => ({ ...t, [key]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const values = Object.fromEntries(Object.entries(text).map(([k, v]) => [k, v.trim()])) as Text;
    const found: typeof errors = {};
    if (!values.title) found.title = "Dê um título para a oportunidade.";
    else if (values.title.length > LIMITS.title) found.title = `Use até ${LIMITS.title} caracteres no título.`;
    if (values.origin.length > LIMITS.origin) found.origin = `Use até ${LIMITS.origin} caracteres.`;
    if (values.origin_url && !/^https?:\/\/\S+$/i.test(values.origin_url))
      found.origin_url = "O endereço precisa começar com http:// ou https://";
    else if (values.origin_url.length > LIMITS.origin_url) found.origin_url = "Endereço longo demais.";
    for (const k of Object.keys(LIMITS) as (keyof Text)[])
      if (!found[k] && values[k].length > LIMITS[k]) found[k] = `Use até ${LIMITS[k]} caracteres.`;
    setErrors(found);
    if (Object.keys(found).length) return;
    const row = { ...values, difficulty: difficulty || null, data_status: dataStatus };
    if (opportunity) void opportunities.update(opportunity.id, row);
    else onCreated(opportunities.insert({ ...row, status: "new", project_id: null }));
    onClose();
  }

  const area = (key: keyof Text, label: string) => (
    <div>
      <TextArea label={label} value={text[key]} onChange={set(key)} maxLength={LIMITS[key]} />
      {errors[key] && <p className="mt-1.5 text-[13px] text-danger">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Título" value={text.title} onChange={set("title")} error={errors.title} maxLength={LIMITS.title} autoFocus />
      {area("description", "Descrição")}
      <Field
        label="Origem da ideia"
        value={text.origin}
        onChange={set("origin")}
        error={errors.origin}
        maxLength={LIMITS.origin}
        hint="Empresa, país, notícia ou conversa de onde veio."
      />
      <Field
        label="Link da origem (opcional)"
        type="url"
        inputMode="url"
        placeholder="https://"
        value={text.origin_url}
        onChange={set("origin_url")}
        error={errors.origin_url}
        maxLength={LIMITS.origin_url}
      />
      {area("problem", "Problema que resolve")}
      {area("audience", "Público potencial")}
      {area("brazil_fit", "Adaptação ao Brasil")}
      <Select
        label="Dificuldade de execução"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
      >
        <option value="">Não avaliada</option>
        <option value="low">Baixa</option>
        <option value="medium">Média</option>
        <option value="high">Alta</option>
      </Select>
      {area("costs_risks", "Custos e riscos")}
      {area("next_steps", "Próximos passos para validação")}
      {area("evidence", "Evidências e fontes")}
      <div>
        <Select label="Situação dos dados" value={dataStatus} onChange={(e) => setDataStatus(e.target.value as DataStatus)}>
          {(Object.keys(DATA_STATUS) as DataStatus[]).map((s) => (
            <option key={s} value={s}>
              {DATA_STATUS[s]}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-[13px] text-ink-3">Marque como insuficiente quando não houver números de fontes confiáveis.</p>
      </div>
      <div className="flex items-center justify-between gap-3 pt-2">
        {opportunity ? (
          <Button
            type="button"
            variant="quiet"
            className="text-danger"
            onClick={() => {
              deleteOpportunity(opportunity);
              onDeleted();
              onClose();
            }}
          >
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">Salvar oportunidade</Button>
      </div>
    </form>
  );
}
