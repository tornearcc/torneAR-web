/**
 * La imagen para compartir en historias (1080×1920): la foto de la maqueta con la persona marcada, su lugar,
 * su equipo con el escudo y la invitación a buscarse. Se arma en el navegador, sin servidor.
 */
import { type Datos, type Seleccion, PALCO_MIN, lugarTexto } from "./disposicion";

const VERDE = "#53E076", ORO = "#FABD32";

const cargar = (src: string) =>
  new Promise<HTMLImageElement | null>((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = src;
  });

function cubrir(g: CanvasRenderingContext2D, im: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
  g.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
}

function recortar(g: CanvasRenderingContext2D, s: string, max: number) {
  while (g.measureText(s).width > max && s.length > 3) s = s.slice(0, -2) + "…";
  return s;
}

function redondo(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export async function armarTarjeta(d: Datos, s: Seleccion, foto: Blob | null): Promise<Blob> {
  const cs = getComputedStyle(document.documentElement);
  const fd = cs.getPropertyValue("--font-barlow-condensed").trim() || "sans-serif";
  const fu = cs.getPropertyValue("--font-inter").trim() || "sans-serif";
  const W = 1080, H = 1920, FOTO_H = 1180;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  g.fillStyle = "#0E0E0E";
  g.fillRect(0, 0, W, H);
  if (foto) {
    const bmp = await createImageBitmap(foto);
    cubrir(g, bmp, 0, 0, W, FOTO_H);
  }
  const deg = g.createLinearGradient(0, FOTO_H - 380, 0, FOTO_H + 10);
  deg.addColorStop(0, "rgba(14,14,14,0)");
  deg.addColorStop(1, "rgba(14,14,14,1)");
  g.fillStyle = deg;
  g.fillRect(0, FOTO_H - 380, W, 400);

  // marca arriba
  const logo = await cargar("/logo-header.png");
  g.fillStyle = "rgba(14,14,14,.82)";
  redondo(g, 48, 56, 300, 96, 26);
  g.fill();
  if (logo) g.drawImage(logo, 74, 76, 248, (248 * logo.height) / logo.width);

  const t = lugarTexto(d, s);
  let y = FOTO_H - 120;
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  g.fillStyle = ORO;
  g.font = `800 48px ${fd}`;
  g.fillText(s.tipo === "equipo" ? "NUESTRO LUGAR EN EL ESTADIO DE TORNEAR" : "ESTOY EN EL ESTADIO DE TORNEAR", 64, y);
  y += 130;
  g.fillStyle = "#ffffff";
  g.font = `800 140px ${fd}`;
  g.fillText(recortar(g, t.titulo, W - 128), 64, y);
  y += 80;
  g.fillStyle = VERDE;
  g.font = `800 60px ${fd}`;
  g.fillText(recortar(g, t.lugar.toUpperCase(), W - 128), 64, y);
  // el detalle va en hasta dos líneas (cortado por palabras, no a la mitad)
  g.fillStyle = "rgba(255,255,255,.72)";
  g.font = `500 36px ${fu}`;
  const lineas: string[] = [];
  for (const palabra of t.detalle.split(" ")) {
    const ult = lineas.length - 1, prueba = ult >= 0 ? `${lineas[ult]} ${palabra}` : palabra;
    if (ult >= 0 && g.measureText(prueba).width <= W - 128) lineas[ult] = prueba;
    else lineas.push(palabra);
  }
  if (lineas.length > 2) lineas.splice(1, lineas.length - 1, recortar(g, lineas.slice(1).join(" "), W - 128));
  for (const l of lineas) {
    y += 50;
    g.fillText(l, 64, y);
  }
  y += 12;

  // equipo con escudo
  const eqs =
    s.tipo === "equipo" ? [d.equipos[s.i]] : s.tipo === "platea" ? d.platea[s.i]![1].map((k) => d.equipos[k]).slice(0, 2) : [];
  y += 60;
  for (const e of eqs) {
    g.fillStyle = "rgba(255,255,255,.07)";
    redondo(g, 64, y, W - 128, 170, 34);
    g.fill();
    const im = e.escudo ? await cargar(e.escudo) : null;
    g.save();
    redondo(g, 89, y + 25, 120, 120, 24);
    g.clip();
    if (im) cubrir(g, im, 89, y + 25, 120, 120);
    else {
      g.fillStyle = "#2a2a2a";
      g.fillRect(89, y + 25, 120, 120);
    }
    g.restore();
    g.fillStyle = "#ffffff";
    g.font = `800 64px ${fd}`;
    g.fillText(recortar(g, e.nombre, W - 128 - 200), 240, y + 82);
    g.fillStyle = e.jugados > 0 || e.n >= PALCO_MIN ? ORO : "rgba(255,255,255,.7)";
    g.font = `700 34px ${fu}`;
    g.fillText(
      e.jugados > 0 ? "Con polideportivo propio" : e.n >= PALCO_MIN ? "★ En el palco VIP" : `${e.n}/${PALCO_MIN} para entrar al palco VIP`,
      240,
      y + 132,
    );
    y += 190;
  }

  // invitación
  g.fillStyle = VERDE;
  redondo(g, 64, H - 260, W - 128, 170, 40);
  g.fill();
  g.fillStyle = "#0E0E0E";
  g.textAlign = "center";
  g.font = `800 68px ${fd}`;
  g.fillText("BUSCATE VOS TAMBIÉN", W / 2, H - 172);
  g.font = `700 38px ${fu}`;
  g.fillText("tornear.vercel.app/estadio", W / 2, H - 116);

  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("sin imagen"))), "image/png"));
}
