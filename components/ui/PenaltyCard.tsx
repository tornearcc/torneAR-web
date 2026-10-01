import { cn } from "@/lib/utils";

/**
 * La tarjeta del árbitro con un número adentro: el elemento que dice «acá hay
 * algo para hacer». Amarilla = requiere atención, roja = crítico.
 *
 * Con `count` en 0 no se pinta de color: queda el contorno de tiza con el
 * cero apagado, porque la regla del dashboard es que la amarilla y la roja
 * sólo aparecen cuando hay algo que hacer. En la barra lateral (`size="sm"`)
 * el 0 directamente no se renderiza.
 *
 * El número va aria-hidden: quien la usa pone el texto accesible completo
 * («2 disputas pendientes») en el link o botón que la contiene.
 */
export function PenaltyCard({
  count,
  tone = "yellow",
  size = "sm",
  className,
}: {
  count: number;
  tone?: "yellow" | "red";
  size?: "sm" | "lg";
  className?: string;
}) {
  const active = count > 0;
  if (!active && size === "sm") return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display inline-flex shrink-0 items-center justify-center leading-none tabular-nums",
        size === "sm"
          ? "h-[22px] min-w-[16px] rounded-[3px] px-[3px] text-[13px] font-bold"
          : "h-[76px] w-[56px] rounded-[5px] text-[44px] font-extrabold",
        active
          ? cn(
              "text-on-card shadow-[0_1px_0_rgb(0_0_0/0.35)]",
              tone === "yellow" ? "bg-card-yellow" : "bg-card-red",
              // Levemente inclinada, como la levanta el árbitro. Sólo con
              // algo pendiente: la tarjeta en 0 está «guardada», derecha.
              size === "lg" ? "-rotate-[4deg]" : "-rotate-[5deg]",
            )
          : "border border-chalk-line text-chalk-faint",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
