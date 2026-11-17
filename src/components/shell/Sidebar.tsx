"use client";

import { LogOut, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { signOut } from "@/app/(auth)/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { isActive, MODULES } from "@/lib/modules";
import { updateSettings, useSettings } from "@/lib/settings/store";
import { BrandMark } from "./Brand";
import { NavIndicator } from "./NavIndicator";

const row =
  "nav-row press relative z-10 flex h-11 items-center gap-3 rounded-full px-3.5 text-[15px]";

export function Sidebar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const compact = settings.sidebar === "compact";
  const aside = useRef<HTMLElement>(null);

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
