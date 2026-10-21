/**
 * Maqueta fiel del campo «¿Quién los invitó?» de la pantalla «Crear equipo» de
 * la app (HTML/CSS, no una captura). Si cambia el campo en la app, cambiarlo acá.
 */
export function FieldMock() {
  return (
    <div
      role="img"
      aria-label="Pantalla Crear equipo de la app con el campo «¿Quién los invitó? (opcional)» resaltado"
      className="mx-auto w-full max-w-xs rounded-[2rem] border-4 border-surface-variant bg-surface-lowest p-4 shadow-xl"
    >
      <p className="font-display text-center text-lg font-bold text-neutral-on-surface uppercase">Crear equipo</p>
      <div className="mt-4 flex flex-col gap-3 opacity-50">
        <div className="h-10 rounded-lg bg-surface-high" />
        <div className="h-10 rounded-lg bg-surface-high" />
        <div className="h-10 rounded-lg bg-surface-high" />
      </div>
      <div className="relative mt-4 rounded-xl border-2 border-brand-gold bg-brand-gold/10 p-3 shadow-[0_0_0_4px_rgba(250,189,50,0.15)]">
        <span
          aria-hidden="true"
          className="absolute -top-3 -right-2 rounded-full bg-brand-gold px-2 py-0.5 text-xs font-bold text-surface-lowest"
        >
          Acá
        </span>
        <p className="text-sm font-bold text-neutral-on-surface">¿Quién los invitó? (opcional)</p>
        <div className="mt-2 rounded-lg border border-neutral-outline-variant bg-surface-container px-3 py-2.5 text-sm text-neutral-outline">
          Usuario del embajador
        </div>
        <p className="mt-2 text-xs text-neutral-on-surface-variant">
          Si alguien te trajo a torneAR, poné su usuario. Podés cargarlo hasta 24 horas después de crear el equipo.
        </p>
      </div>
      <div className="mt-4 h-11 rounded-xl bg-brand-primary opacity-50" />
    </div>
  );
}
