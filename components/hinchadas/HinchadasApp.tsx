"use client";

import { useEffect, useMemo, useState } from "react";

/*
 * Resultado del estadio de clubes y buscador de @. Los datos (public/hinchadas/datos.json) son fijos: el ranking es
 * el del conteo completo del video (Instagram, TikTok y YouTube) y la lista de @ suma a todos los que comentaron.
 */

type Club = { id: string; nombre: string; hinchas: number; grande: boolean; escudo: string | null; color: string; usuarios: string[] };
type Otro = { id: string; nombre: string; usuarios: string[] };
type Datos = { comentarios: string; contados: number; clubes: Club[]; otros: Otro[] };
type Hallado = { usuario: string; club: string; escudo: string | null; color: string; numero: number; total: number; tribuna: boolean };

const APP_URL = "/d/estadio";
const IG_URL = "https://www.instagram.com/tornear.app/";
const fmt = (n: number) => n.toLocaleString("es-AR");
const norm = (s: string) => s.trim().toLowerCase().replace(/^@+/, "");

export function HinchadasApp() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/hinchadas/datos.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDatos)
      .catch(() => setError(true));
  }, []);

  // índice: @ → dónde está
  const indice = useMemo(() => {
    const m = new Map<string, Hallado>();
    if (!datos) return m;
    for (const c of datos.clubes)
      c.usuarios.forEach((u, i) =>
        m.set(u.toLowerCase(), { usuario: u, club: c.nombre, escudo: c.escudo, color: c.color, numero: i + 1, total: c.usuarios.length, tribuna: true }),
      );
    for (const c of datos.otros)
      c.usuarios.forEach((u, i) => {
        if (!m.has(u.toLowerCase()))
          m.set(u.toLowerCase(), { usuario: u, club: c.nombre, escudo: null, color: "#53E076", numero: i + 1, total: c.usuarios.length, tribuna: false });
      });
    return m;
  }, [datos]);

  const consulta = norm(q);
  const exacto = consulta ? indice.get(consulta) : undefined;
  const parecidos = useMemo(() => {
    if (!consulta || consulta.length < 3 || exacto) return [];
    const r: Hallado[] = [];
    for (const [k, v] of indice) {
      if (k.includes(consulta)) r.push(v);
      if (r.length >= 6) break;
    }
    return r;
  }, [consulta, exacto, indice]);

  const max = datos ? Math.max(...datos.clubes.map((c) => c.hinchas)) : 1;

  return (
    <main className="min-h-dvh bg-[#0E0E0E] px-4 pt-8 pb-16 text-white">
      <div className="mx-auto w-full max-w-md">
        <a href={IG_URL} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
          @tornear.app
        </a>
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold uppercase">
          ¿Qué hinchada llenó <span className="text-brand-primary">primero su tribuna?</span>
        </h1>
        <p className="mt-3 text-white/70">
          {datos ? `${datos.comentarios} comentarios en Instagram, TikTok y YouTube. ` : ""}Buscá tu @ y fijate en qué tribuna quedaste.
        </p>

        <label className="mt-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[#111]">
          <span aria-hidden>🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tu @ de Instagram, TikTok o YouTube"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-[#999]"
          />
        </label>

        {error && <p className="mt-4 text-red-400">No pudimos cargar el estadio. Probá de nuevo en un rato.</p>}
        {!datos && !error && <p className="mt-4 text-white/60">Cargando el estadio…</p>}

        {exacto && <Tarjeta h={exacto} />}
        {!exacto && parecidos.length > 0 && (
          <ul className="mt-4 space-y-2">
            {parecidos.map((h) => (
              <li key={h.usuario}>
                <button onClick={() => setQ(h.usuario)} className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-left font-semibold">
                  @{h.usuario} <span className="text-white/60">· {h.club}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {datos && consulta.length >= 3 && !exacto && parecidos.length === 0 && (
          <p className="mt-4 text-white/70">
            No encontramos a @{consulta}. Si comentaste tarde, puede que hayas quedado afuera del conteo: escribinos por Instagram y te sumamos.
          </p>
        )}

        {datos && (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">El resultado</h2>
            <ol className="mt-3 space-y-2.5">
              {datos.clubes.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-7 text-right font-display text-xl font-extrabold text-[#FFD84D]">{c.grande ? `${i + 1}.º` : "★"}</span>
                  {c.escudo ? <img src={c.escudo} alt="" className="h-8 w-8 object-contain" /> : <span className="h-8 w-8" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 font-bold">
                      <span className="truncate">{c.nombre}</span>
                      <span className="text-white/70">{fmt(c.hinchas)}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(3, (100 * c.hinchas) / max)}%`, background: c.color }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-white/50">★ Tribuna nueva: los dos clubes que no son de los cinco grandes con más hinchas. Conteo completo de Instagram, TikTok y YouTube (24/11).</p>
          </section>
        )}

        <section className="mt-10 rounded-3xl border-2 border-brand-primary p-5">
          <h2 className="font-display text-3xl leading-none font-extrabold uppercase">¿Tu equipo juega los fines de semana?</h2>
          <p className="mt-2 text-white/80">
            Que tenga su propia tribuna. En TorneAR armás tu equipo, buscás rivales y cada partido suma en el ranking.
          </p>
          <a
            href={APP_URL}
            className="mt-4 block rounded-2xl bg-brand-primary py-3 text-center font-display text-xl font-extrabold tracking-wide text-surface-lowest uppercase"
          >
            Bajá TorneAR gratis
          </a>
          <a href={IG_URL} className="mt-3 block text-center text-sm font-bold text-brand-primary">
            Seguinos: el próximo estadio lo llenás vos
          </a>
        </section>
      </div>
    </main>
  );
}

function Tarjeta({ h }: { h: Hallado }) {
  return (
    <div className="mt-4 rounded-3xl p-5 text-white" style={{ background: h.color }}>
      <div className="flex items-center gap-3">
        {h.escudo && <img src={h.escudo} alt="" className="h-14 w-14 rounded-full bg-white/90 object-contain p-1" />}
        <div className="min-w-0">
          <div className="truncate text-xl font-extrabold">@{h.usuario}</div>
          <div className="font-display text-lg font-extrabold uppercase">
            {h.tribuna ? `Tribuna de ${h.club}` : `Hincha de ${h.club}`}
          </div>
        </div>
      </div>
      <p className="mt-3 font-semibold">
        {h.tribuna
          ? `Sos el hincha n.º ${fmt(h.numero)} de la tribuna. 🏟️`
          : `${h.club} no llegó a tener tribuna esta vez (${fmt(h.total)} hinchas). En el próximo estadio, que comente toda la hinchada.`}
      </p>
    </div>
  );
}
