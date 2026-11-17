import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <div className="backdrop" aria-hidden />
      <main className="flex min-h-dvh items-center justify-center px-5">
        <div className="glass max-w-md rounded-panel p-8">
          <h1 className="text-[28px] font-light tracking-tight">Página não encontrada</h1>
          <p className="mt-2 text-ink-2">Este endereço não existe no Life OS.</p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-ember px-5 font-semibold text-on-ember"
          >
            Ir para a Home
          </Link>
        </div>
      </main>
    </>
  );
}
