import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportsQueue, type ModerationReport } from "@/components/admin/ReportsQueue";

// Query directa con la sesión del admin, no una RPC: la RLS de
// content_reports ya permite SELECT total a is_admin (§3.3 de
// WEB_SPECIFICATION.md — a diferencia de app_feedback, que no tiene
// policy de SELECT en absoluto y sí necesita el RPC de la página vecina).
export default async function ModerationPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_reports")
    .select(
      `
      id,
      reported_entity_type,
      reported_entity_id,
      reason,
      status,
      created_at,
      reporter:profiles!content_reports_reporter_id_fkey (
        id,
        username,
        full_name
      )
    `
    )
    .order("created_at", { ascending: true });

  const reports: ModerationReport[] = data ?? [];

  // Los PENDING más viejos primero (mismo criterio que el índice
  // content_reports_status_created_at_idx de la migración de origen): son
  // los más urgentes de atender. Array.prototype.sort es estable, así que
  // dentro de cada grupo se conserva el orden ascendente por fecha del
  // SELECT.
  const sorted = [...reports].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return 0;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase text-neutral-on-surface">
            Moderación
          </h1>
          <p className="text-sm text-neutral-on-surface-variant">
            Denuncias de usuarios sobre perfiles y partidos.
          </p>
        </div>
        <Link
          href="/dashboard/moderation/feedback"
          className="rounded-md border border-neutral-outline px-3 py-2 text-sm font-semibold text-neutral-on-surface transition hover:bg-surface-container"
        >
          Ver feedback →
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar las denuncias: {error.message}
        </p>
      ) : (
        <ReportsQueue reports={sorted} />
      )}
    </div>
  );
}
