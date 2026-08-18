import { createClient } from "@/lib/supabase/server";
import { ActivityChart } from "@/components/charts/ActivityChart";

export default async function ActivityPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("dashboard_matches_by_status");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl uppercase text-neutral-on-surface">Actividad</h1>
        <p className="text-sm text-neutral-on-surface-variant">
          Distribución de partidos por estado actual.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudo cargar la actividad: {error.message}
        </p>
      ) : (
        <ActivityChart data={data ?? []} />
      )}
    </div>
  );
}
