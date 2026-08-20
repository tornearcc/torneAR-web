import { cn } from "@/lib/utils";

/**
 * Wrapper de entrada de página. Server Component a propósito: la animación es
 * CSS puro (`@starting-style` en globals.css), así que no hay nada que
 * hidratar ni un solo kB de JS enviado al cliente.
 *
 * Envuelve el contenido de cada `page.tsx`. Al navegar, el App Router remonta
 * este subárbol y `@starting-style` da el primer frame — el mismo mecanismo
 * que un `initial` de framer-motion, sin la librería.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("page-enter flex flex-col gap-8", className)}>{children}</div>
  );
}

