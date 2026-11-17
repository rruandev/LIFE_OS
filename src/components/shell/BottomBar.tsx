"use client";

import { Bell, Ellipsis, LogOut, Plus, Search, Settings, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { isActive, MOBILE_PRIMARY, MODULES } from "@/lib/modules";
import { setPanel } from "@/lib/ui";
import { NavIndicator } from "./NavIndicator";
import { useAlerts } from "./useAlerts";

const primary = MODULES.filter((m) => MOBILE_PRIMARY.includes(m.id));
const rest = MODULES.filter((m) => !MOBILE_PRIMARY.includes(m.id));

export function BottomBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const alerts = useAlerts();
  const inRest = rest.some((m) => isActive(pathname, m.href)) || isActive(pathname, "/settings");
  const activeKey = inRest ? "more" : (primary.find((m) => isActive(pathname, m.href))?.id ?? null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav
        ref={bar}
        aria-label="Módulos"
        className="glass fixed inset-x-3 z-30 flex items-stretch justify-between rounded-full p-1.5 lg:hidden"
        style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <NavIndicator container={bar} activeKey={activeKey} axis="x" />
        {primary.map((m, i) => {
          const active = isActive(pathname, m.href);
          return (
            <Fragment key={m.id}>
            {i === 2 && (
              <button
                type="button"
                onClick={() => setPanel("capture")}
                aria-label="Captura rápida"
                className="press relative z-10 mx-1 flex size-14 shrink-0 items-center justify-center rounded-full bg-ember text-on-ember shadow-[0_6px_20px_-6px_var(--ember)]"
              >
                <Plus aria-hidden className="size-6" strokeWidth={2.4} />
              </button>
            )}
            <Link
              href={m.href}
              data-nav-key={m.id}
              aria-current={active ? "page" : undefined}
              className={`press relative z-10 flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] ${
                active ? "font-semibold text-on-ember" : "text-ink-2"
              }`}
            >
              <m.icon aria-hidden className="size-[22px]" strokeWidth={1.8} />
              <span>{m.label}</span>
            </Link>
            </Fragment>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-nav-key="more"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`press relative z-10 flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] ${
            inRest ? "font-semibold text-on-ember" : "text-ink-2"
          }`}
        >
          <span className="relative">
            <Ellipsis aria-hidden className="size-[22px]" strokeWidth={1.8} />
            {alerts.length > 0 && !inRest && <span className="absolute -right-1.5 -top-0.5 size-2.5 rounded-full bg-ember" />}
          </span>
          <span>Mais</span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Mais módulos">
            <motion.button
              type="button"
              aria-label="Fechar"
              className="absolute inset-0 bg-black/55"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="surface absolute inset-x-3 rounded-panel p-3"
              style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "110%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                // Arrastar para baixo fecha, como as folhas do iOS.
                if (info.offset.y > 90 || info.velocity.y > 600) setOpen(false);
              }}
            >
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" />
              <div className="flex items-center justify-between px-3 pb-2 pt-1">
                <h2 className="text-[17px] font-semibold">Mais</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="press flex size-10 items-center justify-center rounded-full bg-field text-ink-2"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPanel("search");
                  }}
                  className="press flex h-12 items-center justify-center gap-2 rounded-full bg-field font-medium"
                >
                  <Search aria-hidden className="size-5" strokeWidth={1.8} />
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPanel("alerts");
                  }}
                  className="press flex h-12 items-center justify-center gap-2 rounded-full bg-field font-medium"
                >
                  <Bell aria-hidden className="size-5" strokeWidth={1.8} />
                  Notificações
                  {alerts.length > 0 && (
                    <span className="rounded-full bg-ember px-2 text-[12px] font-semibold tabular-nums text-on-ember">{alerts.length}</span>
                  )}
                </button>
              </div>
              <ul className="max-h-[46dvh] overflow-y-auto">
                {rest.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={m.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(pathname, m.href) ? "page" : undefined}
                      className="press flex min-h-14 items-center gap-3.5 rounded-item px-3 aria-[current=page]:bg-field"
                    >
                      <m.icon aria-hidden className="size-[22px] shrink-0 text-ink-2" strokeWidth={1.8} />
                      <span className="flex-1">
                        <span className="block font-medium">{m.label}</span>
                        <span className="block text-[13px] text-ink-3">{m.summary}</span>
                      </span>
                      {!m.ready && <span className="text-[12px] text-ink-3">{m.phase}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2 border-t border-line pt-3">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="press flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-field font-medium"
                >
                  <Settings aria-hidden className="size-5" strokeWidth={1.8} />
                  Configurações
                </Link>
                {isSupabaseConfigured && (
                  <form action={signOut} className="flex-1">
                    <button
                      type="submit"
                      className="press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-field font-medium"
                    >
                      <LogOut aria-hidden className="size-5" strokeWidth={1.8} />
                      Sair
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
