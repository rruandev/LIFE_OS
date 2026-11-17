import Link from "next/link";
import type { ReactNode } from "react";
import { Notice } from "@/components/ui/Notice";
import { isSupabaseConfigured } from "@/lib/config";

export function AuthCard({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="glass w-full max-w-[420px] rounded-panel p-7 sm:p-9">
      <h1 className="text-[28px] font-light leading-tight tracking-tight">{title}</h1>
      <p className="mt-2 text-ink-2">{lead}</p>
      <div className="mt-7">
        {isSupabaseConfigured ? (
          children
        ) : (
          <div className="space-y-4">
            <Notice>
              O banco de dados ainda não está conectado, então contas e login não funcionam por
              enquanto. Você pode abrir a pré-visualização sem entrar.
            </Notice>
            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-ember px-5 font-semibold text-on-ember transition hover:brightness-110"
            >
              Abrir a pré-visualização
            </Link>
          </div>
        )}
      </div>
      {isSupabaseConfigured && footer && <div className="mt-6 text-[14px] text-ink-2">{footer}</div>}
    </div>
  );
}
