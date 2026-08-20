import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fuentes para `/api/og/*`.
 *
 * Satori (el motor detrás de `ImageResponse`) sólo soporta TTF, OTF y WOFF
 * — WOFF2, el formato que sirve `next/font/google` por default, no
 * funciona: el render falla en silencio o con un "Empty reply from server"
 * sin mencionar la fuente en ningún lado. Por eso acá no se reutiliza
 * `next/font` (usado en `app/layout.tsx`): hace falta el archivo `.ttf`
 * estático aparte.
 *
 * ─── Archivos en `dashboard/assets/fonts/` ────────────────────────────────
 *   BarlowCondensed-Bold.ttf       (peso 700)
 *   BarlowCondensed-ExtraBold.ttf  (peso 800)
 *   Inter_18pt-Medium.ttf          (peso 500)
 *   Inter_18pt-Bold.ttf            (peso 700)
 *
 * El paquete moderno de Google Fonts reparte Inter en variantes por tamaño
 * óptico (`_18pt`, `_24pt`, `_28pt` — instancias estáticas de un mismo eje
 * variable, cada una afinada para un rango de tamaño de lectura distinto).
 * Se usa sólo la de 18pt: en las cinco plantillas del Content Factory, TODO
 * el texto en Inter cae entre 20px y 32px (el eyebrow, el pie de página, los
 * badges y el W-E-P del Top 5 de zona) — nunca se usa Inter en los números
 * grandes, eso es Barlow Condensed. Ese rango es exactamente donde el master
 * de 18pt está afinado; usar el de 24pt o 28pt ahí se leería sutilmente más
 * pesado de lo que el diseño pide. Si una plantilla futura usa Inter a un
 * tamaño mayor, ese es el momento de sumar `Inter_28pt-Bold.ttf` como una
 * fuente aparte, no de reemplazar la de 18pt en los usos que ya existen.
 *
 * Si se despliega en Vercel: `assets/` no es `public/`, así que el output
 * file tracing no lo detecta solo — está declarado explícitamente en
 * `next.config.ts` (`outputFileTracingIncludes`) para que la función
 * serverless de esta ruta lo incluya en el bundle.
 */

const FONTS_DIR = join(process.cwd(), "assets", "fonts");

function loadFont(filename: string): Buffer {
  try {
    return readFileSync(join(FONTS_DIR, filename));
  } catch (error) {
    throw new Error(
      `[og/fonts] No se encontró "${filename}" en assets/fonts/ — ver el comentario ` +
        `de este archivo para la lista completa de archivos esperados.`,
      { cause: error },
    );
  }
}

export interface OgFont {
  name: string;
  data: Buffer;
  weight: 500 | 700 | 800;
  style: "normal";
}

let cached: OgFont[] | null = null;

/**
 * Lee los 4 archivos de disco y cachea el resultado en memoria del módulo:
 * una sola lectura de I/O por instancia serverless "caliente", no una por
 * imagen generada.
 *
 * Deliberadamente NO se cargan a nivel de módulo (una constante exportada
 * con los `readFileSync` ya resueltos): si un archivo falta, ese throw
 * tiene que poder atraparlo el `try/catch` del route handler y convertirlo
 * en una tarjeta de error legible — un throw a nivel de módulo lo atraparía
 * Next antes, como un 500 genérico sin el mensaje explicativo de arriba.
 */
export function loadOgFonts(): OgFont[] {
  if (cached) return cached;

  cached = [
    { name: "Barlow Condensed", data: loadFont("BarlowCondensed-Bold.ttf"), weight: 700, style: "normal" },
    { name: "Barlow Condensed", data: loadFont("BarlowCondensed-ExtraBold.ttf"), weight: 800, style: "normal" },
    { name: "Inter", data: loadFont("Inter_18pt-Medium.ttf"), weight: 500, style: "normal" },
    { name: "Inter", data: loadFont("Inter_18pt-Bold.ttf"), weight: 700, style: "normal" },
  ];

  return cached;
}
