/**
 * Metadata compartida de la zona pública: la usan `app/layout.tsx` (default de
 * todo el sitio) y `app/(public)/i/[username]/page.tsx`.
 *
 * Existe porque Next mezcla la metadata de los segmentos de forma SUPERFICIAL:
 * una página que declara su propio `openGraph` reemplaza el del layout entero,
 * imagen incluida. Sin una constante común, `/i/` tendría que repetir la
 * imagen a mano y el día que cambie quedaría una de las dos desactualizada.
 */

/** Dominio de producción. Es el mismo que compila la app en `associatedDomains`. */
export const SITE_URL = "https://tornear.vercel.app";

export const SITE_DESCRIPTION =
  "Armá tu equipo, desafiá rivales y subí en el ranking del fútbol amateur. Gratis para iPhone.";

/**
 * Imagen para las previews de WhatsApp, Instagram y X.
 *
 * PNG estático en `public/` y NO `/api/og/[template]`: esa ruta está detrás de
 * auth (401/403) y los crawlers de las redes no tienen sesión. Relativa a
 * propósito — `metadataBase` del layout raíz la vuelve absoluta, que es lo que
 * exigen `og:image` y `twitter:image`.
 */
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "torneAR — El fútbol amateur, ahora con algo en juego",
} as const;
