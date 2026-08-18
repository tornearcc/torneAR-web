import type { Metadata } from "next";
import { Inter, Barlow_Condensed, Epilogue } from "next/font/google";
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
  title: "torneAR",
  description:
    "torneAR — organizá torneos y partidos de fútbol amateur, con equipos, resultados y un ranking que importa.",
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
