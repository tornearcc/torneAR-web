// Cero llamadas a Supabase a propósito (§0 y §3.2 de WEB_SPECIFICATION.md):
// hoy hay 0 filas en profiles.referred_by y 0 eventos referral.resolve en
// app_logs. El panel se construye igual, con su empty-state explícito, y
// se activa recién cuando el Soft Launch genere datos reales — no antes,
// para no mostrar un gráfico en cero que se lea como bug.
export default function ViralPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl uppercase text-neutral-on-surface">Viralidad</h1>
        <p className="text-sm text-neutral-on-surface-variant">
          Tasa de referidos, top embajadores y coeficiente viral.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-outline-variant bg-surface-container px-6 py-24 text-center">
        <p className="font-display text-xl uppercase text-neutral-on-surface">
          Sin datos todavía
        </p>
        <p className="max-w-md text-sm text-neutral-on-surface-variant">
          Este panel se activará cuando el Soft Launch genere los primeros usuarios y
          embajadores.
        </p>
      </div>
    </div>
  );
}
