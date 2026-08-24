import { OG_COLORS, OG_SIZE } from "@/lib/og/card-theme";
import { formatRangeLabelPlain } from "@/lib/og/format";
import type { ResolvedImage } from "@/lib/og/safe-image";

/**
 * Marco común de todas las tarjetas de `/api/og/*`: fondo, logo, el
 * "eyebrow" dorado y el pie con el rango y el handle. Lo único que cambia
 * entre plantillas es el contenido del centro.
 *
 * ─── Las tres reglas de Satori que rigen ESTE archivo y todos los
 *     `Template*.tsx` ─────────────────────────────────────────────────────
 * No son preferencias de estilo: acá el JSX no lo renderiza un browser, lo
 * recorre Satori y lo rasteriza resvg.
 *
 *  1. Todo estilo va inline (`style={{...}}`), nunca en clases de Tailwind:
 *     no hay un motor de CSS detrás que las resuelva (existe la prop `tw`,
 *     que acá no se usa).
 *  2. Todo contenedor con más de un hijo necesita `display: "flex"`
 *     explícito — Satori no tiene layout de bloque implícito. Se declara
 *     incluso en los de un solo hijo, para no depender de acordarse de
 *     agregarlo el día que sumen un segundo.
 *  3. Las mayúsculas se hacen con `.toUpperCase()` en JS, no con
 *     `text-transform: uppercase`: el soporte de esa propiedad en Satori no
 *     está garantizado, y acá no hay forma de verlo fallar en un browser
 *     normal para notarlo a tiempo.
 *
 * Un cuarto punto propio de este archivo: `children` entra en un contenedor
 * que YA es `flex column` con `alignItems: center`. Una plantilla que quiera
 * una fila (dos escudos enfrentados, por ejemplo) tiene que abrir su propio
 * `div` con `flexDirection: "row"` — no alcanza con devolver los elementos
 * sueltos.
 */
export function CardShell({
  eyebrow,
  from,
  to,
  handle,
  gap = 28,
  children,
}: {
  /** Rótulo dorado sobre el contenido. Se pasa ya en mayúsculas. */
  eyebrow: string;
  from: string;
  to: string;
  /**
   * Línea final de la tarjeta. `tornear.vercel.app/i/<username>` sólo para tarjetas
   * de un JUGADOR: `app/(public)/i/[username]` existe únicamente para
   * perfiles, y los equipos y los partidos no tienen página pública propia —
   * mostrar un link que no lleva a ningún lado sería peor que no mostrarlo.
   */
  handle: string;
  /** Separación vertical del bloque central. Las tarjetas con lista usan menos. */
  gap?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: OG_COLORS.surfaceLowest,
        backgroundImage: `linear-gradient(160deg, ${OG_COLORS.surfaceLowest} 0%, ${OG_COLORS.surfaceContainer} 100%)`,
        padding: 64,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex" }}>
        <span
          style={{
            fontFamily: "Barlow Condensed",
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: 2,
            color: OG_COLORS.brandPrimary,
          }}
        >
          TORNEAR
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap,
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 6,
            color: OG_COLORS.brandGold,
            textAlign: "center",
          }}
        >
          {eyebrow}
        </span>

        {children}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 22,
            color: OG_COLORS.onSurfaceVariant,
          }}
        >
          {formatRangeLabelPlain(from, to)}
        </span>
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 26,
            color: OG_COLORS.onSurface,
          }}
        >
          {handle}
        </span>
      </div>
    </div>
  );
}

/**
 * Avatar o escudo, con el círculo de iniciales como reemplazo.
 *
 * El fallback nunca es una URL ni un SVG: `resolveStorageImage` ya decidió
 * si hay bytes seguros que dibujar (ver el comentario de `safe-image.ts`), y
 * cuando no los hay esto pinta un `div` con texto, que es lo único que Satori
 * garantiza sin depender del rasterizador.
 *
 * `radius`: 999 para el círculo de un jugador, un valor chico para el
 * cuadrado-redondeado de un escudo — la misma forma que esos escudos ya
 * tienen en el resto del dashboard. La diferencia de forma es la que hace
 * que se distinga "tarjeta de persona" de "tarjeta de equipo" sin leer nada.
 */
export function CardImage({
  image,
  size,
  radius,
  borderWidth = 6,
  borderColor = OG_COLORS.brandPrimary,
}: {
  image: ResolvedImage;
  size: number;
  radius: number;
  borderWidth?: number;
  borderColor?: string;
}) {
  if (image.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- <img> de Satori, no de Next (este archivo no renderiza en el navegador)
      <img
        src={image.src}
        alt=""
        width={size}
        height={size}
        style={{
          borderRadius: radius,
          border: `${borderWidth}px solid ${borderColor}`,
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        border: `${borderWidth}px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.surfaceHigh,
      }}
    >
      <span
        style={{
          fontFamily: "Barlow Condensed",
          fontWeight: 800,
          // Proporcional al diámetro y no un número fijo: estas iniciales se
          // dibujan desde 64px (una fila del Top 5) hasta 320px (el avatar
          // del MVP), y un tamaño fijo se desborda en un extremo o queda
          // perdido en el otro.
          fontSize: Math.round(size * 0.375),
          color: OG_COLORS.onSurface,
        }}
      >
        {image.initials}
      </span>
    </div>
  );
}
