import type { Metadata, Viewport } from "next";

import { HinchadasApp } from "@/components/hinchadas/HinchadasApp";
import { OG_IMAGE } from "@/lib/site-metadata";

/*
 * «¿Qué hinchada llena primero su tribuna?» (reels del estadio de clubes de @tornear.app): el resultado y el buscador
 * para encontrar tu @ en la tribuna de tu club. Datos fijos en public/hinchadas/datos.json, que arma
 * contenido/2-proyectos/estadio-clubes/final/armar_web.py; la página no consulta la base (link de la bio de @tornear.app).
 */

const TITLE = "Buscate en la tribuna de tu club · TorneAR";
const DESCRIPTION = "Más de 130.000 comentarios llenaron el estadio. Buscá tu @ en la tribuna de tu club.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: "torneAR", locale: "es_AR", type: "website", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
};

export const viewport: Viewport = { themeColor: "#0E0E0E" };

export default function HinchadasPage() {
  return <HinchadasApp />;
}
