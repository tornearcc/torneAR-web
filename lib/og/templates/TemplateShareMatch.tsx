import { OG_STORY_SIZE } from "@/lib/og/card-theme";
import type { ResolvedImage } from "@/lib/og/safe-image";
import { CardImage } from "@/lib/og/templates/CardShell";

/**
 * Tarjeta "Compartir Partido" — 1080×1920, para Stories.
 *
 * A diferencia de las cinco tarjetas del Content Factory, esta NO usa
 * `CardShell`: el shell impone fondo con gradiente, padding y un pie propios,
 * y acá el fondo es una foto a sangre con su propio scrim. Sí comparte
 * `CardImage` (escudos y avatar, con el reemplazo de iniciales).
 *
 * ─── Reglas de Satori que rigen este archivo ──────────────────────────────
 * Las tres de `CardShell.tsx` siguen valiendo, con una excepción declarada:
 *
 *  1. Estilos: acá SÍ se usa la prop `tw`, a diferencia de las plantillas de
 *     feed que van 100% inline. Satori trae su propio motor de Tailwind, así
 *     que no depende de la config de Tailwind v4 del dashboard — de hecho la
 *     ignora, y por eso los colores de marca van como valores arbitrarios
 *     (bg-[#53e076]) y no como bg-brand-primary. Ojo con la asimetría: este
 *     archivo y los Template*.tsx de feed no se leen igual.
 *  2. `display: flex` en todo contenedor: `tw="flex"` explícito en cada div,
 *     incluso en los vacíos (las líneas del header).
 *  3. Mayúsculas con `.toUpperCase()`, nunca `uppercase` de Tailwind.
 *
 * Lo que se queda inline aunque haya `tw` disponible, y por qué:
 *  · `fontFamily`: las fuentes se registran en `ImageResponse` por nombre
 *    ("Barlow Condensed", "Inter"). Escribirlo como clase obligaría a confiar
 *    en cómo el motor de tw de Satori desescapa el guion bajo del nombre, y
 *    si falla lo hace en silencio, cayendo a la fuente por default.
 *  · `objectFit`, `letterSpacing`, `lineHeight` y los paddings asimétricos:
 *    los consume el layout de Satori directamente, sin intermediarios.
 *  · Gradientes y `rgba()`: `backgroundImage` con `linear-gradient` es la
 *    forma que ya está probada en `CardShell`.
 * Cuando conviven, el `style` inline gana sobre `tw` — que es justo lo que se
 * busca acá.
 *
 * Nada de `box-shadow` ni `filter: drop-shadow`: Satori no los soporta más
 * allá de casos triviales. Toda la separación visual sale de bordes de 2px,
 * del scrim y del color.
 */

/**
 * Anchos fijos de las tres columnas del cruce, sobre los 952 útiles (1080
 * menos 64 de padding por lado). 330 + 292 + 330 = 952.
 *
 * Fijos y no `flex`, por el mismo motivo que en `TemplateEpicMatch`: con
 * `flex` el marcador se corre hacia el nombre más corto y el cruce deja de
 * leerse como un enfrentamiento.
 */
const SIDE_WIDTH = 330;
const CENTER_WIDTH = 292;

const FONT_TITLE = { fontFamily: "Barlow Condensed" } as const;
const FONT_BODY = { fontFamily: "Inter" } as const;

export interface ShareMatchTeam {
  name: string;
  /**
   * Ya resuelto a bytes por `resolveStorageImage`, no una URL.
   *
   * La prop NO es `logo: string` a propósito: un `<img src="https://…">` que
   * Satori tenga que descargar durante el render agrega un round-trip por
   * escudo y, si el bucket devuelve un webp, resvg puede tumbar el response
   * completo en vez de fallar sólo esa imagen. `safe-image.ts` existe
   * exactamente para eso, y de paso trae el círculo de iniciales cuando el
   * equipo no tiene escudo cargado.
   */
  logo: ResolvedImage;
}

export interface ShareMatchScorer {
  name: string;
  goals: number;
}

export interface TemplateShareMatchProps {
  /** Ej. "PARTIDO DE RANKING". Se pasa en el idioma final, sin formatear. */
  matchType: string;
  /** Ej. "FÚTBOL 5". */
  format: string;
  /** Ej. "21 DE AGOSTO DE 2026" — ya formateada por el llamador. */
  date: string;
  homeTeam: ShareMatchTeam;
  awayTeam: ShareMatchTeam;
  score: { home: number; away: number };
  /** Ej. "+18 RATING". `null` cuando el partido no movió el ranking. */
  ratingChange: string | null;
  mvp: { name: string; avatar: ResolvedImage } | null;
  scorers: ShareMatchScorer[];
  /** Data URI del fondo 9:16 (`loadLocalOgAsset("story-background.png")`). */
  background: string;
  /** Data URI del wordmark, o `null` para caer al logotipo tipográfico. */
  logo: string | null;
}

