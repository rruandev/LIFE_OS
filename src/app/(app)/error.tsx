"use client";

import { Button } from "@/components/ui/Button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="surface mx-auto mt-10 max-w-lg rounded-panel p-8">
      <h1 className="text-[22px] font-semibold">Esta tela não carregou</h1>
      <p className="mt-2 text-ink-2">
        Algo falhou ao montar a página. Seus dados não foram alterados. Tente de novo; se continuar,
        recarregue o app.
      </p>
      <Button className="mt-6" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  );
}
