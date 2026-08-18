import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/route-handler";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { key } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const value =
    typeof body === "object" && body !== null && "value" in body
      ? (body as { value: unknown }).value
      : undefined;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return NextResponse.json({ error: "value debe ser un número." }, { status: 400 });
  }

  const supabase = await createClient();

  // El GRANT de app_settings sólo permite UPDATE(value) — ni con is_admin
  // se puede tocar `description` desde acá (ver migración
  // 20260818180000_dashboard_settings_versions_write.sql). La policy de
  // UPDATE también exige is_admin de nuevo a nivel de fila: cinturón y
  // tirantes con requireAdminApi(), como en /api/admin/reports/[id].
  const { data, error } = await supabase
    .from("app_settings")
    .update({ value })
    .eq("key", key)
    .select("key, value, description, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Parámetro no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ setting: data });
}
