"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toaster de la zona admin.
 *
 * La versión que genera shadcn lee el tema con `useTheme()` de next-themes.
 * Acá se hardcodea `theme="dark"` y se saca esa dependencia: el dashboard es
 * dark-only y no hay ThemeProvider en el árbol, así que `useTheme()`
 * devolvería `"system"` y los toasts saldrían claros sobre la UI oscura en
 * cualquier admin con el sistema en modo claro.
 *
 * Las variables `--normal-*` apuntan al puente de tokens de globals.css, así
 * que el toast hereda la marca sin estilos propios.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
