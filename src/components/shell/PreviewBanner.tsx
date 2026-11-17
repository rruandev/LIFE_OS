import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/config";

/** Aparece só enquanto o banco não está conectado, para ninguém confundir com o app final. */
export function PreviewBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <p className="surface mb-6 rounded-item px-4 py-3 text-[14px] leading-snug text-ink-2">
      <strong className="font-semibold text-ink">Pré-visualização.</strong> O banco de dados ainda não
      está conectado: não há login e as preferências ficam só neste aparelho.{" "}
      <Link href="/settings#conta" className="text-ember underline underline-offset-4">
        Como conectar
      </Link>
    </p>
  );
}
