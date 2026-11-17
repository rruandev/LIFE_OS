import {
  BookOpen,
  CalendarDays,
  FolderKanban,
  Globe,
  House,
  Lightbulb,
  Sparkles,
  Sprout,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ModuleInfo = {
  id: string;
  href: string;
  label: string;
  /** O que o módulo faz, em uma linha. */
  summary: string;
  icon: LucideIcon;
  /** true quando o módulo já está construído e utilizável. */
  ready: boolean;
  /** Etapa do plano em que o módulo é entregue. */
  phase: string;
  /** O que vai existir ali quando ficar pronto. */
  planned: string[];
};

export const MODULES: ModuleInfo[] = [
  {
    id: "home",
    href: "/",
    label: "Home",
    summary: "Visão geral do que importa agora",
    icon: House,
    ready: true,
    phase: "Fase 1",
    planned: [],
  },
  {
    id: "my-day",
    href: "/my-day",
    label: "My Day",
    summary: "Agenda, tarefas, prazos e lembretes",
    icon: CalendarDays,
    ready: false,
    phase: "Fase 1, passo 2",
    planned: [
      "Agenda por dia, semana e mês",
      "Tarefas com prioridade e prazo",
      "Compromissos organizados por horário",
      "Tarefas atrasadas e progresso do dia",
    ],
  },
  {
    id: "projects",
    href: "/projects",
    label: "Projects",
    summary: "Projetos, objetivos e progresso",
    icon: FolderKanban,
    ready: false,
    phase: "Fase 1, passo 3",
    planned: [
      "Projetos ativos, pausados e concluídos",
      "Objetivo, prazo e progresso de cada um",
      "Tarefas vinculadas ao projeto",
      "Ideias, documentos e links guardados",
    ],
  },
  {
    id: "knowledge",
    href: "/knowledge",
    label: "Knowledge",
    summary: "Notas, ideias e aprendizados",
    icon: BookOpen,
    ready: false,
    phase: "Fase 1, passo 4",
    planned: [
      "Notas com categorias e etiquetas",
      "Busca no conteúdo",
      "Notas ligadas a projetos",
      "Links e referências salvos",
    ],
  },
  {
    id: "finance",
    href: "/finance",
    label: "Finance",
    summary: "Entradas, despesas e metas",
    icon: Wallet,
    ready: false,
    phase: "Fase 2",
    planned: [
      "Registro manual de entradas e despesas",
      "Saldo e gastos por categoria",
      "Metas financeiras e gráficos",
      "Lembretes de contas",
    ],
  },
  {
    id: "growth",
    href: "/growth",
    label: "Growth",
    summary: "Metas, hábitos e estudos",
    icon: Sprout,
    ready: false,
    phase: "Fase 2",
    planned: [
      "Metas pessoais e hábitos",
      "Consistência semanal e mensal",
      "Registro de estudos",
      "Conquistas",
    ],
  },
  {
    id: "intelligence",
    href: "/intelligence",
    label: "Intelligence",
    summary: "Notícias e tendências com resumo",
    icon: Globe,
    ready: false,
    phase: "Fase 3",
    planned: [
      "Notícias do Brasil e do mundo por tema",
      "Fonte, data e link da matéria original",
      "Resumo e motivo da relevância",
      "Fatos separados de opiniões",
    ],
  },
  {
    id: "opportunities",
    href: "/opportunities",
    label: "Opportunities",
    summary: "Ideias de negócio para avaliar",
    icon: Lightbulb,
    ready: false,
    phase: "Fase 3",
    planned: [
      "Origem da ideia e problema que resolve",
      "Público e adaptação ao Brasil",
      "Dificuldade, custos e riscos",
      "Próximos passos para validar",
    ],
  },
  {
    id: "assistant",
    href: "/assistant",
    label: "Assistant",
    summary: "IA com contexto dos seus dados",
    icon: Sparkles,
    ready: false,
    phase: "Fase 3",
    planned: [
      "Perguntas sobre rotina, tarefas e projetos",
      "Briefing diário",
      "Alertas de prazos e pendências",
      "Ações só com a sua confirmação",
    ],
  },
];

export const getModule = (id: string) => MODULES.find((m) => m.id === id)!;

/** Itens fixos na barra inferior do celular; o restante fica em "Mais". */
export const MOBILE_PRIMARY = ["home", "my-day", "projects", "knowledge"];

/** Um link está ativo quando a rota atual é ele ou está dentro dele. */
export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/** Ordem das telas na navegação; define para que lado a tela desliza. */
export const NAV_ORDER = [...MODULES.map((m) => m.href), "/settings"];
