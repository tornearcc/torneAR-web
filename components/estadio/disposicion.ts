/**
 * Dónde está cada uno en el estadio. Lo usan la escena 3D (para dibujar) y la interfaz (para decir «Hinchada
 * Norte · fila 3»), así que tiene que ser puro y determinístico: el mismo datos.json da siempre los mismos lugares.
 *
 * Los lugares no se mueven entre actualizaciones porque el script conserva el orden de las listas y los nuevos van
 * al final: la hinchada se llena de adentro hacia afuera (los que comentaron primero, más cerca de la cancha) y la
 * platea de adelante hacia atrás. Si cambian las constantes de acá, todos cambian de lugar: no tocarlas a la ligera.
 */

export type Hincha = [usuario: string, capitulo: number] | null;
export type Platea = [usuario: string, equipos: number[]] | null;
export type Equipo = { nombre: string; n: number; escudo: string | null; jugados: number; ejemplo: boolean };
export type Meta = { n: number; txt: string; ok: boolean };
export type Datos = {
  capitulo: number;
  actualizado: string;
  seguidores: number;
  metas: Meta[];
  hinchas: Hincha[];
  platea: Platea[];
  equipos: Equipo[];
};

export type Seleccion = { tipo: "hincha" | "platea" | "equipo"; i: number };

export const PALCO_MIN = 4;

// ── platea: la tribuna de la cancha, 5 filas ──
export const PLATEA_FILAS = 5;
const PLATEA_PASO = 0.41;
export function plateaPorFila(n: number) {
  return Math.min(83, Math.max(52, Math.ceil(n / PLATEA_FILAS)));
}
export function anchoTribuna(n: number) {
  return Math.max(22, (plateaPorFila(n) - 1) * PLATEA_PASO + 1);
}
export function asientoPlatea(i: number, n: number) {
  const porFila = plateaPorFila(n);
  const fila = Math.floor(i / porFila), j = i % porFila, ancho = (porFila - 1) * PLATEA_PASO;
  return { fila, asiento: j, x: -ancho / 2 + j * PLATEA_PASO, y: 0.55 * (fila + 1), z: 8.75 + 0.9 * fila };
}

// ── hinchada: parados alrededor del estadio ──
// Núcleo (cancha, cabeceras, tribuna) y franja sur (lotes de polideportivos) quedan libres.
const NUCLEO = { x: 17.6, zN: -9.4, zS: 13.9 };
const SUR_POLI = 17;
const LIMITE = { x: 56, zN: -18.3 };
const PASO = 0.5;

function hash(a: number, b: number) {
  let h = Math.imul(a * 73856093 ^ b * 19349663, 0x9e3779b1);
  h ^= h >>> 15;
  return ((h >>> 0) % 10000) / 10000;
}

let cacheHinchada: { n: number; pos: Float32Array; filas: Uint16Array; sector: Uint8Array } | null = null;
export const SECTORES = ["Norte", "Oeste", "Este", "Sur"] as const;

/** Posiciones (x, z) de los primeros n lugares de la hinchada, de adentro hacia afuera. */
export function hinchada(n: number) {
  if (cacheHinchada && cacheHinchada.n === n) return cacheHinchada;
  const cand: { x: number; z: number; d: number; s: number }[] = [];
  for (let x = -LIMITE.x; x <= LIMITE.x; x += PASO) {
    for (let z = LIMITE.zN; z <= SUR_POLI; z += PASO) {
      const dentro = Math.abs(x) < NUCLEO.x && z > NUCLEO.zN && z < NUCLEO.zS;
      if (dentro) continue;
      const dx = Math.max(0, Math.abs(x) - NUCLEO.x);
      const dz = z < NUCLEO.zN ? NUCLEO.zN - z : z > NUCLEO.zS ? z - NUCLEO.zS : 0;
      const d = Math.hypot(dx, dz);
      const s = z <= NUCLEO.zN && Math.abs(x) < NUCLEO.x + 2 ? 0 : z >= NUCLEO.zS && Math.abs(x) < NUCLEO.x + 2 ? 3 : x < 0 ? 1 : 2;
      const ix = Math.round(x / PASO), iz = Math.round(z / PASO);
      cand.push({ x: x + (hash(ix, iz) - 0.5) * 0.16, z: z + (hash(iz, ix) - 0.5) * 0.16, d: d + hash(ix + 7, iz) * 0.01, s });
    }
  }
  cand.sort((a, b) => a.d - b.d);
  const pos = new Float32Array(n * 2), filas = new Uint16Array(n), sector = new Uint8Array(n);
  for (let i = 0; i < n && i < cand.length; i++) {
    pos[i * 2] = cand[i].x;
    pos[i * 2 + 1] = cand[i].z;
    filas[i] = Math.floor(cand[i].d / PASO) + 1;
    sector[i] = cand[i].s;
  }
  cacheHinchada = { n, pos, filas, sector };
  return cacheHinchada;
}

// ── palco VIP: equipos de 4 o más, de mayor a menor; siempre queda un lugar libre ──
export function palco(d: Datos) {
  const eq = d.equipos.map((e, i) => ({ e, i })).filter(({ e }) => e.n >= PALCO_MIN);
  eq.sort((a, b) => b.e.n - a.e.n || a.i - b.i);
  const ocupados = eq.slice(0, 10).map(({ i }) => i);
  const lugares = Math.max(5, Math.min(11, ocupados.length + 1));
  return { ocupados, lugares, ancho: lugares * 1.85 + 0.35 };
}
export const palcoX = (slot: number, lugares: number) => ((lugares - 1) / 2 - slot) * 1.85;

