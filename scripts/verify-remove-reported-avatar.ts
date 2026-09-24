/**
 * Verificación de "Quitar foto" contra el Supabase LOCAL (`supabase start` en
 * el repo de la app, con la migración 20260924140000 aplicada).
 *
 * Corre la misma función que usa la Server Action (`removeReportedAvatar`)
 * con la sesión real de un admin —un JWT firmado con el secreto local—, sobre
 * la base, las policies y el Storage reales del stack local. Nunca contra
 * producción: se niega a correr si la URL no es local.
 *
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_JWT_SECRET=... \
 *   npx tsx scripts/verify-remove-reported-avatar.ts
 *
 * (Los valores salen de `npx supabase status -o env` en el repo de la app.)
 *
 * Casos:
 *   A. Camino feliz: foto fuera del perfil, archivo borrado, denuncia ACTIONED.
 *   B. Falla real de Storage (sin la policy de DELETE, `remove` "funciona" pero
 *      no borra): la denuncia queda PENDING. La persona sube otra foto; el
 *      reintento borra el archivo denunciado y NO toca la foto nueva.
 *   C. Perfil sin foto: se rechaza y la denuncia sigue PENDING.
 *   D. Foto con URL externa: sale del perfil, no hay archivo que borrar.
 *
 * El caso B cambia una policy con `docker exec` sobre el contenedor de la base
 * local (LOCAL_DB_CONTAINER, por defecto `supabase_db_tornear`) y la restaura
 * al terminar, pase lo que pase.
 */
import { execFileSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { removeReportedAvatar } from "../lib/avatar-removal";
import type { Database } from "../types/supabase";

const url = process.env.SUPABASE_URL ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? "";
const container = process.env.LOCAL_DB_CONTAINER ?? "supabase_db_tornear";

if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  throw new Error(`Sólo contra el Supabase local. SUPABASE_URL=${url || "(vacía)"}`);
}
if (!anonKey || !serviceKey || !jwtSecret) {
  throw new Error("Faltan SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY o SUPABASE_JWT_SECRET.");
}

// Perfiles del seed de testing (supabase/seed_testing.sql del repo de la app).
const ADMIN = { profileId: "33333333-3333-3333-3333-000000000004", authId: "aaaaaaaa-0000-0000-0000-000000000004" };
const REPORTED = { profileId: "33333333-3333-3333-3333-000000000001", authId: "aaaaaaaa-0000-0000-0000-000000000001" };
const NO_PHOTO = { profileId: "33333333-3333-3333-3333-000000000007" };

