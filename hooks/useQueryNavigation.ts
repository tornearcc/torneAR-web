"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Navegación por query string, compartida por los controles del explorador de
 * logs (toolbar, paginador, gráfico clickeable).
 *
 * Existe para que los tres coincidan en dos comportamientos que si se
 * implementan por separado terminan divergiendo:
 *
 * 1. Cada control muta SÓLO su parámetro y preserva el resto. Reconstruir el
 *    query desde cero haría que cambiar de página borre los filtros, o que
 *    filtrar por nivel resetee el rango de fechas.
 * 2. Cualquier cambio de filtro vuelve a la página 1. Filtrar estando en la
 *    página 7 y quedarse en la 7 muestra una tabla vacía y parece un bug.
 */
export function useQueryNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParams = useCallback(
    (
      updates: Record<string, string | number | null>,
      options?: { resetPage?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        // `null` o string vacío = sacar el parámetro. Deja la URL limpia en
        // vez de arrastrar `?q=&level=` cuando el filtro se vacía.
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      if (options?.resetPage !== false && !("page" in updates)) {
        next.delete("page");
      }

      startTransition(() => {
        router.push(next.size > 0 ? `${pathname}?${next}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  return { setParams, isPending, searchParams };
}
