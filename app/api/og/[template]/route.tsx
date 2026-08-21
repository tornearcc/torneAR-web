import { ImageResponse } from "next/og";

import { requireAdminAction } from "@/lib/admin-guard";
import { fetchWeeklyHighlights } from "@/lib/og/highlights";
import { resolveStorageImage } from "@/lib/og/safe-image";
import { loadOgFonts, type OgFont } from "@/lib/og/fonts";
import { loadLocalOgAsset, loadOptionalLocalOgAsset } from "@/lib/og/local-asset";
import { OG_COLORS, OG_SIZE, OG_STORY_SIZE } from "@/lib/og/card-theme";
import { fetchShareMatchData, type ShareMatchError } from "@/lib/og/share-match-data";
import { bearerTokenFrom } from "@/lib/supabase/bearer-token";
import { TemplateShareMatch } from "@/lib/og/templates/TemplateShareMatch";
import { TemplateMVP } from "@/lib/og/templates/TemplateMVP";
import { TemplateEloJump } from "@/lib/og/templates/TemplateEloJump";
import { TemplateTopScorer } from "@/lib/og/templates/TemplateTopScorer";
import { TemplateEpicMatch } from "@/lib/og/templates/TemplateEpicMatch";
import { TemplateZoneLeaders } from "@/lib/og/templates/TemplateZoneLeaders";

/**
 * Motor de renderizado de las tarjetas de imagen.
 *
 * `runtime = "nodejs"` y no el default: `lib/og/fonts.ts` usa
 * `fs.readFileSync` para cargar los `.ttf` de marca, y eso no existe en el
 * runtime Edge. `dynamic = "force-dynamic"` porque ninguna de estas imágenes
 * es estática — el Data Cache de Next no tiene nada útil que reusar entre
 * requests. Lo que sí se cachea es el RESULTADO, vía `Cache-Control` por
 * plantilla (ver abajo): distinto para las privadas que para la pública.
 *
 * Vive fuera de `(admin)` a propósito, igual que `app/auth/callback`.
 *
 * ⚠️ Esta ruta tiene DOS niveles de acceso y es la única del proyecto que los
 * mezcla:
 *
 *  · `mvp`, `elo`, `scorer`, `epic`, `zone` — ADMIN, por COOKIE. Son el
 *    Content Factory (Fase 2 de Marketing & Growth): las consume un
 *    `<img src>` de `/dashboard/content` same-origin, con las cookies de
 *    sesión viajando solas, y exigen `is_admin`.
 *  · `share-match` — CUALQUIER JUGADOR, por BEARER TOKEN. La consume la app
 *    móvil mandando el JWT del usuario en `Authorization`. No pasa por el
 *    guard de admin, pero no es abierta: sin token válido devuelve 401, y
 *    todas sus consultas corren bajo RLS con el rol `authenticated`.
 *
 * El guard NO puede quedar arriba de todo: corre antes del `switch` pero
 * después de la salida de `share-match`. Si alguien mueve ese bloque hacia
 * arriba "para ordenar", rompe el compartir del móvil; si lo mueve hacia
 * abajo, abre las cinco tarjetas de administración a cualquiera.
 *
 * Los dos mecanismos de auth conviven sin pisarse: la app móvil no manda
 * cookies y el dashboard no manda `Authorization`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATES = ["mvp", "elo", "scorer", "epic", "zone", "share-match"] as const;
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

  const { searchParams } = new URL(request.url);

  // Antes que el guard y que los destacados: las fuentes las necesitan TODAS
  // las plantillas, y sin ellas no hay tarjeta que valga la pena renderizar.
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

  // ⚠️ Salida ANTES del guard de admin. Ver la cabecera del archivo: este
  // `return` es lo único que separa "cualquier jugador con sesión comparte su
  // partido" de "hace falta ser admin". No es un endpoint abierto: exige un
  // JWT válido, sólo que uno cualquiera y no el de un admin.
  //
  // Además es la única plantilla que no se alimenta de
  // `content_weekly_highlights` (describe UN partido, no la ventana semanal)
  // y la única que se dibuja a 1080×1920.
  if (template === "share-match") {
    return renderShareMatch(request, searchParams, fonts);
  }

  // ── A partir de acá, sólo admins ────────────────────────────────────────
  // Reusa el mismo guard que las Server Actions (no redirige, devuelve un
  // resultado tipado) — es defensa en profundidad, no la única barrera: la
  // RPC vuelve a exigir is_admin del lado de Postgres.
  const auth = await requireAdminAction();
  if (!auth.ok) {
    return placeholderImage(auth.error, 403);
  }

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
 * Tarjeta "Compartir Partido" (1080×1920, story).
 *
 * El fondo se lee de `assets/og/story-background.png` con `fs` y se pasa como
 * data URI — nunca como `/story-background.png` ni como una URL absoluta al
 * propio deployment. El porqué está en `lib/og/local-asset.ts`; el resumen es
 * que Satori no tiene un origen que resolver dentro de la función y que
 * pedirse la imagen a sí misma se rompe en los Preview Deployments.
 *
 * Si falta el fondo se devuelve el placeholder en vez de una story sin foto:
 * el fondo ES el diseño acá, y una tarjeta negra publicada en Instagram es
 * peor que un error visible en la preview. El wordmark, en cambio, es
 * decorativo y tiene reemplazo tipográfico en la plantilla.
 */
