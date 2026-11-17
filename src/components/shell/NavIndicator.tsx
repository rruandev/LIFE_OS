"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";

type Box = { x: number; y: number; w: number; h: number; slide: boolean };

/**
 * Indicador único que desliza até o item ativo (marcado com data-nav-key).
 * Desliza quando a rota muda; acompanha sem atraso quando só o tamanho muda
 * (barra recolhendo, janela redimensionando).
 */
export function NavIndicator({
  container,
  activeKey,
  axis,
}: {
  container: RefObject<HTMLElement | null>;
  activeKey: string | null;
  axis: "x" | "y";
}) {
  const [box, setBox] = useState<Box | null>(null);
  const measuredKey = useRef<string | null>(null);

  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const measure = () => {
      const el = activeKey ? root.querySelector<HTMLElement>(`[data-nav-key="${activeKey}"]`) : null;
      const a = root.getBoundingClientRect();
      const b = el?.getBoundingClientRect();
      if (!b || b.width === 0) {
        measuredKey.current = null;
        return setBox(null);
      }
      const slide = measuredKey.current !== null && measuredKey.current !== activeKey;
      measuredKey.current = activeKey;
      setBox({
        x: b.left - a.left - root.clientLeft,
        y: b.top - a.top - root.clientTop,
        w: b.width,
        h: b.height,
        slide,
      });
    };
    // O observer dispara uma vez ao ser ligado e depois a cada mudança de tamanho.
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [container, activeKey]);

  if (!box) return null;
  const spring = { type: "spring" as const, stiffness: 330, damping: 30, mass: 0.9 };

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      initial={false}
      animate={{ x: box.x, y: box.y, width: box.w, height: box.h }}
      transition={box.slide ? spring : { duration: 0 }}
    >
      {/* A pílula estica na direção do movimento e assenta, como uma gota. */}
      <motion.span
        key={activeKey}
        className="block size-full rounded-full bg-ember shadow-[0_6px_20px_-6px_var(--ember)]"
        initial={
          box.slide
            ? axis === "x"
              ? { scaleX: 1.22, scaleY: 0.86 }
              : { scaleX: 0.94, scaleY: 1.22 }
            : false
        }
        animate={{ scaleX: 1, scaleY: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 17 }}
      />
    </motion.span>
  );
}