/** "J. PÉREZ x2" — el "x1" se omite porque no aporta nada. */
function scorerLabel({ name, goals }: ShareMatchScorer): string {
  return goals > 1 ? `${name.toUpperCase()} x${goals}` : name.toUpperCase();
}

/**
 * Presupuesto de una línea de goleadores, en caracteres.
 *
 * La caja tiene 880px útiles (1080 − 64 de padding de página por lado − 36 de
 * padding de caja por lado) y Barlow Condensed Bold en 40px promedia ~16.7px
 * por carácter en mayúsculas — medido sobre un render real, no estimado. Eso
 * da ~52; se baja a 50 de margen, porque las tildes y las mayúsculas anchas
 * (M, G, Ñ) tiran el promedio para arriba.
 */
const LINE_CHAR_BUDGET = 50;
/** Lo que ocupa " | " en la misma unidad: ~48px ≈ 3 caracteres. */
const SEPARATOR_COST = 3;

/**
 * Reparte los goleadores en filas ANTES de renderizar, en vez de dejar que
 * `flex-wrap` corte solo.
 *
 * Con `flex-wrap`, cada goleador tiene que viajar junto a su separador (si no,
 * el `|` puede quedar solo al final de una línea), y entonces el que abre la
 * segunda línea la arranca con un `| ` colgando a la izquierda — se ve en el
 * PNG con seis goleadores, no en el código. Calculando las filas acá, el
 * separador se dibuja únicamente ENTRE elementos de una misma fila y el
 * problema desaparece por construcción.
 *
 * La heurística por caracteres es aproximada a propósito: Satori no expone
 * medición de texto, así que la alternativa sería embeber un medidor de
 * fuentes para ahorrar unos pocos píxeles de aire. Si una fila queda corta,
 * el peor caso es una línea con menos aprovechamiento — nunca un desborde.
 */
function chunkScorers(scorers: ShareMatchScorer[]): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let used = 0;

  for (const scorer of scorers) {
    const label = scorerLabel(scorer);
    const cost = label.length + (row.length > 0 ? SEPARATOR_COST : 0);

    if (row.length > 0 && used + cost > LINE_CHAR_BUDGET) {
      rows.push(row);
      row = [label];
      used = label.length;
    } else {
      row.push(label);
      used += cost;
    }
  }

  if (row.length > 0) rows.push(row);
  return rows;
}

