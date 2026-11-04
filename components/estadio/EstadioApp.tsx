"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type Datos,
  type Resultado,
  type Seleccion,
  PALCO_MIN,
  buscar,
  lugarTexto,
  normalizar,
  siguientePaso,
} from "./disposicion";
import type { Estadio, Zona } from "./escena";
import { armarTarjeta } from "./tarjeta";

/*
 * Web del estadio: la maqueta 3D a pantalla completa y, encima, lo mínimo para buscarse y dar el paso siguiente.
 * Los datos son un archivo fijo (public/estadio/datos.json) que se actualiza con cada capítulo: la página no le
 * pega a la base. La escena se carga aparte (import dinámico) para que el buscador funcione aunque el 3D tarde o
 * el teléfono no pueda con WebGL.
 */

const APP_URL = "/d/estadio";
const DM_URL = "https://ig.me/m/tornear.app";
const IG_URL = "https://www.instagram.com/tornear.app/";
const fmt = (n: number) => n.toLocaleString("es-AR");

const ZONAS: { z: Zona; txt: string }[] = [
  { z: "inicio", txt: "Estadio" },
  { z: "hinchada", txt: "Hinchada" },
  { z: "platea", txt: "Platea" },
  { z: "palco", txt: "Palco VIP" },
  { z: "polideportivo", txt: "Polideportivo" },
  { z: "banco", txt: "Banco" },
  { z: "cancha", txt: "Cancha" },
];

/** Cómo se entra a cada lugar del estadio (lo que se muestra al tocar una zona y en la guía). */
const COMO: Partial<Record<Zona, { titulo: string; pasos: string[]; boton?: string }>> = {
  hinchada: {
    titulo: "Hinchada",
    pasos: [
      "Seguí a @tornear.app y comentá en cualquier reel de «Del potrero al estadio».",
      "Con cada capítulo nuevo actualizamos el estadio: tu @ aparece parado alrededor de la cancha.",
      "Los que comentan primero quedan más cerca. Tu lugar no cambia nunca.",
    ],
  },
  platea: {
    titulo: "Platea TorneAR",
    pasos: [
      "Bajá TorneAR (es gratis) y creá tu cuenta.",
      "En la próxima actualización tu usuario se sienta en la platea, con fila y asiento.",
    ],
    boton: "Bajar TorneAR",
  },
  palco: {
    titulo: "Palco VIP",
    pasos: [
      "Creá tu equipo en la app (o sumate al de tus amigos).",
      "Invitá a tu gente con el link de invitación del equipo hasta llegar a 4 integrantes o más.",
      "Con 4 o más, el escudo del equipo entra a un cuadro del palco VIP.",
    ],
    boton: "Armar mi equipo",
  },
  polideportivo: {
    titulo: "Polideportivo propio",
    pasos: [
      "Con tu equipo, desafiá a otro equipo desde la app.",
      "Jueguen el partido y carguen el resultado en TorneAR.",
      "Cuando el partido queda terminado, le construimos a tu equipo su propio polideportivo con su escudo. El de Maldito 32 es el ejemplo.",
    ],
    boton: "Desafiar a un rival",
  },
  cancha: {
    titulo: "Partido inaugural",
    pasos: ["Los dos primeros equipos que jueguen un partido en TorneAR quedan en el marcador del partido inaugural."],
    boton: "Desafiar a un rival",
  },
  banco: {
    titulo: "Lo que construimos con las metas",
    pasos: [
      "Cada meta de seguidores de @tornear.app suma algo al estadio.",
      "Con los 7.500 llegaron el banco de suplentes y el cemento con los colores de TorneAR. Los carteles (10.000) se ven de fantasma hasta que se cumpla.",
    ],
  },
};
const GUIA: Zona[] = ["hinchada", "platea", "palco", "polideportivo"];

function soportaWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

