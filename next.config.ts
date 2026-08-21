import type { NextConfig } from "next";

/**
 * Host de Supabase Storage, derivado de la misma env var que usa el cliente.
 *
 * Se deriva en vez de hardcodearse para que el dashboard siga funcionando si
 * el proyecto se apunta a otra instancia (branch de Supabase, entorno de
 * prueba) sin tocar este archivo. Si la variable falta, la lista queda vacía
 * y `next/image` rechaza el remoto — que es el comportamiento correcto:
 * mejor una imagen que no carga que un allowlist abierto.
 */
function supabaseImageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const storageHost = supabaseImageHost();

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

  images: {
    // Evidencias de reclamos de WO (bucket público `wo_evidences`), que la
    // cola de revisión muestra en /dashboard/wo-claims.
    remotePatterns: storageHost
      ? [
          {
            protocol: "https",
            hostname: storageHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

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
