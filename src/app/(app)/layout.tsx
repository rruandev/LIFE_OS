import type { ReactNode } from "react";
import { BottomBar } from "@/components/shell/BottomBar";
import { SettingsSync } from "@/components/shell/SettingsSync";
import { Sidebar } from "@/components/shell/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="backdrop" aria-hidden />
      <SettingsSync />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ember focus:px-4 focus:py-2 focus:text-on-ember"
      >
        Pular para o conteúdo
      </a>
      <Sidebar />
      <main
        id="conteudo"
        className="app-main min-h-dvh px-5 pb-32 pt-8 sm:px-8 lg:pb-12 lg:pl-[calc(var(--sidebar-w)+24px)] lg:pr-10 lg:pt-10"
      >
        {children}
      </main>
      <BottomBar />
    </>
  );
}