export function EstadioApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capaRef = useRef<HTMLDivElement>(null);
  const estadioRef = useRef<Estadio | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [datos, setDatos] = useState<Datos | null>(null);
  const datosRef = useRef<Datos | null>(null);
  useEffect(() => {
    datosRef.current = datos;
  }, [datos]);
  const [error, setError] = useState(false);
  const [modo3d, setModo3d] = useState<"cargando" | "listo" | "sin3d">("cargando");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Seleccion | null>(null);
  const [zona, setZona] = useState<Zona>("inicio");
  const [ayuda, setAyuda] = useState(true);
  const [compartiendo, setCompartiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guia, setGuia] = useState(false);

  // datos
  useEffect(() => {
    fetch("/estadio/datos.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setDatos)
      .catch(() => setError(true));
  }, []);

  const elegir = useCallback((s: Seleccion | null, mover = true) => {
    setSel(s);
    setQ("");
    if (s) {
      if (mover) estadioRef.current?.enfocar(s);
      if (datosRef.current) {
        const url = new URL(location.href);
        url.searchParams.set("b", parametroDe(datosRef.current, s));
        history.replaceState(null, "", url);
      }
    } else {
      estadioRef.current?.limpiar();
      history.replaceState(null, "", location.pathname);
    }
  }, []);

  // escena 3D
  useEffect(() => {
    if (!datos || !canvasRef.current || !capaRef.current) return;
    let vivo = true;
    let est: Estadio | null = null;
    const cs = getComputedStyle(document.documentElement);
    const fuentes = {
      display: cs.getPropertyValue("--font-barlow-condensed").trim() || "sans-serif",
      ui: cs.getPropertyValue("--font-inter").trim() || "sans-serif",
    };
    import("./escena")
      .then(({ Estadio }) => {
        if (!vivo || !canvasRef.current || !capaRef.current) return;
        if (!soportaWebGL()) return setModo3d("sin3d");
        est = new Estadio(canvasRef.current, capaRef.current, datos, fuentes, {
          onElegir: (s) => {
            setAyuda(false);
            if (s) elegir(s, false);
          },
          onMover: () => setAyuda(false),
        });
        estadioRef.current = est;
        setModo3d("listo");
        // link compartido: ?b=@usuario, ?b=equipo o los índices que deja la propia página
        const b = new URLSearchParams(location.search).get("b");
        if (b) {
          const s = desdeParametro(datos, b);
          if (s) {
            setSel(s);
            setTimeout(() => est?.enfocar(s), 600);
          }
        }
      })
      .catch(() => setModo3d("sin3d"));
    return () => {
      vivo = false;
      est?.destruir();
      estadioRef.current = null;
    };
  }, [datos, elegir]);

  // etiqueta de la persona elegida dentro de la maqueta
  useEffect(() => {
    if (!datos || !sel) return;
    const t = lugarTexto(datos, sel);
    estadioRef.current?.setEtiqueta(sel.tipo === "equipo" ? t.titulo : `${t.titulo} · ACÁ ESTÁ`);
  }, [datos, sel, modo3d]);

  // lo que tapan el encabezado y el panel de abajo (en el celular, el panel ocupa todo el ancho)
  useEffect(() => {
    const h = headerRef.current, p = panelRef.current;
    if (!h || !p || modo3d !== "listo") return;
    const medir = () => {
      const ancho = p.getBoundingClientRect().width > innerWidth * 0.7;
      estadioRef.current?.setMargenes(ancho ? h.getBoundingClientRect().bottom : 0, ancho ? innerHeight - p.getBoundingClientRect().top : 0);
    };
    const ro = new ResizeObserver(medir);
    ro.observe(h);
    ro.observe(p);
    addEventListener("resize", medir);
    medir();
    return () => {
      ro.disconnect();
      removeEventListener("resize", medir);
    };
  }, [modo3d]);

  const resultados = useMemo(() => (datos ? buscar(datos, q) : []), [datos, q]);

  const irA = (z: Zona) => {
    setZona(z);
    setSel(null);
    setAyuda(false);
    history.replaceState(null, "", location.pathname);
    estadioRef.current?.irA(z);
  };

  const compartir = async () => {
    if (!datos || !sel) return;
    setCompartiendo(true);
    try {
      const foto = (await estadioRef.current?.capturar()) ?? null;
      const tarjeta = await armarTarjeta(datos, sel, foto);
      const archivo = new File([tarjeta], "mi-lugar-en-el-estadio.png", { type: "image/png" });
      const url = location.href;
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: "Mi lugar en el estadio de TorneAR", text: `Buscate vos también: ${url}` });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(tarjeta);
        a.download = archivo.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        setAviso("Bajamos la imagen: subila a tu historia y etiquetá a @tornear.app");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setAviso("No pudimos armar la imagen. Probá de nuevo.");
    } finally {
      setCompartiendo(false);
    }
  };

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const meta = datos?.metas.find((m) => !m.ok);
  const metaAnterior = datos ? [...datos.metas].reverse().find((m) => m.ok) : undefined;
  const avance = datos && meta ? (datos.seguidores - (metaAnterior?.n ?? 0)) / (meta.n - (metaAnterior?.n ?? 0)) : 1;

  return (
    <div className="estadio fixed inset-0 overflow-hidden bg-[#F3C792] text-white select-none">
      {/* maqueta */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full touch-none transition-opacity duration-700 ${modo3d === "listo" ? "opacity-100" : "opacity-0"}`}
        aria-label="Maqueta 3D del estadio de TorneAR: arrastrá para girar, pellizcá para acercarte y tocá a la gente para ver quién es."
      />
      <div ref={capaRef} className="pointer-events-none absolute inset-0" aria-hidden />
      {modo3d !== "listo" && <Fondo cargando={modo3d === "cargando" && !error} />}

      {/* arriba: marca, capítulo y meta */}
      <header ref={headerRef} className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href="/" className="pointer-events-auto glass flex items-center gap-2 rounded-2xl px-3 py-2" aria-label="TorneAR, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-header.png" alt="torneAR" className="h-6 w-auto" />
          </Link>
          <a
            href={APP_URL}
            className="pointer-events-auto rounded-2xl bg-brand-primary px-4 py-2.5 font-display text-lg leading-none font-extrabold tracking-wide text-surface-lowest uppercase shadow-lg transition hover:bg-brand-primary-fixed"
          >
            Bajá la app
          </a>
        </div>
        {datos && (
          <div className={`glass pointer-events-auto mt-2.5 max-w-sm rounded-2xl px-4 py-2.5 sm:mt-3 sm:block sm:py-3 ${sel || zona !== "inicio" ? "hidden" : ""}`}>
            <p className="font-display text-xs font-bold tracking-[0.14em] text-brand-primary uppercase sm:text-sm">
              Del potrero al estadio · Capítulo {datos.capitulo}
            </p>
            <h1 className="font-display text-[1.7rem] leading-[0.95] font-extrabold uppercase sm:text-4xl">El estadio de TorneAR</h1>
            {meta && (
              <div className="mt-2.5">
                <div className="flex items-baseline justify-between gap-2 text-xs text-neutral-on-surface-variant">
                  <span>
                    <b className="text-white">{fmt(datos.seguidores)}</b> seguidores
                  </span>
                  <span>
                    Meta {fmt(meta.n)}: {meta.txt.toLowerCase()}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.round(Math.min(1, Math.max(0.03, avance)) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {ayuda && modo3d === "listo" && !sel && (
        <p className="glass pointer-events-none absolute top-[46%] left-1/2 z-10 w-max max-w-[88vw] -translate-x-1/2 rounded-full px-4 py-2 text-center text-xs sm:text-sm">
          Arrastrá para girar · Pellizcá para acercarte · Tocá a la gente
        </p>
      )}

      {/* abajo: buscador o tarjeta */}
      <section ref={panelRef} className="absolute inset-x-0 bottom-0 z-20 p-3 sm:right-auto sm:bottom-5 sm:left-5 sm:w-[25rem] sm:p-0">
        {aviso && <p className="glass mb-2 rounded-2xl px-4 py-2.5 text-sm">{aviso}</p>}
        {datos && sel ? (
          <Tarjeta datos={datos} sel={sel} onCerrar={() => elegir(null)} onCompartir={compartir} compartiendo={compartiendo} onGuia={() => setGuia(true)} />
        ) : (
          <div className="glass max-h-[72dvh] overflow-y-auto rounded-3xl p-4">
            {error ? (
              <p className="text-sm">No pudimos cargar el estadio. Recargá la página.</p>
            ) : (
              <>
                <h2 className={`font-display text-2xl leading-none font-extrabold uppercase sm:block ${COMO[zona] ? "hidden" : ""}`}>Buscate en el estadio</h2>
                <p className={`mt-1 text-sm text-neutral-on-surface-variant sm:block ${COMO[zona] ? "hidden" : ""}`}>
                  {datos ? (
                    <>
                      {fmt(datos.hinchas.filter(Boolean).length)} hinchas y {fmt(datos.platea.filter(Boolean).length)} jugadores ya tienen su lugar.
                    </>
                  ) : (
                    "Cargando la gente…"
                  )}
                </p>
                <div className={`relative sm:mt-3 ${COMO[zona] ? "" : "mt-3"}`}>
                  {resultados.length > 0 && (
                    <ul className="absolute inset-x-0 bottom-full mb-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-surface-lowest/95 p-1.5 shadow-2xl">
                      {resultados.map((r) => (
                        <li key={`${r.tipo}${r.i}`}>
                          <button
                            type="button"
                            onClick={() => elegir(r)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/8 focus-visible:bg-white/8 focus-visible:outline-none"
                          >
                            <Icono r={r} datos={datos!} />
                            <span className="min-w-0">
                              <span className="block truncate font-bold">{r.texto}</span>
                              <span className="block text-xs text-neutral-on-surface-variant">{r.sub}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <label className="sr-only" htmlFor="buscar-estadio">
                    Tu usuario de Instagram, de la app o tu equipo
                  </label>
                  <input
                    id="buscar-estadio"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && resultados[0]) elegir(resultados[0]);
                    }}
                    placeholder="Tu @, tu usuario o tu equipo"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={!datos}
                    className="w-full rounded-2xl border-2 border-brand-primary/60 bg-surface-lowest/80 px-4 py-3.5 text-base text-white placeholder:text-white/45 focus:border-brand-primary focus:outline-none"
                  />
                </div>
                {datos && normalizar(q).length >= 3 && resultados.length === 0 && (
                  <p className="mt-2 text-sm text-neutral-on-surface-variant">
                    No te encontramos. Comentá en el próximo capítulo y aparecés:{" "}
                    <a href={IG_URL} className="font-bold text-brand-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                      @tornear.app
                    </a>
                  </p>
                )}
                {modo3d === "listo" && (
                  <nav className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Zonas del estadio">
                    {ZONAS.map(({ z, txt }) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => irA(z)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                          zona === z ? "border-brand-primary bg-brand-primary text-surface-lowest" : "border-white/15 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {txt}
                      </button>
                    ))}
                  </nav>
                )}
                {COMO[zona] && <InfoZona info={COMO[zona]!} />}
                <button
                  type="button"
                  onClick={() => setGuia(true)}
                  className="mt-3 w-full rounded-xl border border-brand-gold/50 bg-brand-gold/10 py-2.5 text-sm font-bold text-brand-gold transition hover:bg-brand-gold/20"
                >
                  ¿Cómo me sumo a cada lugar?
                </button>
                <p className="mt-3 text-[11px] leading-snug text-white/45">
                  Aparecen los que comentaron la serie y los usuarios de la app.{" "}
                  <a href={DM_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white/70">
                    No quiero aparecer
                  </a>
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {guia && <Guia onCerrar={() => setGuia(false)} />}
    </div>
  );
}

function InfoZona({ info }: { info: { titulo: string; pasos: string[]; boton?: string } }) {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="font-display text-sm font-bold tracking-[0.12em] text-brand-gold uppercase">Cómo entrar · {info.titulo}</p>
      <ol className="mt-1.5 space-y-1 text-[13px] leading-snug text-white/85 sm:text-sm">
        {info.pasos.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-display font-extrabold text-brand-primary">{i + 1}</span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
      {info.boton && (
        <a href={APP_URL} className="mt-2.5 block rounded-xl bg-brand-primary py-2.5 text-center font-display text-lg leading-none font-extrabold tracking-wide text-surface-lowest uppercase">
          {info.boton}
        </a>
      )}
    </div>
  );
}

function Guia({ onCerrar }: { onCerrar: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onCerrar]);
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guia-titulo"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-surface-lowest p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-sm font-bold tracking-[0.12em] text-brand-primary uppercase">Del potrero al estadio</p>
            <h2 id="guia-titulo" className="font-display text-3xl leading-none font-extrabold uppercase">
              Cómo sumarte a cada lugar
            </h2>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-on-surface-variant">
          Cada lugar es un escalón: de comentar a jugar. Actualizamos el estadio con cada capítulo nuevo de la serie.
        </p>
        <ol className="mt-4 space-y-3">
          {GUIA.map((z, k) => {
            const info = COMO[z]!;
            return (
              <li key={z} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <p className="flex items-center gap-2 font-display text-xl leading-none font-extrabold uppercase">
                  <span className="grid size-7 place-items-center rounded-full bg-brand-primary text-base text-surface-lowest">{k + 1}</span>
                  {info.titulo}
                </p>
                <ul className="mt-2 space-y-1 text-sm leading-snug text-white/85">
                  {info.pasos.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand-primary">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
        <a
          href={APP_URL}
          className="mt-4 block rounded-xl bg-brand-primary py-3 text-center font-display text-xl leading-none font-extrabold tracking-wide text-surface-lowest uppercase transition hover:bg-brand-primary-fixed"
        >
          Bajar TorneAR gratis
        </a>
      </div>
    </div>
  );
}

/** Link para compartir: ?b=@usuario (hinchada), ?b=usuario (app) o ?b=equipo:Nombre. */
function parametroDe(d: Datos, s: Seleccion) {
  if (s.tipo === "hincha") return "@" + d.hinchas[s.i]![0];
  if (s.tipo === "platea") return d.platea[s.i]![0];
  return "equipo:" + d.equipos[s.i].nombre;
}

function desdeParametro(d: Datos, b: string): Seleccion | null {
  const igual = (x: string, y: string) => normalizar(x) === normalizar(y);
  if (b.startsWith("equipo:")) {
    const i = d.equipos.findIndex((e) => igual(e.nombre, b.slice(7)));
    return i >= 0 ? { tipo: "equipo", i } : null;
  }
  if (b.startsWith("@")) {
    const i = d.hinchas.findIndex((h) => h && igual(h[0], b));
    if (i >= 0) return { tipo: "hincha", i };
  }
  const i = d.platea.findIndex((p) => p && igual(p[0], b));
  if (i >= 0) return { tipo: "platea", i };
  const r = buscar(d, b, 1)[0];
  return r && igual(r.texto, b) ? { tipo: r.tipo, i: r.i } : null;
}

function Icono({ r, datos }: { r: Resultado; datos: Datos }) {
  if (r.tipo === "equipo") {
    const e = datos.equipos[r.i];
    return e.escudo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={e.escudo} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
    ) : (
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-high font-display text-lg font-extrabold text-brand-primary">
        {e.nombre.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold ${
        r.tipo === "platea" ? "bg-brand-primary text-surface-lowest" : "bg-white/10 text-white"
      }`}
    >
      {r.tipo === "platea" ? "APP" : "IG"}
    </span>
  );
}

