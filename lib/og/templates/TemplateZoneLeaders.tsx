import { OG_COLORS } from "@/lib/og/card-theme";
import type { ZoneLeadersHighlight } from "@/lib/og/highlights";
import type { ResolvedImage } from "@/lib/og/safe-image";
import { CardImage, CardShell } from "@/lib/og/templates/CardShell";

/**
 * Tarjeta "Líderes de zona": el Top 5 del ranking de una zona.
 * Reglas de Satori y marco compartido: ver `CardShell.tsx`.
 *
 * La zona la elige la RPC (la que más partidos tuvo en la ventana), no esta
 * tarjeta ni el usuario — ver el comentario de `content_weekly_highlights`
 * en 20260820000000_content_expansion.sql.
 *
 * `images` viene como array paralelo a `highlight.teams` y no dentro de cada
 * equipo: `resolveStorageImage` es asincrónico y hace I/O, así que resolver
 * los escudos es trabajo del Route Handler (que puede pedirlos en paralelo),
 * no de una plantilla que Satori recorre de forma sincrónica.
 *
 * `gap` del shell bajado a 18: acá el bloque central es una lista de cinco
 * filas, que ya trae su propia separación interna — el 28 por defecto sumaba
 * aire de más entre la lista y el título de la zona.
 */
export function TemplateZoneLeaders({
  highlight,
  images,
  from,
  to,
}: {
  highlight: ZoneLeadersHighlight;
  /** Un escudo por equipo, en el MISMO orden que `highlight.teams`. */
  images: ResolvedImage[];
  from: string;
  to: string;
}) {
  return (
    <CardShell eyebrow="LÍDERES DE ZONA" from={from} to={to} handle="tornear.app" gap={18}>
      <span
        style={{
          fontFamily: "Barlow Condensed",
          fontWeight: 800,
          fontSize: 88,
          lineHeight: 1,
          textAlign: "center",
          color: OG_COLORS.brandPrimary,
        }}
      >
        {highlight.zone.toUpperCase()}
      </span>

      {/* La lista abre su propio contenedor con `width: "100%"`: los hijos de
          `CardShell` están centrados en una columna, así que sin esto cada
          fila se encogería a su contenido y las cinco quedarían desalineadas
          entre sí. */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 14 }}>
        {highlight.teams.map((team, index) => {
          const isLeader = team.position === 1;

          return (
            <div
              key={team.team_id}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 24,
                padding: "14px 24px",
                borderRadius: 24,
                // El puntero de la zona se destaca con fondo y borde, no con
                // un tamaño de fuente distinto: las cinco filas tienen que
                // seguir leyéndose como una misma tabla.
                backgroundColor: isLeader
                  ? `rgba(${OG_COLORS.brandPrimaryRgb}, 0.12)`
                  : OG_COLORS.surfaceContainer,
                border: `2px solid ${isLeader ? OG_COLORS.brandPrimary : OG_COLORS.surfaceHigh}`,
              }}
            >
              <span
                style={{
                  width: 52,
                  display: "flex",
                  justifyContent: "center",
                  fontFamily: "Barlow Condensed",
                  fontWeight: 800,
                  fontSize: 56,
                  lineHeight: 1,
                  color: isLeader ? OG_COLORS.brandGold : OG_COLORS.onSurfaceVariant,
                }}
              >
                {team.position}
              </span>

              <CardImage
                image={images[index] ?? { kind: "initials", initials: "?" }}
                size={72}
                radius={16}
                borderWidth={3}
                borderColor={isLeader ? OG_COLORS.brandPrimary : OG_COLORS.surfaceHigh}
              />

              {/* `flex: 1` y no un ancho fijo: es la única columna elástica de
                  la fila, así que absorbe el resto del ancho y un nombre
                  largo se parte en dos líneas en vez de empujar al ELO. */}
              <span
                style={{
                  flex: 1,
                  fontFamily: "Barlow Condensed",
                  fontWeight: 800,
                  fontSize: 46,
                  lineHeight: 1.05,
                  color: OG_COLORS.onSurface,
                }}
              >
                {team.team_name.toUpperCase()}
              </span>

              <div
                style={{
                  width: 150,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: "Barlow Condensed",
                    fontWeight: 800,
                    fontSize: 48,
                    lineHeight: 1,
                    color: isLeader ? OG_COLORS.brandPrimary : OG_COLORS.onSurface,
                  }}
                >
                  {team.elo}
                </span>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: 20,
                    color: OG_COLORS.onSurfaceVariant,
                  }}
                >
                  {team.wins}G · {team.draws}E · {team.losses}P
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <span
        style={{
          fontFamily: "Inter",
          fontWeight: 500,
          fontSize: 24,
          textAlign: "center",
          color: OG_COLORS.onSurfaceVariant,
        }}
      >
        La zona con más actividad del período · {highlight.matches_played}{" "}
        {highlight.matches_played === 1 ? "partido jugado" : "partidos jugados"}
      </span>
    </CardShell>
  );
}
