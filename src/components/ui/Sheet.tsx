"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

/** Folha modal: sobe de baixo no celular, fica centralizada no computador. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/55"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="surface relative max-h-[92dvh] w-full overflow-y-auto rounded-t-panel p-6 pb-[max(24px,env(safe-area-inset-bottom))] lg:max-w-[500px] lg:rounded-panel lg:pb-6"
            initial={{ y: "60%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "60%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="press flex size-10 shrink-0 items-center justify-center rounded-full bg-field text-ink-2"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
