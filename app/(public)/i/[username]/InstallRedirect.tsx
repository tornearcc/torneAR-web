"use client";

import { useEffect } from "react";

/**
 * Intento de auto-redirect al scheme nativo (Fase 6.1 del roadmap).
 * Cubre el caso en que el Universal Link no fue interceptado por el SO —
 * un build sin el entitlement de Associated Domains todavía, o un Android
 * sin el App Link verificado — pero la app sí está instalada y el scheme
 * `tornear://login?ref=<username>` ya funciona (implementado y testeado
 * en tornear/lib/deep-linking.ts). `href` lo arma `deep-link.ts` — trae el
 * `ref` y, desde Fase 3 de Marketing & Growth, los UTM de campaña que haya
 * en la URL de esta página.
 *
 * No hay forma portable de "esperar y mostrar un fallback si falla": cada
 * navegador mobile maneja distinto la navegación a un scheme desconocido
 * (algunos abren un prompt nativo, otros no hacen nada visible). Por eso
 * el CTA de descarga de la página de al lado siempre está visible, no se
 * oculta esperando a que este intento resuelva.
 */
export function InstallRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.href = href;
  }, [href]);

  return null;
}
