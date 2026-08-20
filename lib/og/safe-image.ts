const STORAGE_TIMEOUT_MS = 4000;

export type StorageBucket = "avatars" | "shields";

export type ResolvedImage =
  | { kind: "image"; src: string }
  | { kind: "initials"; initials: string };

function buildStorageUrl(bucket: StorageBucket, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("[og/safe-image] NEXT_PUBLIC_SUPABASE_URL no está configurada.");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Resuelve un avatar o escudo a algo que Satori pueda dibujar sin arriesgar
 * el render completo de la tarjeta.
 *
 * Dos problemas reales, no hipotéticos — `profiles.avatar_url` y
 * `teams.shield_url` son paths relativos dentro de buckets públicos, no URLs
 * completas, y llegan tal cual desde la base:
 *
 *  1. Los buckets aceptan webp (`allowed_mime_types`), y resvg —el
 *     rasterizador detrás de `ImageResponse`— lo soporta de forma floja: en
 *     vez de fallar sólo esa imagen, puede tirar el response entero.
 *  2. Un avatar borrado o una URL vieja no debería reventar la tarjeta de
 *     otra persona que si tiene su foto en orden.
 *
 * El resultado nunca es una URL para que Satori la vuelva a pedir: los bytes
 * ya se trajeron acá, así que se entregan como data URI (evita un segundo
 * round-trip de red durante el render). Si algo falla, si el content-type
 * no es png/jpeg, o si no hay `path`, el resultado es "initials" — el
 * llamador dibuja un círculo con las iniciales usando JSX nativo de Satori,
 * nunca una imagen. Eso evita también depender de si Satori resuelve bien
 * un data URI de SVG en `<img>`, que es un soporte igual de incierto.
 */
export async function resolveStorageImage(
  path: string | null,
  bucket: StorageBucket,
  fallbackLabel: string,
): Promise<ResolvedImage> {
  if (!path) return { kind: "initials", initials: initialsOf(fallbackLabel) };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STORAGE_TIMEOUT_MS);
    const res = await fetch(buildStorageUrl(bucket, path), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { kind: "initials", initials: initialsOf(fallbackLabel) };

    const contentType = res.headers.get("content-type") ?? "";
    const isSafeRaster =
      contentType.includes("png") || contentType.includes("jpeg") || contentType.includes("jpg");
    if (!isSafeRaster) return { kind: "initials", initials: initialsOf(fallbackLabel) };

    const buffer = Buffer.from(await res.arrayBuffer());
    return { kind: "image", src: `data:${contentType};base64,${buffer.toString("base64")}` };
  } catch (error) {
    console.error("[og/safe-image] no se pudo resolver la imagen, usando iniciales:", error);
    return { kind: "initials", initials: initialsOf(fallbackLabel) };
  }
}
