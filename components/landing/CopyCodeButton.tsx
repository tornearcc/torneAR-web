"use client";

import { useEffect, useState } from "react";

/**
 * Botón «Copiar» para los códigos de invitación de /i/<username>.
 *
 * Quien ve esa página todavía no tiene la app, y el código lo pide recién
 * después de bajarla y registrarse: la tienda no se lo pasa a la app. Copiarlo
 * antes de ir a la tienda le ahorra tener que acordárselo o volver a esta
 * página.
 *
 * El aviso «Copiado» va en una región `aria-live` para que también lo anuncie
 * el lector de pantalla. Si el navegador no deja escribir en el portapapeles
 * (algunos navegadores internos de apps), se avisa en vez de fallar callado.
 */
export function CopyCodeButton({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-3 py-1.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
        Copiar código
      </button>
      <span aria-live="polite" className="text-sm text-neutral-on-surface-variant">
        {status === "copied" && "¡Copiado!"}
        {status === "failed" && "No se pudo copiar: anotalo"}
      </span>
    </div>
  );
}
