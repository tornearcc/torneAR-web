import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/supabase";

/**
 * Link de descarga con medición (#37): `tornear.vercel.app/d/<canal>`.
 *
 * Redirige a la ficha de la App Store con `pt` (provider token de la cuenta) y
 * `ct` (el canal). Con eso, App Store Connect → Analytics → Campañas muestra
 * impresiones de la ficha, descargas y primeras aperturas por canal, sin SDK.
 * Además se registra el click (`log_link_click`, migración 20260929150000)
 * para verlo al día en Crecimiento.
 *
 * - Canal fuera de la lista: redirige igual, sin `ct` y sin registrar.
 * - Android: la app no está publicada en Play, así que va a la landing.
 * - Bots de vista previa (WhatsApp, Instagram, X…): redirigen igual pero no
 *   cuentan. Si no, cada link pegado en un chat sumaría un click.
 * - HEAD (`curl -I`, algunos chequeos de links) no cuenta.
 */

export const dynamic = "force-dynamic";

const CHANNELS = ["dm", "wpp", "story", "cancha"] as const;
type Channel = (typeof CHANNELS)[number];

const APP_STORE_URL = "https://apps.apple.com/ar/app/tornear/id6809490985";
const PROVIDER_TOKEN = "129423221";

const BOT_UA = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|embedly|curl|wget/i;

function isChannel(value: string): value is Channel {
  return (CHANNELS as readonly string[]).includes(value);
}

function platformOf(userAgent: string): "ios" | "android" | "otro" {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  return "otro";
}

function destination(request: NextRequest, channel: Channel | null, platform: string): URL {
  if (platform === "android") return new URL("/", request.url);
  const url = new URL(APP_STORE_URL);
  url.searchParams.set("pt", PROVIDER_TOKEN);
  if (channel) url.searchParams.set("ct", channel);
  url.searchParams.set("mt", "8");
  return url;
}

async function logClick(channel: Channel, platform: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.rpc("log_link_click", { p_channel: channel, p_platform: platform });
  // Un click que no se pudo registrar no puede frenar la descarga.
  if (error) console.error("[d] log_link_click falló:", error.message);
}

async function handle(request: NextRequest, rawChannel: string, count: boolean) {
  const normalized = rawChannel.trim().toLowerCase();
  const channel = isChannel(normalized) ? normalized : null;
  const userAgent = request.headers.get("user-agent") ?? "";
  const platform = platformOf(userAgent);

  if (count && channel && !BOT_UA.test(userAgent)) {
    await logClick(channel, platform);
  }

  // 302 y sin caché: cada click tiene que llegar hasta acá para contarse.
  const response = NextResponse.redirect(destination(request, channel, platform), 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ canal: string }> }) {
  const { canal } = await params;
  return handle(request, canal, true);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ canal: string }> }) {
  const { canal } = await params;
  return handle(request, canal, false);
}
