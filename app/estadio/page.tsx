import type { Metadata, Viewport } from "next";

import { EstadioApp } from "@/components/estadio/EstadioApp";
import { OG_IMAGE } from "@/lib/site-metadata";

/*
 * El estadio de «Del potrero al estadio» (serie de reels de @tornear.app): la maqueta 3D para recorrer, buscarse
 * entre los que comentaron y los usuarios de la app, y ver el palco VIP y los polideportivos de los equipos.
 *
 * Fuera de (public) a propósito: va a pantalla completa, sin el header ni el footer de la landing. Igual que la zona
 * pública, no importa nada de lib/supabase: los datos son public/estadio/datos.json, que se actualiza a mano con
 * scripts/estadio/actualizar.py en cada capítulo.
 */

const TITLE = "Buscate en el estadio de TorneAR";
const DESCRIPTION =
  "Los que comentaron «Del potrero al estadio» tienen su lugar en la hinchada. Encontrate, compartilo y meté a tu equipo en el palco VIP.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: "torneAR", locale: "es_AR", type: "website", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
};

export const viewport: Viewport = {
  themeColor: "#0E0E0E",
  // sin zoom del navegador: el pellizco es para la maqueta
  maximumScale: 1,
  viewportFit: "cover",
};

export default function EstadioPage() {
  return <EstadioApp />;
}
