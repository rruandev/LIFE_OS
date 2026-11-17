import type { ReactNode } from "react";
import { BrandMark } from "@/components/shell/Brand";
import { ClearData } from "@/components/shell/ClearData";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="backdrop" aria-hidden />
      <ClearData />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="text-[19px] font-semibold tracking-tight">Life OS</span>
        </div>
        {children}
      </main>
    </>
  );
}
