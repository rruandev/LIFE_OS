"use client";

import { useEffect } from "react";
import { resetCollections } from "@/lib/data/collection";

/** Nas telas de login não há conta ativa: esvazia os dados em memória da sessão anterior. */
export function ClearData() {
  useEffect(() => resetCollections(), []);
  return null;
}
