"use client";

import { useEffect, useState } from "react";

/** «Quedan N de 100 lugares» del hero. Mientras carga (o si falla) no promete un número. */
export function SlotsCounter() {
  const [slots, setSlots] = useState<{ left: number; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/embajadores/tablero")
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (!cancelled && b && typeof b.slots_total === "number" && typeof b.slots_used === "number") {
          setSlots({ left: Math.max(b.slots_total - b.slots_used, 0), total: b.slots_total });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p className="text-sm font-bold text-neutral-on-surface-variant" aria-live="polite">
      {slots ? `Quedan ${slots.left} de ${slots.total} lugares` : "Hay 100 lugares en total"}
    </p>
  );
}