function Tarjeta({
  datos,
  sel,
  onCerrar,
  onCompartir,
  compartiendo,
  onGuia,
}: {
  datos: Datos;
  sel: Seleccion;
  onCerrar: () => void;
  onCompartir: () => void;
  compartiendo: boolean;
  onGuia: () => void;
}) {
  const t = lugarTexto(datos, sel);
  const paso = siguientePaso(datos, sel);
  const equipos = sel.tipo === "platea" ? datos.platea[sel.i]![1].map((k) => datos.equipos[k]) : sel.tipo === "equipo" ? [datos.equipos[sel.i]] : [];
  return (
    <div className="glass max-h-[72dvh] overflow-y-auto rounded-3xl p-4" role="dialog" aria-label={`${t.titulo}: ${t.lugar}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold tracking-[0.12em] text-brand-gold uppercase">{t.lugar}</p>
          <h2 className="truncate font-display text-4xl leading-none font-extrabold">{t.titulo}</h2>
          <p className="mt-1 text-sm text-neutral-on-surface-variant">{t.detalle}</p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Buscar a otro"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20"
        >
          ✕
        </button>
      </div>
      {sel.tipo !== "equipo" &&
        equipos.map((e) => (
          <div key={e.nombre} className="mt-3 flex items-center gap-3 rounded-2xl bg-white/6 p-2.5">
            {e.escudo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.escudo} alt="" className="size-11 rounded-xl object-cover" />
            ) : (
              <span className="grid size-11 place-items-center rounded-xl bg-surface-high font-display text-xl font-extrabold text-brand-primary">
                {e.nombre.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold">{e.nombre}</p>
              <p className="text-xs text-neutral-on-surface-variant">
                {e.jugados > 0 ? "Con polideportivo propio" : e.n >= PALCO_MIN ? "En el palco VIP" : `${e.n}/${PALCO_MIN} para el palco VIP`}
              </p>
            </div>
          </div>
        ))}
      <div className="mt-3 rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-3">
        <p className="text-sm leading-snug">{paso.texto}</p>
        <a
          href={APP_URL}
          className="mt-2.5 block rounded-xl bg-brand-primary py-3 text-center font-display text-xl leading-none font-extrabold tracking-wide text-surface-lowest uppercase transition hover:bg-brand-primary-fixed"
        >
          {paso.boton}
        </a>
      </div>
      <button
        type="button"
        onClick={onCompartir}
        disabled={compartiendo}
        className="mt-2 w-full rounded-xl border border-white/20 py-2.5 font-bold transition hover:bg-white/10 disabled:opacity-60"
      >
        {compartiendo ? "Armando la imagen…" : sel.tipo === "equipo" ? "Compartir el lugar del equipo" : "Compartir mi lugar en historias"}
      </button>
      <button type="button" onClick={onGuia} className="mt-2 w-full text-center text-sm font-bold text-brand-gold hover:underline">
        ¿Cómo subo al palco o al polideportivo?
      </button>
    </div>
  );
}

function Fondo({ cargando }: { cargando: boolean }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#4F86C6_0%,#F7C98B_62%,#B98955_100%)]">
      {cargando && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          <p className="mt-3 font-display text-xl font-extrabold tracking-wide uppercase">Armando el estadio…</p>
        </div>
      )}
    </div>
  );
}
