import { createClient } from "@/lib/supabase/server";
import { LogsChart } from "@/components/charts/LogsChart";
import { LogsExplorer } from "@/components/admin/LogsExplorer";

const SERIES_DAYS = 30;
const EXPLORER_LIMIT = 100;

// Único panel con datos reales hoy (§6 Hito 4 de WEB_SPECIFICATION.md:
// ~916 filas en app_logs) — sirve de prueba end-to-end del patrón
// RPC + Recharts antes de construir los paneles que hoy están en 0 filas.
export default async function HealthPage() {
  const supabase = await createClient();

  const [seriesResult, logsResult] = await Promise.all([
    supabase.rpc("dashboard_logs_by_level", { days: SERIES_DAYS }),
    supabase
      .from("app_logs")
      .select("id, level, message, details, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(EXPLORER_LIMIT),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl uppercase text-neutral-on-surface">
          Salud técnica
        </h1>
        <p className="text-sm text-neutral-on-surface-variant">
          Errores por día (últimos {SERIES_DAYS} días) y los {EXPLORER_LIMIT} logs más
          recientes.
        </p>
      </div>

      {seriesResult.error ? (
        <ErrorBox context="la serie de logs" message={seriesResult.error.message} />
      ) : (
        <LogsChart data={seriesResult.data ?? []} />
      )}

      {logsResult.error ? (
        <ErrorBox context="el explorador de logs" message={logsResult.error.message} />
      ) : (
        <LogsExplorer logs={logsResult.data ?? []} />
      )}
    </div>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
      No se pudo cargar {context}: {message}
    </p>
  );
}
