import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { ReportsQueue, type ModerationReport } from "@/components/admin/ReportsQueue";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedFilter } from "@/components/ui/SegmentedFilter";
import type { Database } from "@/types/supabase";

type ReportStatus = Database["public"]["Enums"]["report_status"];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendientes" },
  { value: "REVIEWED", label: "Revisadas" },
  { value: "DISMISSED", label: "Desestimadas" },
  { value: "all", label: "Todas" },
] as const;

const PAGE_SIZE = 25;

function resolveStatus(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return STATUS_OPTIONS.some((o) => o.value === raw) ? raw! : "PENDING";
}

function resolvePage(value: string | string[] | undefined): number {
  const raw = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

// Query directa con la sesión del admin, no una RPC: la RLS de content_reports
// ya permite SELECT total a is_admin (§3.3 de WEB_SPECIFICATION.md — a
// diferencia de app_feedback, que no tiene policy de SELECT en absoluto y sí
// necesita el RPC de la página vecina).
export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const status = resolveStatus(params.status);
  const page = resolvePage(params.page);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
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
    `,
      { count: "exact" },
    );

  if (status !== "all") {
    query = query.eq("status", status as ReportStatus);
  }

  // Ascendente = lo más viejo primero, que es lo más urgente de atender (mismo
  // criterio que el índice content_reports_status_created_at_idx). Antes esto
  // se resolvía trayendo TODAS las denuncias y ordenándolas en JS con un sort
  // que ponía los PENDING arriba; con el filtro de estado por defecto en
  // "Pendientes", ese ordenamiento artificial deja de hacer falta y la
  // paginación puede ser real.
  const { data, count, error } = await query
    .order("created_at", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  // `reported_entity_id` es polimórfico (USER o MATCH, sin FK real — §3.3), así
  // que PostgREST no lo puede embeber. Se resuelve con un segundo SELECT
  // batcheado (no N+1) sólo para las denuncias de tipo USER: sin esto, el botón
  // de suspender mostraría nada más que un UUID truncado, y banear a alguien sin
  // poder confirmar de un vistazo a quién es un riesgo real de click equivocado.
  const userReportIds = Array.from(
    new Set(
      (data ?? [])
        .filter((report) => report.reported_entity_type === "USER")
        .map((report) => report.reported_entity_id),
    ),
  );

  const reportedUsersById = new Map<string, { id: string; username: string; full_name: string }>();
  let suspendedProfileIds: string[] = [];

  if (userReportIds.length > 0) {
    const [profilesResult, suspensionResult] = await Promise.all([
      supabase.from("profiles").select("id, username, full_name").in("id", userReportIds),
      // NO se puede leer con un SELECT: vive en `auth.users.banned_until`, y
      // Supabase no expone el schema `auth` a PostgREST. De ahí la RPC
      // `admin_get_suspension_status`, que además valida is_admin adentro.
      supabase.rpc("admin_get_suspension_status", { p_profile_ids: userReportIds }),
    ]);

    for (const profile of profilesResult.data ?? []) {
      reportedUsersById.set(profile.id, profile);
    }

    // Falla no bloqueante: si la RPC devuelve error, la lista se renderiza igual
    // con el estado desconocido (= nadie suspendido). Perder la cola entera
    // porque no se pudo resolver un badge sería peor que mostrar el botón de
    // suspender sobre alguien que ya lo está — caso que la propia RPC maneja.
    if (suspensionResult.error) {
      console.error(
        "[moderation] admin_get_suspension_status falló:",
        suspensionResult.error.message,
      );
    } else {
      suspendedProfileIds = (suspensionResult.data ?? [])
        .filter((row) => row.is_suspended)
        .map((row) => row.profile_id);
    }
  }

  const reports: ModerationReport[] = (data ?? []).map((report) => ({
    ...report,
    reportedUser:
      report.reported_entity_type === "USER"
        ? (reportedUsersById.get(report.reported_entity_id) ?? null)
        : null,
  }));

  return (
    <PageTransition className="gap-6">
      <PageHeader
        title="Moderación"
        description="Denuncias de usuarios sobre perfiles y partidos."
        actions={
          <Link
            href="/dashboard/moderation/feedback"
            className="rounded-md border border-neutral-outline px-3 py-2 text-sm font-semibold text-neutral-on-surface transition hover:bg-surface-container"
          >
            Ver feedback →
          </Link>
        }
      />

      <SegmentedFilter
        param="status"
        options={STATUS_OPTIONS}
        active={status}
        defaultValue="PENDING"
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar las denuncias: {error.message}
        </p>
      ) : (
        <>
          <ReportsQueue reports={reports} suspendedProfileIds={suspendedProfileIds} />
          <Pagination page={page} size={PAGE_SIZE} total={count ?? 0} />
        </>
      )}
    </PageTransition>
  );
}