export function TemplateShareMatch({
  matchType,
  format,
  date,
  homeTeam,
  awayTeam,
  score,
  ratingChange,
  mvp,
  scorers,
  background,
  logo,
}: TemplateShareMatchProps) {
  return (
    <div tw="relative flex" style={{ width: OG_STORY_SIZE.width, height: OG_STORY_SIZE.height }}>
      {/* ── Fondo ────────────────────────────────────────────────────────
          Ancho y alto explícitos además de `inset-0`: Satori no infiere el
          tamaño intrínseco de un data URI, y sin ellos la imagen se dibuja
          en 0×0 sin avisar. `object-fit: cover` va inline (ver cabecera).
          El PNG es 941×1672, así que acá se escala ×1.15 — misma relación
          9:16, sin recorte. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- <img> de Satori, no de Next */}
      <img
        src={background}
        alt=""
        width={OG_STORY_SIZE.width}
        height={OG_STORY_SIZE.height}
        tw="absolute inset-0"
        style={{ objectFit: "cover" }}
      />

      {/* Scrim: la foto tiene el humo iluminado en el medio, justo donde caen
          las cajas de MVP y goleadores. Sin esto el texto blanco sobre esa
          zona pierde contraste. Oscurece arriba y abajo y deja respirar el
          centro, donde va el cruce. */}
      <div
        tw="absolute inset-0 flex"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(14,14,14,0.85) 0%, rgba(14,14,14,0.35) 34%, rgba(14,14,14,0.45) 62%, rgba(14,14,14,0.92) 100%)",
        }}
      />

      {/* ── Contenido ────────────────────────────────────────────────────
          `justify-between` reparte los cinco bloques sobre los 1920: no hay
          `gap` fijo que aguante a la vez un nombre de equipo de una línea y
          otro de tres. */}
      <div
        tw="relative flex flex-col items-center justify-between w-full h-full"
        style={{ padding: "84px 64px 72px 64px" }}
      >
        {/* ── 1. Header ───────────────────────────────────────────────── */}
        <div tw="flex flex-col items-center w-full">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- <img> de Satori, no de Next
            <img src={logo} alt="torneAR" width={392} height={130} tw="flex" />
          ) : (
            // El wordmark es decorativo: si el archivo falta, la tarjeta se
            // entrega igual con el logotipo tipográfico.
            <span
              tw="flex text-[#53e076]"
              style={{ ...FONT_TITLE, fontWeight: 800, fontSize: 92, letterSpacing: 4 }}
            >
              torneAR
            </span>
          )}

          {/* matchType flanqueado por dos líneas. Las líneas son divs vacíos
              con `flex-1`, no bordes del contenedor: así el texto queda
              centrado sin importar cuánto mida. */}
          <div tw="flex flex-row items-center w-full" style={{ marginTop: 40 }}>
            <div tw="flex flex-1 h-[2px] bg-[#e5e2e1]" style={{ opacity: 0.22 }} />
            <span
              tw="flex text-[#53e076]"
              style={{
                ...FONT_BODY,
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: 5,
                padding: "0 28px",
              }}
            >
              {matchType.toUpperCase()}
            </span>
            <div tw="flex flex-1 h-[2px] bg-[#e5e2e1]" style={{ opacity: 0.22 }} />
          </div>
        </div>

        {/* ── 2. Contexto ─────────────────────────────────────────────── */}
        <div tw="flex flex-col items-center">
          <div
            tw="flex items-center border-2 border-[#53e076] rounded-full bg-[#0e0e0e]"
            style={{ padding: "14px 40px" }}
          >
            <span
              tw="flex text-[#e5e2e1]"
              style={{ ...FONT_TITLE, fontWeight: 800, fontSize: 42, letterSpacing: 3 }}
            >
              {format.toUpperCase()}
            </span>
          </div>

          <span
            tw="flex text-[#e5e2e1]"
            style={{ ...FONT_BODY, fontWeight: 500, fontSize: 28, letterSpacing: 3, marginTop: 22 }}
          >
            {date.toUpperCase()}
          </span>
        </div>

        {/* ── 3. El cruce ─────────────────────────────────────────────────
            DOS filas (escudos+marcador / nombres+rating), no dos columnas por
            equipo. Es la corrección documentada en `TemplateEpicMatch`: con
            una columna por equipo y `items-center`, un nombre que envuelve a
            tres líneas empuja su escudo hacia arriba y los escudos quedan a
            distinta altura. Partido en filas, comparten línea sí o sí. */}
        <div tw="flex flex-col items-center w-full">
          <div tw="flex flex-row items-center justify-center w-full">
            <div tw="flex justify-center" style={{ width: SIDE_WIDTH }}>
              <CardImage image={homeTeam.logo} size={250} radius={36} />
            </div>

            <div tw="flex flex-row items-center justify-center" style={{ width: CENTER_WIDTH }}>
              <span tw="flex text-[#ffffff]" style={SCORE_STYLE}>
                {score.home}
              </span>
              <span
                tw="flex text-[#bccbb9]"
                style={{ ...SCORE_STYLE, fontSize: 96, padding: "0 18px" }}
              >
                -
              </span>
              <span tw="flex text-[#ffffff]" style={SCORE_STYLE}>
                {score.away}
              </span>
            </div>

            <div tw="flex justify-center" style={{ width: SIDE_WIDTH }}>
              <CardImage image={awayTeam.logo} size={250} radius={36} />
            </div>
          </div>

          {/* Misma grilla de tres columnas, alineada arriba: cada nombre cae
              bajo su escudo y el pill de rating bajo el marcador. */}
          <div tw="flex flex-row items-start justify-center w-full" style={{ marginTop: 28 }}>
            <div tw="flex justify-center" style={{ width: SIDE_WIDTH }}>
              <span tw="flex text-[#ffffff]" style={TEAM_NAME_STYLE}>
                {homeTeam.name.toUpperCase()}
              </span>
            </div>

            <div tw="flex flex-col items-center" style={{ width: CENTER_WIDTH }}>
              {ratingChange ? (
                <div
                  tw="flex items-center bg-[#53e076] rounded-full"
                  style={{ padding: "10px 26px" }}
                >
                  <span
                    tw="flex text-[#0e0e0e]"
                    style={{ ...FONT_BODY, fontWeight: 700, fontSize: 26, letterSpacing: 2 }}
                  >
                    {ratingChange.toUpperCase()}
                  </span>
                </div>
              ) : null}
            </div>

            <div tw="flex justify-center" style={{ width: SIDE_WIDTH }}>
              <span tw="flex text-[#ffffff]" style={TEAM_NAME_STYLE}>
                {awayTeam.name.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. Highlights ───────────────────────────────────────────────
            Las dos cajas se omiten enteras si no hay dato: una caja "MVP DEL
            PARTIDO" vacía se lee como un bug, y `justify-between` reacomoda
            el resto solo. */}
        <div tw="flex flex-col w-full">
          {mvp ? (
            <div
              tw="flex flex-col w-full border-2 border-[#53e076] rounded-3xl"
              style={{ backgroundColor: "rgba(19,19,19,0.88)", padding: "30px 36px" }}
            >
              <span
                tw="flex text-[#53e076]"
                style={{ ...FONT_BODY, fontWeight: 700, fontSize: 26, letterSpacing: 4 }}
              >
                MVP DEL PARTIDO
              </span>

              <div tw="flex flex-row items-center" style={{ marginTop: 22 }}>
                <CardImage image={mvp.avatar} size={104} radius={999} borderWidth={4} />
                <span
                  tw="flex text-[#ffffff]"
                  style={{
                    ...FONT_TITLE,
                    fontWeight: 800,
                    fontSize: 56,
                    lineHeight: 1.05,
                    letterSpacing: 1,
                    marginLeft: 26,
                  }}
                >
                  {mvp.name.toUpperCase()}
                </span>
              </div>
            </div>
          ) : null}

          {scorers.length > 0 ? (
            <div
              tw="flex flex-col w-full border-2 border-[#53e076] rounded-3xl"
              style={{
                backgroundColor: "rgba(19,19,19,0.88)",
                padding: "30px 36px",
                marginTop: mvp ? 24 : 0,
              }}
            >
              <div tw="flex flex-row items-center">
                {/* "Ícono" de pelota dibujado con divs y no con un emoji: ⚽
                    necesitaría la opción `emoji` de ImageResponse, que resuelve
                    el glifo pidiéndolo por red en pleno render. Dos círculos
                    concéntricos no dependen de ninguna fuente. */}
                <div
                  tw="flex items-center justify-center rounded-full border-2 border-[#53e076]"
                  style={{ width: 30, height: 30 }}
                >
                  <div tw="flex rounded-full bg-[#53e076]" style={{ width: 12, height: 12 }} />
                </div>
                <span
                  tw="flex text-[#53e076]"
                  style={{
                    ...FONT_BODY,
                    fontWeight: 700,
                    fontSize: 26,
                    letterSpacing: 4,
                    marginLeft: 14,
                  }}
                >
                  GOLEADORES
                </span>
              </div>

              {/* Filas calculadas por `chunkScorers`, no `flex-wrap` (ver ahí
                  el porqué). El separador es un `<span>` hermano y no un
                  `::after` — Satori no tiene pseudoelementos. */}
              <div tw="flex flex-col" style={{ marginTop: 20 }}>
                {chunkScorers(scorers).map((row, rowIndex) => (
                  <div
                    tw="flex flex-row items-center"
                    key={`row-${rowIndex}`}
                    style={{ marginTop: rowIndex > 0 ? 10 : 0 }}
                  >
                    {row.map((label, index) => (
                      <div tw="flex flex-row items-center" key={`${label}-${index}`}>
                        {index > 0 ? (
                          <span
                            tw="flex text-[#53e076]"
                            style={{
                              ...FONT_TITLE,
                              fontWeight: 700,
                              fontSize: 34,
                              padding: "0 16px",
                            }}
                          >
                            |
                          </span>
                        ) : null}
                        <span
                          tw="flex text-[#e5e2e1]"
                          style={{ ...FONT_TITLE, fontWeight: 700, fontSize: 40, letterSpacing: 1 }}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── 5. Footer ───────────────────────────────────────────────── */}
        <div tw="flex flex-col items-center w-full">
          <span
            tw="flex text-[#bccbb9]"
            style={{ ...FONT_BODY, fontWeight: 700, fontSize: 28, letterSpacing: 6 }}
          >
            JUGÁ. RANKEÁ. COMPARTÍ.
          </span>

          {/* Marco que simula el botón. No es interactivo — es un PNG — así que
              es sólo el borde y el rótulo, sin fondo relleno que sugiera un tap
              que no existe. */}
          <div
            tw="flex items-center justify-center w-full border-2 border-[#53e076] rounded-full"
            style={{
              backgroundColor: "rgba(19,19,19,0.75)",
              padding: "28px 24px",
              marginTop: 26,
            }}
          >
            <span
              tw="flex text-[#53e076]"
              style={{ ...FONT_BODY, fontWeight: 700, fontSize: 28, letterSpacing: 2 }}
            >
              MIRÁ LAS ESTADÍSTICAS EN TORNEAR.APP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SCORE_STYLE = {
  fontFamily: "Barlow Condensed",
  fontWeight: 800 as const,
  fontSize: 190,
  lineHeight: 1,
};

const TEAM_NAME_STYLE = {
  fontFamily: "Barlow Condensed",
  fontWeight: 800 as const,
  fontSize: 46,
  lineHeight: 1.05,
  letterSpacing: 1,
  textAlign: "center" as const,
};