// ── polideportivos: uno por equipo que jugó (o el de ejemplo), en la franja sur ──
const LOTE_X = [-1, -19, 17];
export function polideportivos(d: Datos) {
  const reales = d.equipos.map((e, i) => ({ e, i })).filter(({ e }) => e.jugados > 0);
  const lista = reales.length ? reales : d.equipos.map((e, i) => ({ e, i })).filter(({ e }) => e.ejemplo);
  return lista.map(({ i }, k) => ({ equipo: i, x: LOTE_X[k % 3], z: 26 + Math.floor(k / 3) * 22, ejemplo: !reales.length }));
}

// ── textos ──
const fmt = (n: number) => n.toLocaleString("es-AR");

export function lugarTexto(d: Datos, s: Seleccion): { titulo: string; lugar: string; detalle: string } {
  if (s.tipo === "hincha") {
    const h = d.hinchas[s.i]!;
    const H = hinchada(d.hinchas.length);
    return {
      titulo: "@" + h[0],
      lugar: `Hinchada ${SECTORES[H.sector[s.i]]} · fila ${H.filas[s.i]}`,
      detalle: h[1] ? `Comentó en el capítulo ${h[1]}. Lugar #${fmt(s.i + 1)} de ${fmt(d.hinchas.length)}.` : `Lugar #${fmt(s.i + 1)} de ${fmt(d.hinchas.length)}.`,
    };
  }
  if (s.tipo === "platea") {
    const p = d.platea[s.i]!;
    const a = asientoPlatea(s.i, d.platea.length);
    return { titulo: p[0], lugar: `Platea TorneAR · fila ${a.fila + 1} · asiento ${a.asiento + 1}`, detalle: "Jugador de TorneAR." };
  }
  const e = d.equipos[s.i];
  const enPoli = polideportivos(d).some((p) => p.equipo === s.i);
  if (e.jugados > 0) return { titulo: e.nombre, lugar: "Polideportivo propio", detalle: `${e.n} integrantes · ${e.jugados} ${e.jugados === 1 ? "partido jugado" : "partidos jugados"}.` };
  if (e.n >= PALCO_MIN)
    return { titulo: e.nombre, lugar: "Palco VIP", detalle: `${e.n} integrantes.${enPoli ? " Su polideportivo es el ejemplo de cómo queda." : ""}` };
  return { titulo: e.nombre, lugar: "Todavía afuera del palco", detalle: `${e.n} ${e.n === 1 ? "integrante" : "integrantes"}: le ${PALCO_MIN - e.n === 1 ? "falta 1" : `faltan ${PALCO_MIN - e.n}`} para entrar al palco VIP.` };
}

/** El empujón: qué tiene que hacer esta persona o este equipo para subir un escalón. */
export function siguientePaso(d: Datos, s: Seleccion): { texto: string; boton: string } {
  const equipoTexto = (e: Equipo) =>
    e.jugados > 0
      ? { texto: `${e.nombre} ya tiene su polideportivo. Cada partido suma: a seguir jugando.`, boton: "Abrir TorneAR" }
      : e.n >= PALCO_MIN
        ? { texto: `${e.nombre} ya está en el palco VIP. Jueguen su primer partido y les construimos su propio polideportivo.`, boton: "Desafiar a un rival" }
        : {
            texto: `A ${e.nombre} le ${PALCO_MIN - e.n === 1 ? "falta 1 integrante" : `faltan ${PALCO_MIN - e.n} integrantes`} para entrar al palco VIP. Invitá a tus amigos desde la app.`,
            boton: "Invitar a mi equipo",
          };
  if (s.tipo === "equipo") return equipoTexto(d.equipos[s.i]);
  if (s.tipo === "platea") {
    const eqs = d.platea[s.i]![1].map((k) => d.equipos[k]);
    if (!eqs.length) return { texto: "Ya estás en la platea. Armá tu equipo: con 4 integrantes entra al palco VIP.", boton: "Armar mi equipo" };
    eqs.sort((a, b) => b.jugados - a.jugados || b.n - a.n);
    return equipoTexto(eqs[0]);
  }
  return { texto: "Pasá de la hinchada a la cancha: armá tu equipo en TorneAR y metelo en el palco VIP.", boton: "Bajar TorneAR gratis" };
}

// ── búsqueda ──
export const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^@+/, "").trim();

export type Resultado = Seleccion & { texto: string; sub: string };

export function buscar(d: Datos, q: string, max = 8): Resultado[] {
  const n = normalizar(q);
  if (n.length < 2) return [];
  const out: (Resultado & { score: number })[] = [];
  const puntuar = (nombre: string) => {
    const x = normalizar(nombre);
    if (x === n) return 0;
    if (x.startsWith(n)) return 1;
    if (x.includes(n)) return 2;
    return -1;
  };
  d.platea.forEach((p, i) => {
    if (!p) return;
    const sc = puntuar(p[0]);
    if (sc >= 0) out.push({ tipo: "platea", i, texto: p[0], sub: "Usuario de la app · Platea", score: sc });
  });
  d.hinchas.forEach((h, i) => {
    if (!h) return;
    const sc = puntuar(h[0]);
    if (sc >= 0) out.push({ tipo: "hincha", i, texto: "@" + h[0], sub: "Instagram · Hinchada", score: sc + 0.1 });
  });
  d.equipos.forEach((e, i) => {
    const sc = puntuar(e.nombre);
    if (sc >= 0) out.push({ tipo: "equipo", i, texto: e.nombre, sub: `Equipo · ${e.n} ${e.n === 1 ? "integrante" : "integrantes"}`, score: sc - 0.05 });
  });
  out.sort((a, b) => a.score - b.score || a.texto.length - b.texto.length);
  return out.slice(0, max);
}
