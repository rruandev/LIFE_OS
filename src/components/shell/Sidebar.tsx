"use client";

import { Bell, LogOut, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { signOut } from "@/app/(auth)/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { isActive, MODULES } from "@/lib/modules";
import { updateSettings, useSettings } from "@/lib/settings/store";
import { setPanel } from "@/lib/ui";
import { useAlerts } from "./useAlerts";
import { BrandMark } from "./Brand";
import { NavIndicator } from "./NavIndicator";

const row =
  "nav-row press relative z-10 flex h-11 items-center gap-3 rounded-full px-3.5 text-[15px]";

export function Sidebar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const compact = settings.sidebar === "compact";
  const aside = useRef<HTMLElement>(null);
  const alerts = useAlerts();

  const onSettings = isActive(pathname, "/settings");
  const activeKey = onSettings ? "settings" : (MODULES.find((m) => isActive(pathname, m.href))?.id ?? null);

  return (
    <aside
      ref={aside}
      className="sidebar glass fixed bottom-4 left-4 top-4 z-30 hidden flex-col rounded-panel p-3 lg:flex"
      style={{ width: "calc(var(--sidebar-w) - 32px)" }}
    >
      <NavIndicator container={aside} activeKey={activeKey} axis="y" />

      <Link
        href="/"
        className="nav-row press relative z-10 mb-4 flex h-12 items-center gap-3 rounded-full px-2"
        aria-label="Life OS, ir para a Home"
      >
        <BrandMark className="size-9 shrink-0" />
        <span className="nav-label text-[17px] font-semibold tracking-tight">Life OS</span>
      </Link>

      <div className="mb-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setPanel("capture")}
          title="Captura rápida (Ctrl J)"
          className={`${row} bg-ember-soft font-medium text-ink hover:brightness-110`}
        >
          <Plus aria-hidden className="size-5 shrink-0 text-ember" strokeWidth={2.2} />
          <span className="nav-label">Capturar</span>
        </button>
        <button
          type="button"
          onClick={() => setPanel("search")}
          title="Buscar (Ctrl K)"
          className={`${row} text-ink-2 hover:bg-field hover:text-ink`}
        >
          <Search aria-hidden className="size-5 shrink-0" strokeWidth={1.8} />
          <span className="nav-label flex-1 text-left">Buscar</span>
          <kbd className="nav-label rounded-md border border-line px-1.5 text-[11px] text-ink-3">Ctrl K</kbd>
        </button>
      </div>

      <nav aria-label="Módulos" className="flex flex-1 flex-col gap-1">
        {MODULES.map((m) => {
          const active = activeKey === m.id;
          return (
            <Link
              key={m.id}
              href={m.href}
              data-nav-key={m.id}
              aria-current={active ? "page" : undefined}
              title={m.ready ? m.label : `${m.label}: chega na ${m.phase}`}
              className={`${row} ${
                active
                  ? "font-semibold text-on-ember"
                  : m.ready
                    ? "text-ink hover:bg-field"
                    : "text-ink-3 hover:bg-field hover:text-ink-2"
              }`}
            >
              <m.icon aria-hidden className="size-5 shrink-0" strokeWidth={1.8} />
              <span className="nav-label truncate">{m.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setPanel("alerts")}
          title="Notificações"
          aria-label={`Notificações: ${alerts.length}`}
          className={`${row} text-ink-2 hover:bg-field hover:text-ink`}
        >
          <span className="relative shrink-0">
            <Bell aria-hidden className="size-5" strokeWidth={1.8} />
            {alerts.length > 0 && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-ember" />}
          </span>
          <span className="nav-label flex-1 text-left">Notificações</span>
          {alerts.length > 0 && (
            <span className="nav-label rounded-full bg-ember px-2 text-[12px] font-semibold tabular-nums text-on-ember">{alerts.length}</span>
          )}
        </button>
        <Link
          href="/settings"
          data-nav-key="settings"
          aria-current={onSettings ? "page" : undefined}
          title="Configurações"
          className={`${row} ${onSettings ? "font-semibold text-on-ember" : "text-ink-2 hover:bg-field hover:text-ink"}`}
        >
          <Settings aria-hidden className="size-5 shrink-0" strokeWidth={1.8} />
          <span className="nav-label">Configurações</span>
        </Link>
        <button
          type="button"
          onClick={() => updateSettings({ sidebar: compact ? "expanded" : "compact" })}
          aria-pressed={compact}
          aria-label={compact ? "Expandir barra" : "Recolher barra"}
          title={compact ? "Expandir barra" : "Recolher barra"}
          className={`${row} text-ink-2 hover:bg-field hover:text-ink`}
        >
          {compact ? (
            <PanelLeftOpen aria-hidden className="size-5 shrink-0" strokeWidth={1.8} />
          ) : (
            <PanelLeftClose aria-hidden className="size-5 shrink-0" strokeWidth={1.8} />
          )}
          <span className="nav-label">Recolher barra</span>
        </button>
        {isSupabaseConfigured && (
          <form action={signOut}>
            <button type="submit" title="Sair" className={`${row} w-full text-ink-2 hover:bg-field hover:text-ink`}>
              <LogOut aria-hidden className="size-5 shrink-0" strokeWidth={1.8} />
              <span className="nav-label">Sair</span>
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