function sign(sub: string): string {
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({ sub, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 600 });
  const signature = createHmac("sha256", jwtSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

const service = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
// Como el dashboard: clave anon + la sesión del admin. La service key sólo
// arma el escenario y verifica el resultado.
const admin: SupabaseClient<Database> = createClient<Database>(url, anonKey, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${sign(ADMIN.authId)}` } },
});

function psql(sql: string) {
  execFileSync("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: "pipe",
  });
}

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  console.log(`${condition ? "  ok " : "  FALLA"} ${label}${condition || detail === undefined ? "" : ` → ${JSON.stringify(detail)}`}`);
  if (!condition) failures += 1;
}

async function must<T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function uploadAvatar(authId: string, name: string): Promise<string> {
  const path = `${authId}/${name}`;
  // Un JPEG mínimo alcanza: sólo importa que el objeto exista.
  const bytes = Buffer.from("ffd8ffe000104a46494600010100000100010000ffd9", "hex");
  await must(service.storage.from("avatars").upload(path, bytes, { contentType: "image/jpeg", upsert: true }), `subir ${path}`);
  return path;
}

async function fileExists(path: string): Promise<boolean> {
  const { data } = await service.storage.from("avatars").exists(path);
  return data === true;
}

async function setAvatar(profileId: string, avatarUrl: string | null) {
  await must(service.from("profiles").update({ avatar_url: avatarUrl }).eq("id", profileId).select("id"), "actualizar avatar");
}

async function newReport(profileId: string): Promise<string> {
  const id = randomUUID();
  await must(
    service.from("content_reports").insert({
      id,
      reporter_id: ADMIN.profileId,
      reported_entity_type: "USER",
      reported_entity_id: profileId,
      reason: "Foto de perfil inapropiada",
    }).select("id"),
    "crear denuncia",
  );
  return id;
}

async function reportStatus(id: string): Promise<string | undefined> {
  const row = await must(service.from("content_reports").select("status").eq("id", id).maybeSingle(), "leer denuncia");
  return row?.status;
}

async function avatarOf(profileId: string): Promise<string | null | undefined> {
  const row = await must(service.from("profiles").select("avatar_url").eq("id", profileId).maybeSingle(), "leer perfil");
  return row?.avatar_url;
}

async function main() {
  // En el stack local la sección de Storage de la migración inicial se omite
  // (ver 20240101000000): el bucket se crea acá, igual que en producción.
  const { error: bucketError } = await service.storage.getBucket("avatars");
  if (bucketError) {
    await must(service.storage.createBucket("avatars", { public: true }), "crear bucket avatars");
  }

  await must(service.from("profiles").update({ is_admin: true }).eq("id", ADMIN.profileId).select("id"), "marcar admin");
  const run = Date.now();

  console.log("A. Camino feliz");
  {
    const path = await uploadAvatar(REPORTED.authId, `avatar-${run}-a.jpg`);
    await setAvatar(REPORTED.profileId, path);
    const reportId = await newReport(REPORTED.profileId);

    const result = await removeReportedAvatar(admin, { reportId, adminAuthUserId: ADMIN.authId });
    check("devuelve ok", result.ok, result);
    check("la foto sale del perfil", (await avatarOf(REPORTED.profileId)) === null);
    check("el archivo ya no está en el bucket", !(await fileExists(path)));
    check("la denuncia queda ACTIONED", (await reportStatus(reportId)) === "ACTIONED");
    const audit = await must(
      service.from("app_logs").select("details").eq("message", "admin.remove_reported_avatar_file").eq("details->>report_id", reportId),
      "leer auditoría",
    );
    check("queda registrado el borrado del archivo", audit?.length === 1, audit);
  }

  console.log("B. Falla real de Storage y reintento con una foto nueva en el medio");
  {
    const reported = await uploadAvatar(REPORTED.authId, `avatar-${run}-b.jpg`);
    await setAvatar(REPORTED.profileId, reported);
    const reportId = await newReport(REPORTED.profileId);

    psql(`DROP POLICY "Admins borran avatares" ON storage.objects`);
    let first;
    try {
      first = await removeReportedAvatar(admin, { reportId, adminAuthUserId: ADMIN.authId });
    } finally {
      psql(`CREATE POLICY "Admins borran avatares" ON storage.objects FOR DELETE TO authenticated
            USING (bucket_id = 'avatars' AND EXISTS (SELECT 1 FROM public.profiles p
                   WHERE p.auth_user_id = (SELECT auth.uid()) AND p.is_admin = true))`);
    }
    check("sin permiso de borrar, falla en storage", !first.ok && first.stage === "storage", first);
    check("la foto igual salió del perfil", (await avatarOf(REPORTED.profileId)) === null);
    check("el archivo sigue en el bucket", await fileExists(reported));
    check("la denuncia NO queda resuelta a medias (PENDING)", (await reportStatus(reportId)) === "PENDING");

    // La persona sube otra foto antes de que el admin reintente.
    const fresh = await uploadAvatar(REPORTED.authId, `avatar-${run}-b-nueva.jpg`);
    await setAvatar(REPORTED.profileId, fresh);

    const retry = await removeReportedAvatar(admin, { reportId, adminAuthUserId: ADMIN.authId });
    check("el reintento funciona", retry.ok && retry.retried, retry);
    check("borra el archivo denunciado", !(await fileExists(reported)));
    check("la foto nueva sigue en el perfil", (await avatarOf(REPORTED.profileId)) === fresh);
    check("y su archivo sigue en el bucket", await fileExists(fresh));
    check("la denuncia queda ACTIONED", (await reportStatus(reportId)) === "ACTIONED");
  }

  console.log("C. Perfil sin foto");
  {
    await setAvatar(NO_PHOTO.profileId, null);
    const reportId = await newReport(NO_PHOTO.profileId);
    const result = await removeReportedAvatar(admin, { reportId, adminAuthUserId: ADMIN.authId });
    check(
      "se rechaza en la RPC con NO_CONTENT_TO_REMOVE",
      !result.ok && result.stage === "rpc" && result.error.includes("NO_CONTENT_TO_REMOVE"),
      result,
    );
    check("la denuncia sigue PENDING", (await reportStatus(reportId)) === "PENDING");
  }

  console.log("D. Foto con URL externa");
  {
    await setAvatar(REPORTED.profileId, "https://i.pravatar.cc/300?img=1");
    const reportId = await newReport(REPORTED.profileId);
    const result = await removeReportedAvatar(admin, { reportId, adminAuthUserId: ADMIN.authId });
    check("devuelve ok sin archivo que borrar", result.ok && result.path === null, result);
    check("la foto sale del perfil", (await avatarOf(REPORTED.profileId)) === null);
    check("la denuncia queda ACTIONED", (await reportStatus(reportId)) === "ACTIONED");
  }

  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} verificación(es) fallaron.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