async function renderShareMatch(
  request: Request,
  searchParams: URLSearchParams,
  fonts: OgFont[],
) {
  // El token primero: sin él no hay nada que consultar, y leer el PNG de fondo
  // de disco antes sería trabajo tirado en el camino del 401.
  const accessToken = bearerTokenFrom(request);
  if (!accessToken) {
    return shareMatchErrorImage({
      kind: "unauthorized",
      message: "Falta el header Authorization: Bearer <token>.",
    });
  }

  let background: string;
  try {
    background = loadLocalOgAsset("story-background.png");
  } catch (error) {
    console.error("[og]", error);
    return placeholderImage(
      "Falta assets/og/story-background.png — ver el comentario de lib/og/local-asset.ts.",
      500,
    );
  }

  let result;
  try {
    result = await fetchShareMatchData(searchParams.get("match"), accessToken);
  } catch (error) {
    // Sólo tira si faltan las env vars de Supabase: es un error de
    // configuración del deployment, no del partido pedido.
    console.error("[og/share-match]", error);
    return placeholderImage("El endpoint no está configurado correctamente.", 500);
  }

  if (!result.ok) {
    return shareMatchErrorImage(result.error);
  }

  const { data } = result;

  // En paralelo, igual que en la tarjeta del Partidazo: son hasta tres fetch
  // independientes a Storage con su timeout de 4s cada uno. Encadenados, el
  // peor caso de la story se triplicaría sin ganar nada.
  const [homeShield, awayShield, mvpAvatar] = await Promise.all([
    resolveStorageImage(data.home.shieldPath, "shields", data.home.name),
    resolveStorageImage(data.away.shieldPath, "shields", data.away.name),
    data.mvp
      ? resolveStorageImage(data.mvp.avatarPath, "avatars", data.mvp.name)
      : Promise.resolve(null),
  ]);

  return new ImageResponse(
    (
      <TemplateShareMatch
        matchType={data.matchType}
        format={data.format}
        date={data.date}
        homeTeam={{ name: data.home.name, logo: homeShield }}
        awayTeam={{ name: data.away.name, logo: awayShield }}
        score={{ home: data.home.goals, away: data.away.goals }}
        ratingChange={data.ratingChange}
        mvp={data.mvp && mvpAvatar ? { name: data.mvp.name, avatar: mvpAvatar } : null}
        scorers={data.scorers}
        background={background}
        logo={loadOptionalLocalOgAsset("logo-wordmark.png")}
      />
    ),
    {
      width: OG_STORY_SIZE.width,
      height: OG_STORY_SIZE.height,
      fonts,
      headers: {
        /**
         * `Vary: Authorization` es de CORRECTITUD, no de performance: la
         * imagen sale igual para cualquiera que la pida (depende sólo del
         * `?match=`), así que sin este header el Edge Network podría servirle
         * la copia cacheada a un request SIN token — y la autenticación
         * quedaría salteada para todo partido que alguien ya haya generado.
         * Con `Vary`, cada token tiene su propia entrada de caché.
         *
         * El precio es que el hit rate se desploma: el JWT de Supabase dura
         * ~1h y rota, así que una entrada no se puede reusar más allá de eso.
         * Por eso `s-maxage` bajó de 86400 a 3600 — anunciar un día de caché
         * sobre una clave que vive una hora sólo llena el CDN de entradas
         * muertas. En la práctica esto cachea el reintento del mismo jugador
         * sobre el mismo partido, y nada más.
         *
         * `max-age` corto: si una resolución de disputa corrige el marcador,
         * el teléfono no se queda con la tarjeta equivocada más de unos
         * minutos.
         */
        "Cache-Control": "public, max-age=300, s-maxage=3600",
        Vary: "Authorization",
      },
    },
  );
}

/**
 * Traduce un `ShareMatchError` a imagen + status code.
 *
 * Devuelve SIEMPRE una imagen y nunca un JSON, por la misma razón que
 * `placeholderImage`: del otro lado hay un `<Image>` de React Native, y un
 * cuerpo JSON con status 404 le deja al usuario un cuadro roto sin explicar
 * nada. El status real igual viaja, así que la app puede distinguir "todavía
 * no se puede compartir" de "esto no existe" y decidir si muestra la imagen
 * o su propio mensaje.
 */
function shareMatchErrorImage(error: ShareMatchError) {
  const status =
    error.kind === "unauthorized"
      ? 401
      : error.kind === "invalid-id"
        ? 400
        : error.kind === "not-found"
          ? 404
          : error.kind === "not-shareable"
            ? 409
            : error.kind === "inconsistent"
              ? 409
              : 500;

  // A tamaño de story y no de feed: la app móvil reserva un 9:16 para esta
  // imagen, y devolverle un 4:5 le deforma el layout justo en el caso de
  // error, que es cuando menos se lo espera.
  return placeholderImage(error.message, status, OG_STORY_SIZE);
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
function placeholderImage(
  message: string,
  status = 200,
  size: { width: number; height: number } = OG_SIZE,
) {
  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
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
    {
      width: size.width,
      height: size.height,
      status,
      // Un error no se cachea en el CDN: el partido puede estar EN_DISPUTA
      // ahora y finalizado en diez minutos, y `share-match` sí manda
      // `s-maxage` en el camino feliz. Sin esto, el 409 de un partido en
      // disputa se quedaría pegado un día entero en el edge.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
