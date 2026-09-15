import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `assets/**` lo lee /api/og/[template] con `fs.readFileSync`: las fuentes
  // `.ttf` del Content Factory (lib/og/fonts.ts) y las imágenes de marca de
  // la story de Compartir Partido (lib/og/local-asset.ts). `assets/` no es
  // `public/`, así que el output file tracing de Vercel no lo detecta solo:
  // sin esto, el build funciona local pero la función serverless deployada no
  // encuentra los archivos y cada imagen sale con la tarjeta de error.
  //
  // El glob es la carpeta entera y no `assets/fonts/**` + `assets/og/**` para
  // que sumar un asset nuevo no obligue a acordarse de tocar este archivo.
  outputFileTracingIncludes: {
    "/api/og/[template]": ["./assets/**"],
  },

  // Sin `images.remotePatterns` a propósito: la única imagen remota eran las
  // evidencias de WO, que ahora son URLs firmadas y se pintan `unoptimized`
  // (ver components/admin/WoClaimsQueue.tsx). El resto de `next/image` usa
  // archivos locales. Un allowlist vacío hace que el optimizador rechace
  // cualquier remoto, que es lo correcto si nadie lo necesita.

  async headers() {
    return [
      {
        // Sin extensión .json, Vercel no puede inferir el Content-Type por
        // el nombre de archivo y lo sirve como application/octet-stream —
        // Apple lo descarta en silencio (sin error visible) y el Universal
        // Link simplemente nunca se activa. assetlinks.json no necesita
        // esto: al tener extensión .json, el Content-Type ya se infiere
        // solo.
        source: "/.well-known/apple-app-site-association",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
