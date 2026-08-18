import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/route-handler";
import type { Database } from "@/types/supabase";

const VALID_PLATFORMS = ["ios", "android"] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

type VersionUpdate = Database["public"]["Tables"]["app_versions"]["Update"];

const EDITABLE_FIELDS = ["min_required_version", "latest_version", "update_url"] as const;

function isPlatform(value: string): value is Platform {
  return (VALID_PLATFORMS as readonly string[]).includes(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { platform } = await params;

  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "platform debe ser ios o android." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const update: VersionUpdate = {};
  for (const field of EDITABLE_FIELDS) {
    const fieldValue = (body as Record<string, unknown>)[field];
    if (fieldValue === undefined) continue;
    if (typeof fieldValue !== "string" || fieldValue.trim() === "") {
      return NextResponse.json(
        { error: `${field} debe ser un texto no vacío.` },
        { status: 400 }
      );
    }
    update[field] = fieldValue;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No se recibió ningún campo para actualizar." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Los CHECK de la tabla (formato semver-lite y update_url ~ '^https://',
  // ver 20260804122000_app_versions_force_update.sql) son la validación
  // real de fondo — acá sólo se filtra basura obvia antes para devolver un
  // mensaje más claro que un CHECK violado sin procesar.
  const { data, error } = await supabase
    .from("app_versions")
    .update(update)
    .eq("platform", platform)
    .select("platform, min_required_version, latest_version, update_url, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Plataforma no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ version: data });
}
