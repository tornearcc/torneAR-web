/**
 * Constantes de plataformas sociales, sin dependencias de servidor.
 *
 * Separado de `lib/social-data.ts` a propósito: ese archivo importa
 * `lib/supabase/server`, que a su vez importa `next/headers` y sólo puede
 * evaluarse en Server Components. `SocialSnapshotForm` es un Client
 * Component y necesita `PLATFORM_LABELS` — importarlo desde `social-data.ts`
 * arrastraría todo ese grafo al bundle del cliente y Next lo rechaza en
 * build ("You're importing a module that depends on next/headers").
 */

export const SOCIAL_PLATFORMS = ["instagram", "tiktok", "x"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
};

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}
