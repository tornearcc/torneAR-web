/**
 * Fondo decorativo: la grilla de una pizarra táctica, el círculo central y la
 * línea media de una cancha, en trazos de 1px casi transparentes.
 *
 * Es CSS puro a propósito — cero bytes de imagen en la página que se abre con
 * datos móviles. El padre tiene que ser `relative isolate` para que esto quede
 * detrás del contenido sin pelear con otros `z-index`.
 */
export function PitchLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(229,226,225,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(229,226,225,0.04)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]" />
      <div className="absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-primary/15" />
      <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/25" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-brand-primary/10" />
    </div>
  );
}
