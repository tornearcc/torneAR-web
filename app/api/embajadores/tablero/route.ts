// Tablero público del Programa de Embajadores. La zona pública no importa
// lib/supabase (ver app/(public)/layout.tsx), así que este route handler llama
// a la RPC `public_ambassador_board` por REST con la anon key (la RPC la puede
// ejecutar `anon`). Se cachea 10 minutos: el ranking no necesita ser en vivo.
export const revalidate = 600;

const FALLBACK = { enabled: false, slots_total: 100, slots_used: 0, ranking: [] };

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json(FALLBACK);

  try {
    const res = await fetch(`${url}/rest/v1/rpc/public_ambassador_board`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_limit: 50 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return Response.json(FALLBACK);
    const data = await res.json();
    if (!data || typeof data !== "object" || !Array.isArray(data.ranking)) return Response.json(FALLBACK);
    return Response.json(data);
  } catch {
    return Response.json(FALLBACK);
  }
}
