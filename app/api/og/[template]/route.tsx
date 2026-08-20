import { ImageResponse } from "next/og";

import { requireAdminAction } from "@/lib/admin-guard";
import { fetchWeeklyHighlights } from "@/lib/og/highlights";
import { resolveStorageImage } from "@/lib/og/safe-image";
import { loadOgFonts, type OgFont } from "@/lib/og/fonts";
import { OG_COLORS, OG_SIZE } from "@/lib/og/card-theme";
import { TemplateMVP } from "@/lib/og/templates/TemplateMVP";
import { TemplateEloJump } from "@/lib/og/templates/TemplateEloJump";
import { TemplateTopScorer } from "@/lib/og/templates/TemplateTopScorer";
import { TemplateEpicMatch } from "@/lib/og/templates/TemplateEpicMatch";
import { TemplateZoneLeaders } from "@/lib/og/templates/TemplateZoneLeaders";

/**
 * Motor de renderizado del Content Factory (Fase 2 de Marketing & Growth).
 *
 * `runtime = "nodejs"` y no el default: `lib/og/fonts.ts` usa
 * `fs.readFileSync` para cargar los `.ttf` de marca, y eso no existe en el
 * runtime Edge. `dynamic = "force-dynamic"` porque cada imagen depende de
 * los destacados del momento — no hay nada útil que el Data Cache de Next
 * pueda reusar entre requests.
 *
 * Vive fuera de `(admin)` a propósito, igual que `app/auth/callback`: no es
 * una página, es un endpoint que un `<img src>` de `/dashboard/content`
 * consume same-origin. Las cookies de sesión viajan solas con el pedido de
 * imagen — no hace falta exponer nada por query string aparte del rango de
 * fechas.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATES = ["mvp", "elo", "scorer", "epic", "zone"] as const;
type TemplateId = (typeof TEMPLATES)[number];

function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATES as readonly string[]).includes(value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ template: string }> },
) {
  const { template } = await params;

  if (!isTemplateId(template)) {
    return placeholderImage(
      `Plantilla desconocida: "${template}". Usá una de: ${TEMPLATES.join(", ")}.`,
      404,
    );
  }

  // Reusa el mismo guard que las Server Actions (no redirige, devuelve un
  // resultado tipado) — es defensa en profundidad, no la única barrera: la
  // RPC vuelve a exigir is_admin del lado de Postgres.
  const auth = await requireAdminAction();
  if (!auth.ok) {
    return placeholderImage(auth.error, 403);
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const highlightsResult = await fetchWeeklyHighlights(from, to);
  if (highlightsResult.error || !highlightsResult.data) {
    return placeholderImage(
      `No se pudieron cargar los destacados: ${highlightsResult.error ?? "error desconocido"}`,
      500,
    );
  }

  const { data } = highlightsResult;

  let fonts: OgFont[];
  try {
    fonts = loadOgFonts();
  } catch (error) {
    console.error("[og]", error);
    return placeholderImage(
      "Faltan las fuentes .ttf en assets/fonts/ — ver assets/fonts/README.md.",
      500,
    );
  }

  /**
   * Cierra sobre `fonts` y el tamaño para que cada rama de abajo se quede
   * sólo con lo que la distingue: qué destacado necesita, qué imágenes
   * resuelve y qué plantilla arma.
   *
   * Privado y corto: son datos de administración, y cargar un resultado
   * nuevo puede cambiar el destacado de un momento a otro.
   */
  const card = (element: React.ReactElement) =>
    new ImageResponse(element, {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      fonts,
      headers: { "Cache-Control": "private, max-age=60" },
    });

  switch (template) {
    case "mvp": {
      if (!data.mvp) {
        return placeholderImage("Nadie recibió votos de MVP en este período.");
      }
      const image = await resolveStorageImage(
        data.mvp.avatar_url,
        "avatars",
        data.mvp.full_name || data.mvp.username,
      );
      return card(<TemplateMVP highlight={data.mvp} image={image} from={data.from} to={data.to} />);
    }

    case "elo": {
      if (!data.elo_jump) {
        return placeholderImage("Ningún equipo tuvo un salto de ELO positivo en este período.");
      }
      const image = await resolveStorageImage(
        data.elo_jump.shield_url,
        "shields",
        data.elo_jump.team_name,
      );
      return card(
        <TemplateEloJump highlight={data.elo_jump} image={image} from={data.from} to={data.to} />,
      );
    }

    case "scorer": {
      if (!data.top_scorer) {
        return placeholderImage("Nadie llegó a 2 goles en este período.");
      }
      const image = await resolveStorageImage(
        data.top_scorer.avatar_url,
        "avatars",
        data.top_scorer.full_name || data.top_scorer.username,
      );
      return card(
        <TemplateTopScorer
          highlight={data.top_scorer}
          image={image}
          from={data.from}
          to={data.to}
        />,
      );
    }

    case "epic": {
      if (!data.epic_match) {
        return placeholderImage("Ningún partido llegó a 5 goles combinados en este período.");
      }
      // En paralelo y no en serie: son dos fetch independientes a Storage,
      // cada uno con su timeout de 4s. Encadenados, el peor caso de la
      // tarjeta se duplicaría sin ganar nada.
      const [imageA, imageB] = await Promise.all([
        resolveStorageImage(
          data.epic_match.team_a.shield_url,
          "shields",
          data.epic_match.team_a.team_name,
        ),
        resolveStorageImage(
          data.epic_match.team_b.shield_url,
          "shields",
          data.epic_match.team_b.team_name,
        ),
      ]);
      return card(
        <TemplateEpicMatch
          highlight={data.epic_match}
          imageA={imageA}
          imageB={imageB}
          from={data.from}
          to={data.to}
        />,
      );
    }

    case "zone": {
      if (!data.zone_leaders) {
        return placeholderImage(
          "Ninguna zona tuvo actividad con al menos 3 equipos rankeados en este período.",
        );
      }
      // `Promise.all` sobre el array preserva el orden, que es justo lo que
      // `TemplateZoneLeaders` asume: `images[i]` es el escudo de `teams[i]`.
      const images = await Promise.all(
        data.zone_leaders.teams.map((team) =>
          resolveStorageImage(team.shield_url, "shields", team.team_name),
        ),
      );
      return card(
        <TemplateZoneLeaders
          highlight={data.zone_leaders}
          images={images}
          from={data.from}
          to={data.to}
        />,
      );
    }
  }
}

/**
 * Tarjeta de reemplazo para todo lo que no es "destacado real": sin
 * autorización, plantilla inexistente, fuentes faltantes, o umbral no
 * superado. Siempre devuelve una imagen válida (nunca un JSON de error) para
 * que el `<img>` de la preview en `/dashboard/content` muestre el motivo en
 * vez de un ícono roto — y sigue devolviendo el status code real, para quien
 * mire la pestaña Network.
 *
 * No usa `loadOgFonts()`: `ImageResponse` trae una fuente sans por default
 * cuando no se le pasa `fonts`, suficiente para un mensaje de texto plano, y
 * este es precisamente el camino que corre cuando cargar esas fuentes de
 * marca pudo haber fallado.
 */
function placeholderImage(message: string, status = 200) {
  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: OG_COLORS.surfaceLowest,
          padding: 96,
        }}
      >
        <span style={{ fontSize: 40, color: OG_COLORS.onSurfaceVariant, textAlign: "center" }}>
          {message}
        </span>
      </div>
    ),
    { width: OG_SIZE.width, height: OG_SIZE.height, status },
  );
}
