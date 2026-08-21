import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Imágenes de marca que viven en el repo (no en Supabase Storage) y que las
 * plantillas de `/api/og/*` necesitan dibujar: el fondo de la story y el
 * wordmark del header.
 *
 * ─── Por qué `assets/og/` y no `public/` ──────────────────────────────────
 * Satori no descarga nada por su cuenta de forma confiable dentro de una
 * función serverless: para un `<img src="/algo.png">` no hay origen que
 * resolver, y un `<img src="https://admin.tornear.app/algo.png">` obliga a
 * la función a pedirse una imagen a sí misma — un round-trip extra por
 * render que además se rompe en los Preview Deployments de Vercel, donde ese
 * origen está detrás de la protección de deployment y devuelve el HTML del
 * login en vez del PNG. Leer los bytes de disco y pasarlos como data URI es
 * el mismo patrón que ya usa `lib/og/fonts.ts`, y no depende de la red.
 *
 * `assets/` no es `public/`, así que el output file tracing de Vercel no lo
 * detecta solo: está declarado en `next.config.ts`
 * (`outputFileTracingIncludes`). Si se agrega un archivo acá, no hace falta
 * tocar esa config — el glob es `./assets/**`.
 *
 * ─── Archivos esperados ───────────────────────────────────────────────────
 *   story-background.png   fondo 9:16 (humo, luces, negro) de la story
 *   logo-wordmark.png      logo horizontal "torneAR" con transparencia
 *
 * PNG y no WebP a propósito: resvg —el rasterizador detrás de
 * `ImageResponse`— soporta WebP de forma floja y puede tumbar el response
 * entero en vez de fallar sólo esa imagen. Es la misma restricción que
 * `safe-image.ts` aplica a lo que viene de Storage.
 */

const OG_ASSETS_DIR = join(process.cwd(), "assets", "og");

export type LocalOgAsset = "story-background.png" | "logo-wordmark.png";

/**
 * Cachea el data URI ya armado, no el Buffer: el `toString("base64")` de un
 * PNG de 1.4 MB no es gratis y se repetiría en cada request de una instancia
 * caliente. Igual que `loadOgFonts()`, la lectura es perezosa y no a nivel
 * de módulo, para que un archivo faltante lo pueda atrapar el `try/catch`
 * del route handler y convertirlo en una tarjeta de error legible.
 */
const cache = new Map<LocalOgAsset, string>();

export function loadLocalOgAsset(filename: LocalOgAsset): string {
  const hit = cache.get(filename);
  if (hit) return hit;

  let bytes: Buffer;
  try {
    bytes = readFileSync(join(OG_ASSETS_DIR, filename));
  } catch (error) {
    throw new Error(
      `[og/local-asset] No se encontró "${filename}" en assets/og/ — ver el ` +
        `comentario de este archivo para la lista de archivos esperados.`,
      { cause: error },
    );
  }

  const dataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  cache.set(filename, dataUri);
  return dataUri;
}

/**
 * Variante que devuelve `null` en vez de tirar.
 *
 * Para assets decorativos (el wordmark, que tiene un texto de reemplazo en
 * la plantilla): que falte el archivo del logo no justifica no entregar la
 * tarjeta. El fondo NO usa esto — sin fondo la story no es la story, y ahí
 * conviene el error explícito.
 */
export function loadOptionalLocalOgAsset(filename: LocalOgAsset): string | null {
  try {
    return loadLocalOgAsset(filename);
  } catch (error) {
    console.error("[og/local-asset]", error);
    return null;
  }
}
