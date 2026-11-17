import type { CSSProperties } from "react";
import { getModule } from "@/lib/modules";
import { PreviewBanner } from "./PreviewBanner";

/** Página honesta para módulo ainda não construído: diz quando chega e o que terá. */
export function ComingModule({ id }: { id: string }) {
  const m = getModule(id);
  return (
    <div className="mx-auto max-w-2xl">
      <PreviewBanner />
      <header className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ember-soft text-ember">
          <m.icon aria-hidden className="size-7" strokeWidth={1.6} />
        </span>
        <div>
          <h1 className="text-[34px] font-light leading-tight tracking-tight">{m.label}</h1>
          <p className="text-ink-2">{m.summary}</p>
        </div>
      </header>

      <section className="surface mt-8 rounded-panel p-6 sm:p-8">
        <h2 className="text-[19px] font-semibold">Ainda não construído</h2>
        <p className="mt-1 text-ink-2">
          Este módulo entra na {m.phase} do plano. Nada aqui é simulado: ele só aparece com dados
          quando estiver funcionando de verdade.
        </p>
        <h3 className="mt-6 text-[13px] font-medium text-ink-3">O que vai ter aqui</h3>
        <ul className="mt-2 divide-y divide-line">
          {m.planned.map((item, i) => (
            <li key={item} className="rise py-3" style={{ "--i": i } as CSSProperties}>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
