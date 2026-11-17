"use client";

import { Fragment, type ReactNode } from "react";
import { useOpenVersion } from "@/lib/ui";

/** Remonta a tela quando a busca pede para abrir um item, para ela começar já nele. */
export function FocusBoundary({ children }: { children: ReactNode }) {
  const version = useOpenVersion();
  return <Fragment key={version}>{children}</Fragment>;
}
