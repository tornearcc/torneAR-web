import { OG_COLORS } from "@/lib/og/card-theme";
import { formatMatchSubtitle } from "@/lib/og/format";
import type { EpicMatchHighlight } from "@/lib/og/highlights";
import type { ResolvedImage } from "@/lib/og/safe-image";
import { CardImage, CardShell } from "@/lib/og/templates/CardShell";

/**
 * Anchos fijos de las tres columnas del cruce. Suman 920 de los 952 útiles
 * (1080 menos los 64 de padding de cada lado), así que entran siempre.
 *
 * Fijos y no `flex`: los dos lados tienen que quedar simétricos aunque un
 * nombre sea "BCRA" y el otro "Deportivo Sarmiento de La Tablada". Con
 * `flex` el marcador se correría hacia el nombre corto y el cruce dejaría de
 * leerse como un enfrentamiento.
 */
const SIDE_WIDTH = 320;
const SCORE_WIDTH = 280;

/**
 * Tarjeta "El Partidazo": el partido con más goles combinados de la ventana.
 * Reglas de Satori y marco compartido: ver `CardShell.tsx`.
 *
 * ⚠️ Escudos y nombres van en DOS filas separadas, no en dos columnas de una
 * fila. Con una columna por equipo (escudo arriba, nombre abajo) y
 * `alignItems: center`, un nombre que ocupa tres líneas empuja a su escudo
 * hacia arriba y los dos escudos quedan a distinta altura — verificado
 * renderizando la tarjeta, no en teoría. Partiéndolo en fila de escudos +
 * fila de nombres, los escudos comparten línea sí o sí y el marcador queda
 * centrado contra ellos pase lo que pase con los nombres.
 *
 * `gap` del shell bajado a 20: esta tarjeta tiene cuatro bloques verticales
 * (eyebrow, cruce, total, subtítulo) contra los tres de las demás.
 *
 * El pie es `tornear.vercel.app` a secas: `/i/<username>` es la ruta del perfil de
 * un JUGADOR, y un partido no tiene página pública propia.
 */
export function TemplateEpicMatch({
  highlight,
  imageA,
  imageB,
  from,
  to,
}: {
  highlight: EpicMatchHighlight;
  imageA: ResolvedImage;
  imageB: ResolvedImage;
  from: string;
  to: string;
}) {
  return (
    <CardShell eyebrow="EL PARTIDAZO" from={from} to={to} handle="tornear.vercel.app" gap={20}>
      {/* `CardShell` deja a los hijos en columna, así que el cruce abre su
          propio contenedor con las dos filas adentro. */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: SIDE_WIDTH, display: "flex", justifyContent: "center" }}>
            <CardImage image={imageA} size={200} radius={32} />
          </div>

          <div
            style={{
              width: SCORE_WIDTH,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <span style={SCORE_STYLE}>{highlight.team_a.goals}</span>
            <span style={{ ...SCORE_STYLE, fontSize: 72, color: OG_COLORS.onSurfaceVariant }}>-</span>
            <span style={SCORE_STYLE}>{highlight.team_b.goals}</span>
          </div>

          <div style={{ width: SIDE_WIDTH, display: "flex", justifyContent: "center" }}>
            <CardImage image={imageB} size={200} radius={32} />
          </div>
        </div>

        {/* Fila de nombres: mismas tres columnas, con la del medio vacía para
            que cada nombre caiga exactamente debajo de su escudo.
            `alignItems: flex-start` para que un nombre de una línea y otro de
            tres arranquen a la misma altura. */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "center" }}>
          <div style={{ width: SIDE_WIDTH, display: "flex", justifyContent: "center" }}>
            <span style={TEAM_NAME_STYLE}>{highlight.team_a.team_name.toUpperCase()}</span>
          </div>
          <div style={{ width: SCORE_WIDTH, display: "flex" }} />
          <div style={{ width: SIDE_WIDTH, display: "flex", justifyContent: "center" }}>
            <span style={TEAM_NAME_STYLE}>{highlight.team_b.team_name.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 32px",
          borderRadius: 999,
          backgroundColor: `rgba(${OG_COLORS.brandPrimaryRgb}, 0.15)`,
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 32,
            color: OG_COLORS.brandPrimary,
          }}
        >
          {highlight.total_goals} goles en un partido
        </span>
      </div>

      <span
        style={{
          fontFamily: "Inter",
          fontWeight: 500,
          fontSize: 26,
          letterSpacing: 2,
          textAlign: "center",
          color: OG_COLORS.onSurfaceVariant,
        }}
      >
        {formatMatchSubtitle(highlight.match_type, highlight.format, highlight.played_at)}
      </span>
    </CardShell>
  );
}

const SCORE_STYLE = {
  fontFamily: "Barlow Condensed",
  fontWeight: 800 as const,
  fontSize: 128,
  lineHeight: 1,
  color: OG_COLORS.brandPrimary,
};

const TEAM_NAME_STYLE = {
  fontFamily: "Barlow Condensed",
  fontWeight: 800 as const,
  fontSize: 44,
  lineHeight: 1.05,
  textAlign: "center" as const,
  color: OG_COLORS.onSurface,
};
