import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/route-handler";
import type { Database } from "@/types/supabase";

type ReportStatus = Database["public"]["Enums"]["report_status"];

const VALID_STATUSES: readonly ReportStatus[] = [
  "PENDING",
  "REVIEWED",
  "DISMISSED",
  "ACTIONED",
];

// `Array.includes` no angosta el tipo de `value` por sí solo; un type
// predicate explícito es lo que deja `status` tipado como `ReportStatus`
// (no `string`) después del `if` de abajo.
function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const status =
    typeof body === "object" && body !== null && "status" in body
      ? (body as { status: unknown }).status
      : undefined;

  if (!isReportStatus(status)) {
    return NextResponse.json(
      { error: `status debe ser uno de: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // El GRANT de content_reports sólo permite UPDATE(status) — ni con
  // is_admin se puede tocar otra columna desde acá (ver
  // 20260818140000_store_debt_account_reports_feedback.sql). La policy de
  // UPDATE también exige is_admin de nuevo a nivel de fila (RLS): cinturón
  // y tirantes con requireAdminApi(), no una verificación redundante.
  const { data, error } = await supabase
    .from("content_reports")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Denuncia no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}
