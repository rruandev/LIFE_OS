"use client";

import { useEffect } from "react";
import { loadRemoteSettings } from "@/lib/settings/store";

/** Carrega perfil e preferências da nuvem uma vez, ao abrir o app. */
export function SettingsSync() {
  useEffect(() => {
    void loadRemoteSettings();
  }, []);
  return null;
}
