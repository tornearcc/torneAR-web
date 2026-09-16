import type { Metadata } from "next";
import { Inter, Barlow_Condensed, Epilogue } from "next/font/google";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";
import "./globals.css";

// Mismas 3 familias que tornear/tailwind.config.js (font-ui/display/epic),
// cargadas vía next/font en vez del paquete de Expo Google Fonts.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  // Vuelve absolutas las URLs relativas de `openGraph.images` y
  // `twitter.images`, que las previews de WhatsApp y X exigen completas.
  metadataBase: new URL(SITE_URL),
  // Verificación de propiedad del dominio en Google Search Console, que es el
  // requisito para que `tornear.vercel.app` cuente como dominio autorizado en
  // la pantalla de consentimiento de Google (Google Auth Platform → Branding).
  // Sin esto la revisión de marca no avanza, y el diálogo de login sigue
  // mostrando el host de Supabase en vez del nombre de la app.
  // Va como meta tag y no como archivo suelto en public/: Next lo emite solo y
  // queda versionado. No borrar: si el tag desaparece, Search Console revoca la
  // verificación y la marca vuelve a quedar sin verificar.
  verification: { google: "44OiJwFVQB-414DHuc0tJbJ2eY_2OBH3-k6brEFNP2U" },
  title: "torneAR",
  description: SITE_DESCRIPTION,
  // Default de todo el sitio. Una página que declare su propio `openGraph`
  // reemplaza este objeto entero (la mezcla es superficial): por eso la
  // imagen vive en `lib/site-metadata.ts` y no sólo acá.
  openGraph: {
    title: "torneAR — El fútbol amateur, ahora con algo en juego",
    description: SITE_DESCRIPTION,
    siteName: "torneAR",
    locale: "es_AR",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "torneAR — El fútbol amateur, ahora con algo en juego",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${barlowCondensed.variable} ${epilogue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-base text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
