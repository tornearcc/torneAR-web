/**
 * La maqueta 3D del estadio de «Del potrero al estadio», para recorrer en el navegador.
 *
 * Es la misma escena que los videos (contenido/2-proyectos/potrero-ep3/compositions/mundo.html) pero sin línea de
 * tiempo: lo construido sale de las metas cumplidas en datos.json, cada hincha y cada usuario de la app tiene un lugar
 * fijo (ver disposicion.ts) y todo se puede tocar. Three.js imperativo, sin React: la interfaz habla con esta clase
 * por métodos (irA, enfocar, capturar) y callbacks (onElegir, onMover).
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  type Datos,
  type Seleccion,
  anchoTribuna,
  asientoPlatea,
  hinchada,
  palco,
  palcoX,
  polideportivos,
} from "./disposicion";

export type Zona = "inicio" | "cancha" | "platea" | "palco" | "banco" | "hinchada" | "polideportivo";

type Fuentes = { display: string; ui: string };
type Callbacks = {
  /** Se tocó a alguien o algo en la maqueta (null: se tocó la nada). */
  onElegir: (s: Seleccion | null) => void;
  /** El usuario empezó a mover la cámara con el dedo o el mouse. */
  onMover?: () => void;
};

const VERDE = "#53E076";
const COLS = ["#E63946", "#F1FAEE", "#1D3557", "#F4A261", "#2A9D8F", "#E9C46A", "#6C5B7B", "#355C7D", "#F67280", "#53E076"];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const C = (h: string) => new THREE.Color(h);

const VISTAS: Record<Exclude<Zona, "polideportivo">, { p: THREE.Vector3; t: THREE.Vector3 }> = {
  inicio: { p: v3(22, 31, -33), t: v3(0, 1.5, 4) },
  cancha: { p: v3(0, 9.5, -16), t: v3(0, 0, 1) },
  platea: { p: v3(0, 5.6, -2.5), t: v3(0, 2.2, 10.5) },
  palco: { p: v3(0, 6.1, 5.4), t: v3(0, 5, 12) },
  banco: { p: v3(-2.4, 4.1, -0.4), t: v3(-4.2, 1.0, -7.7) },
  hinchada: { p: v3(0, 15, 4), t: v3(0, 0, -13) },
};

export class Estadio {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private reloj = new THREE.Clock();
  private raf = 0;
  private vuelo: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; ini: number; dur: number } | null = null;
  private uTime = { value: 0 };
  private hinchasMesh!: THREE.InstancedMesh;
  private plateaMesh!: THREE.InstancedMesh;
  private hinchaIdx: number[] = []; // instancia → índice en datos.hinchas
  private plateaIdx: number[] = [];
  private hinchaInst = new Map<number, number>(); // índice en datos → instancia
  private plateaInst = new Map<number, number>();
  private tocables: THREE.Object3D[] = [];
  private marcador = new THREE.Group();
  private seleccion: { s: Seleccion; pos: THREE.Vector3 } | null = null;
  private resaltado: { mesh: THREE.InstancedMesh; inst: number; color: THREE.Color; matriz: THREE.Matrix4 } | null = null;
  private papelitos!: THREE.InstancedMesh;
  private papIni = -100;
  private papCentro = v3(0, 0, 0);
  private etiquetaPrincipal: HTMLDivElement;
  private etiquetas: HTMLDivElement[] = [];
  private cercanos: { pos: THREE.Vector3; texto: string }[] = [];
  private ultimoCercanos = 0;
  private pibes: { g: THREE.Group; pi: THREE.Object3D; pd: THREE.Object3D; bi: THREE.Object3D; bd: THREE.Object3D }[] = [];
  private suplentes: { bd: THREE.Object3D }[] = [];
  private pelota!: THREE.Mesh;
  private ro: ResizeObserver;
  private quieto = false;
  private calidad = 1;
  private cuadros = 0;
  private medicion = { ini: 0, n: 0 };
  private tmp = new THREE.Vector3();
  private limite = new THREE.Vector3();
  private margen = { arriba: 0, abajo: 0 };
  private abajo: { x: number; y: number; t: number } | null = null;
  private dummy = new THREE.Object3D();
  private polis: { equipo: number; x: number; z: number; ejemplo: boolean }[];
  private palcoInfo: ReturnType<typeof palco>;
  private liberar: (() => void)[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private capa: HTMLDivElement,
    private d: Datos,
    private f: Fuentes,
    private cb: Callbacks,
  ) {
    const movil = matchMedia("(pointer: coarse)").matches;
    this.quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.calidad = Math.min(devicePixelRatio, movil ? 1.4 : 1.75);
    this.renderer.setPixelRatio(this.calidad);
    this.renderer.shadowMap.enabled = true;
    // las sombras se recalculan cada 3 cuadros: casi todo está quieto y en un celular es lo que más pesa
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.2, 800);
    this.camera.position.copy(VISTAS.inicio.p);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(VISTAS.inicio.t);
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.055,
      rotateSpeed: movil ? 0.55 : 0.7,
      zoomSpeed: movil ? 1.0 : 0.8,
      panSpeed: movil ? 0.9 : 0.8,
      minDistance: 2.5,
      maxDistance: 110,
      // la cámara nunca baja del piso: el ángulo máximo la deja siempre por encima del objetivo
      maxPolarAngle: 1.42,
      screenSpacePanning: false,
      autoRotate: !this.quieto,
      autoRotateSpeed: 0.3,
      zoomToCursor: !movil,
    });
    this.controls.addEventListener("start", () => {
      this.vuelo = null;
      this.controls.autoRotate = false;
      this.cb.onMover?.();
    });

    this.polis = polideportivos(d);
    this.palcoInfo = palco(d);
    this.mundo(movil);

    this.etiquetaPrincipal = document.createElement("div");
    this.etiquetaPrincipal.className = "estadio-etq estadio-etq--yo";
    this.etiquetaPrincipal.hidden = true;
    capa.appendChild(this.etiquetaPrincipal);
    for (let i = 0; i < 22; i++) {
      const e = document.createElement("div");
      e.className = "estadio-etq";
      e.hidden = true;
      capa.appendChild(e);
      this.etiquetas.push(e);
    }

    const down = (e: PointerEvent) => (this.abajo = { x: e.clientX, y: e.clientY, t: performance.now() });
    const up = (e: PointerEvent) => {
      const a = this.abajo;
      this.abajo = null;
      if (!a || Math.hypot(e.clientX - a.x, e.clientY - a.y) > 8 || performance.now() - a.t > 600) return;
      this.tocar(e.clientX, e.clientY);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    this.liberar.push(() => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
    });

    this.ro = new ResizeObserver(() => this.medir());
    this.ro.observe(canvas);
    this.medir();
    this.bucle();
  }

  // ───────────────────────────── API para la interfaz ─────────────────────────────

  irA(z: Zona) {
    this.limpiar();
    if (z === "polideportivo") {
      const p = this.polis[0] ?? { x: -1, z: 26 };
      return this.volar(v3(p.x + 8, 11, p.z + 27), v3(p.x, 3, p.z + 2));
    }
    const { p, t } = VISTAS[z];
    // en vertical entra menos ancho: la cámara se aleja sobre la misma línea
    const k = !this.vertical() || z === "inicio" || z === "hinchada" ? 1 : z === "palco" ? 2.5 : 1.45;
    this.volar(t.clone().add(p.clone().sub(t).multiplyScalar(k)), t.clone());
  }

  /** Lleva la cámara hasta una persona o un equipo y lo resalta. */
  enfocar(s: Seleccion) {
    this.limpiar();
    if (s.tipo === "hincha") {
      const inst = this.hinchaInst.get(s.i);
      if (inst === undefined) return;
      const H = hinchada(this.d.hinchas.length);
      const x = H.pos[s.i * 2], z = H.pos[s.i * 2 + 1];
      const pos = v3(x, 0, z);
      const haciaAfuera = v3(x, 0, z - 2).normalize();
      this.resaltar(this.hinchasMesh, inst, s, pos);
      this.volar(pos.clone().addScaledVector(haciaAfuera, 4.6).add(v3(0, 6.2, 0)), pos.clone().add(v3(0, 1.0, 0)));
    } else if (s.tipo === "platea") {
      const inst = this.plateaInst.get(s.i);
      if (inst === undefined) return;
      const a = asientoPlatea(s.i, this.d.platea.length);
      const pos = v3(a.x, a.y, a.z);
      this.resaltar(this.plateaMesh, inst, s, pos);
      this.volar(v3(a.x, a.y + 4.8, a.z - 6.6), pos.clone().add(v3(0, 1.0, 0)));
    } else {
      const poli = this.polis.find((p) => p.equipo === s.i);
      const slot = this.palcoInfo.ocupados.indexOf(s.i);
      if (poli && this.d.equipos[s.i].jugados > 0) {
        this.seleccion = { s, pos: v3(poli.x, 8.4, poli.z + 3.2) };
        this.volar(v3(poli.x + 4, 7.5, poli.z + 18), v3(poli.x, 3.5, poli.z + 2));
      } else if (slot >= 0) {
        const x = palcoX(slot, this.palcoInfo.lugares);
        this.seleccion = { s, pos: v3(x, 6.2, 12) };
        this.volar(v3(x * 0.8, 6.0, this.vertical() ? 7.4 : 5.4), v3(x, 5, 12));
      } else {
        // todavía no entra al palco: se muestra el lugar libre que lo espera
        const x = palcoX(this.palcoInfo.ocupados.length, this.palcoInfo.lugares);
        this.seleccion = { s, pos: v3(x, 6.2, 12) };
        this.volar(v3(x * 0.8, 6.0, this.vertical() ? 7.4 : 5.4), v3(x, 5, 12));
      }
    }
    this.marcador.visible = s.tipo !== "equipo";
    if (this.seleccion) this.papelitosEn(this.seleccion.pos);
  }

  limpiar() {
    if (this.resaltado) {
      const { mesh, inst, color, matriz } = this.resaltado;
      mesh.setColorAt(inst, color);
      mesh.setMatrixAt(inst, matriz);
      mesh.instanceColor!.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true;
      this.resaltado = null;
    }
    this.seleccion = null;
    this.marcador.visible = false;
    this.etiquetaPrincipal.hidden = true;
  }

  /** Foto de la vista actual (para la tarjeta de compartir). */
  capturar(): Promise<Blob | null> {
    this.renderer.render(this.scene, this.camera);
    return new Promise((ok) => this.canvas.toBlob((b) => ok(b), "image/jpeg", 0.92));
  }

  destruir() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.liberar.forEach((f) => f());
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => {
        (x as THREE.MeshBasicMaterial).map?.dispose();
        x.dispose();
      });
    });
    this.renderer.dispose();
    this.capa.replaceChildren();
  }

  // ───────────────────────────── interacción ─────────────────────────────

  private volar(p1: THREE.Vector3, t1: THREE.Vector3) {
    this.controls.autoRotate = false;
    const dist = this.camera.position.distanceTo(p1);
    this.vuelo = {
      p0: this.camera.position.clone(),
      t0: this.controls.target.clone(),
      p1,
      t1,
      ini: performance.now(),
      dur: this.quieto ? 1 : clamp(1100 + dist * 22, 1200, 2800),
    };
  }

  /** Si el teléfono no llega a ~45 cuadros por segundo, baja la resolución de a poco (nunca menos de 1). */
  private ajustarCalidad() {
    const ahora = performance.now();
    if (!this.medicion.ini) this.medicion = { ini: ahora, n: 0 };
    this.medicion.n++;
    const pasado = ahora - this.medicion.ini;
    if (pasado < 2000) return;
    const ms = pasado / this.medicion.n;
    this.medicion = { ini: ahora, n: 0 };
    if (ms > 22 && this.calidad > 1) {
      this.calidad = Math.max(1, this.calidad - 0.2);
      this.renderer.setPixelRatio(this.calidad);
      this.medir();
    }
  }

  private tocar(cx: number, cy: number) {
    const r = this.canvas.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.camera);
    const hit = ray.intersectObjects(this.tocables, true)[0];
    if (!hit) return this.cb.onElegir(null);
    let o: THREE.Object3D | null = hit.object;
    if (o === this.hinchasMesh && hit.instanceId !== undefined) {
      const s: Seleccion = { tipo: "hincha", i: this.hinchaIdx[hit.instanceId] };
      this.enfocar(s);
      return this.cb.onElegir(s);
    }
    if (o === this.plateaMesh && hit.instanceId !== undefined) {
      const s: Seleccion = { tipo: "platea", i: this.plateaIdx[hit.instanceId] };
      this.enfocar(s);
      return this.cb.onElegir(s);
    }
    while (o && o.userData.equipo === undefined) o = o.parent;
    if (o && o.userData.equipo >= 0) {
      const s: Seleccion = { tipo: "equipo", i: o.userData.equipo };
      this.enfocar(s);
      return this.cb.onElegir(s);
    }
    this.cb.onElegir(null);
  }

  private resaltar(mesh: THREE.InstancedMesh, inst: number, s: Seleccion, pos: THREE.Vector3) {
    const color = new THREE.Color();
    mesh.getColorAt(inst, color);
    const matriz = new THREE.Matrix4();
    mesh.getMatrixAt(inst, matriz);
    this.resaltado = { mesh, inst, color, matriz };
    mesh.setColorAt(inst, C("#FABD32"));
    mesh.setMatrixAt(inst, matriz.clone().multiply(new THREE.Matrix4().makeScale(1.3, 1.3, 1.3)));
    mesh.instanceColor!.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
    this.seleccion = { s, pos: pos.clone().add(v3(0, 1.85, 0)) };
    this.marcador.position.copy(pos);
    this.marcador.visible = true;
  }

  private papelitosEn(p: THREE.Vector3) {
    this.papIni = this.quieto ? -100 : this.reloj.getElapsedTime();
    this.papCentro.copy(p);
  }

  private vertical() {
    return this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight) < 0.8;
  }

  private medir() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // en vertical se abre el lente para que entre el estadio
    this.camera.fov = w / h < 0.8 ? 62 : 50;
    const dy = (this.margen.abajo - this.margen.arriba) / 2;
    if (Math.abs(dy) > 1) this.camera.setViewOffset(w, h, 0, dy, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  // ───────────────────────────── bucle ─────────────────────────────

  private bucle = () => {
    this.raf = requestAnimationFrame(this.bucle);
    const t = this.reloj.getElapsedTime();
    this.uTime.value = t;
    if (this.vuelo) {
      const v = this.vuelo, lin = clamp((performance.now() - v.ini) / v.dur), p = inOut(lin);
      this.camera.position.lerpVectors(v.p0, v.p1, p);
      // en los vuelos largos la cámara sube en el medio, como un dron
      const largo = v.p0.distanceTo(v.p1);
      if (largo > 20) this.camera.position.y += Math.sin(Math.PI * p) * Math.min(7, (largo - 20) * 0.12);
      // el objetivo llega un poco antes que la cámara: el giro se ve más natural
      this.controls.target.lerpVectors(v.t0, v.t1, inOut(clamp(lin * 1.15)));
      if (p >= 1) this.vuelo = null;
    }
    // la cámara no se va del barrio: si el objetivo se pasa del borde vuelve despacio, sin frenazo
    const tg = this.controls.target;
    this.limite.set(clamp(tg.x, -62, 62), clamp(tg.y, 0, 14), clamp(tg.z, -24, 70));
    if (!this.limite.equals(tg)) {
      this.tmp.subVectors(this.limite, tg).multiplyScalar(0.12);
      tg.add(this.tmp);
      this.camera.position.add(this.tmp);
    }
    this.controls.update();
    if (++this.cuadros % 3 === 0) this.renderer.shadowMap.needsUpdate = true;
    this.ajustarCalidad();

    this.animar(t);
    this.renderer.render(this.scene, this.camera);
    this.etiquetar(t);
  };

  private animar(t: number) {
    const w = t + 3;
    const pelotaEn = (k: number) =>
      v3(6.8 * Math.sin(0.37 * k + 0.3) + 1.8 * Math.sin(1.1 * k), 0.19 + 0.33 * Math.abs(Math.sin(2.3 * k)), 3.6 * Math.sin(0.53 * k + 1.0));
    const pb = pelotaEn(w);
    this.pelota.position.copy(pb);
    this.pelota.rotation.set(w * 4, w * 2.3, 0);
    this.pibes.forEach((p, i) => {
      const b = pelotaEn(w - 0.22 - i * 0.07), a = i * 1.05 + 0.35 * w, r = 1.3 + (i % 3) * 0.7;
      const x = b.x + Math.cos(a) * r, z = b.z + Math.sin(a) * r * 0.8;
      p.g.position.set(x, Math.abs(Math.sin(w * 9 + i)) * 0.08, z);
      p.g.rotation.y = Math.atan2(pb.x - x, pb.z - z);
      const sw = Math.sin(w * 11 + i * 1.7) * 0.7;
      p.pi.rotation.x = sw;
      p.pd.rotation.x = -sw;
      p.bi.rotation.x = -sw * 0.8;
      p.bd.rotation.x = sw * 0.8;
    });
    this.suplentes.forEach((s, i) => (s.bd.rotation.x = -0.5 + 0.4 * Math.sin(t * 3 + i)));
    // marcador: un aro que late y una flecha que flota arriba de la persona
    if (this.marcador.visible) {
      const [aro, flecha] = this.marcador.children;
      aro.scale.setScalar(1 + 0.15 * Math.sin(t * 5));
      flecha.position.y = 1.38 + 0.1 * Math.sin(t * 4);
      flecha.rotation.y = t * 2;
    }
    // papelitos de festejo
    const tc = t - this.papIni;
    this.papelitos.visible = tc >= 0 && tc < 4;
    if (this.papelitos.visible) {
      const rnd = mulberry32(5);
      for (let i = 0; i < this.papelitos.count; i++) {
        const ang = rnd() * 6.28, rad = rnd() * 3.2, y0 = 3 + rnd() * 3, v = 1.2 + rnd() * 1.2, ph = rnd() * 6.28;
        this.dummy.position.set(
          this.papCentro.x + Math.cos(ang) * rad + Math.sin(tc * 2 + ph) * 0.3,
          Math.max(0.05, this.papCentro.y + y0 - tc * v),
          this.papCentro.z + Math.sin(ang) * rad,
        );
        this.dummy.rotation.set(tc * 3 + ph, tc * 2 + ph, 0);
        this.dummy.updateMatrix();
        this.papelitos.setMatrixAt(i, this.dummy.matrix);
      }
      this.papelitos.instanceMatrix.needsUpdate = true;
    }
  }

  /** Etiquetas HTML: la de la persona elegida y, de cerca, los nombres de los que están alrededor. */
  private etiquetar(t: number) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const proyectar = (p: THREE.Vector3) => {
      const q = this.tmp.copy(p).project(this.camera);
      return { x: (q.x * 0.5 + 0.5) * w, y: (-q.y * 0.5 + 0.5) * h, ok: q.z < 1 && Math.abs(q.x) < 1.1 && Math.abs(q.y) < 1.1 };
    };
    if (this.seleccion && !this.vuelo) {
      const q = proyectar(this.seleccion.pos);
      const e = this.etiquetaPrincipal;
      e.hidden = !q.ok;
      e.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%, -100%)`;
    } else this.etiquetaPrincipal.hidden = true;

    if (t - this.ultimoCercanos > 0.3) {
      this.ultimoCercanos = t;
      this.cercanos = this.buscarCercanos();
    }
    // sin pisarse: de los más cercanos a la cámara a los más lejanos, cada uno ocupa su rectángulo
    const ocupado: { x: number; y: number; w: number }[] = [];
    if (this.seleccion && !this.etiquetaPrincipal.hidden) {
      const q = proyectar(this.seleccion.pos);
      ocupado.push({ x: q.x, y: q.y, w: 220 });
    }
    let k = 0;
    for (const c of this.vuelo ? [] : this.cercanos) {
      if (k >= (this.seleccion ? 10 : this.etiquetas.length)) break;
      const q = proyectar(c.pos);
      const w = c.texto.length * 6.4 + 18;
      if (!q.ok || ocupado.some((o) => Math.abs(o.x - q.x) < (o.w + w) / 2 + 4 && Math.abs(o.y - q.y) < 22)) continue;
      ocupado.push({ x: q.x, y: q.y, w });
      const e = this.etiquetas[k++];
      e.hidden = false;
      if (e.textContent !== c.texto) e.textContent = c.texto;
      e.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%, -100%)`;
    }
    for (; k < this.etiquetas.length; k++) this.etiquetas[k].hidden = true;
  }

  private buscarCercanos() {
    const tg = this.controls.target, dCam = this.camera.position.distanceTo(tg);
    if (dCam > 13) return [];
    const radio = 2.2 + dCam * 0.45, lista: { pos: THREE.Vector3; texto: string; d: number }[] = [];
    const sel = this.seleccion?.s;
    const H = hinchada(this.d.hinchas.length);
    this.d.hinchas.forEach((hh, i) => {
      if (!hh || (sel?.tipo === "hincha" && sel.i === i)) return;
      const x = H.pos[i * 2], z = H.pos[i * 2 + 1], d = Math.hypot(x - tg.x, z - tg.z);
      if (d < radio) lista.push({ pos: v3(x, 1.15, z), texto: "@" + hh[0], d });
    });
    this.d.platea.forEach((p, i) => {
      if (!p || (sel?.tipo === "platea" && sel.i === i)) return;
      const a = asientoPlatea(i, this.d.platea.length), d = Math.hypot(a.x - tg.x, a.z - tg.z, (a.y - tg.y) * 0.5);
      if (d < radio) lista.push({ pos: v3(a.x, a.y + 1.15, a.z), texto: p[0], d });
    });
    const cam = this.camera.position;
    lista.sort((a, b) => a.pos.distanceTo(cam) - b.pos.distanceTo(cam));
    return lista.slice(0, 60);
  }

  /** Lo que tapan los paneles de la interfaz (px), para que lo elegido quede en el hueco visible. */
  setMargenes(arriba: number, abajo: number) {
    this.margen = { arriba, abajo };
    this.medir();
  }

  /** Escribe el nombre de la selección en la etiqueta principal (la interfaz decide el texto). */
  setEtiqueta(texto: string) {
    this.etiquetaPrincipal.textContent = texto;
  }

  // ───────────────────────────── el mundo ─────────────────────────────

  private mundo(movil: boolean) {
    const { scene, d } = this;
    const metaOk = (n: number) => d.metas.some((m) => m.n === n && m.ok);
    scene.fog = new THREE.Fog("#F3C792", 90, 240);
    {
      const g = new THREE.SphereGeometry(400, 32, 16), pos = g.attributes.position, cols: number[] = [];
      const top = C("#4F86C6"), hor = C("#F7C98B");
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / 400, p = clamp((y + 0.02) / 0.55);
        const c = hor.clone().lerp(top, Math.pow(p, 0.75));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
      scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
    }
    scene.add(new THREE.HemisphereLight("#FFE7C2", "#6B4E2E", 0.95));
    const sol = new THREE.DirectionalLight("#FFD8A0", 2.3);
    sol.position.set(-30, 26, -18);
    sol.castShadow = true;
    sol.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048);
    Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 140 });
    sol.shadow.bias = -0.0008;
    scene.add(sol, sol.target);

    const mat = (c: string, o: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9, flatShading: true }, o));
    const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
      const b = new THREE.Mesh(geo, m);
      b.position.set(x, y, z);
      b.castShadow = true;
      b.receiveShadow = true;
      parent.add(b);
      return b;
    };
    const grupo = (parent: THREE.Object3D = scene) => {
      const g = new THREE.Group();
      parent.add(g);
      return g;
    };
    const lotes = this.polis.map((p) => ({ x: p.x, z: p.z }));
    const lotesLibres = [lotes.length, lotes.length + 1].map((k) => ({ x: [-1, -19, 17][k % 3], z: 26 + Math.floor(k / 3) * 22 }));

    // suelo: tierra y pasto seco; plano donde hay gente, cemento o lotes
    {
      const rnd = mulberry32(7);
      const g = new THREE.PlaneGeometry(240, 240, 120, 120);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position, cols: number[] = [];
      const tierras = ["#B98955", "#A87A4B", "#C79B66"].map(C), pastos = ["#8FA04C", "#A3A65A", "#7E9343"].map(C);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const borde = Math.max(Math.abs(x) - 12.5, (Math.abs(z) - 7.2) * 1.4);
        const pasto = clamp(borde / 2.5 + (rnd() - 0.5) * 0.6);
        const plano = (Math.abs(x) < 58 && z > -19 && z < 18) || [...lotes, ...lotesLibres].some((l) => Math.abs(x - l.x) < 9 && z > l.z - 6 && z < l.z + 12);
        const anillo = Math.abs(x) < 14.6 && Math.abs(z) < 9.0;
        pos.setY(i, anillo ? -0.06 : plano ? (rnd() - 0.5) * 0.06 - 0.03 : (rnd() - 0.5) * 0.45 * (1 + pasto) - 0.05);
        const c = tierras[Math.floor(rnd() * 3)].clone().lerp(pastos[Math.floor(rnd() * 3)], pasto);
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      const s = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
      s.receiveShadow = true;
      scene.add(s);
    }
    // barrio: paredón con murales, casas y árboles por fuera de la hinchada
    {
      mesh(new THREE.BoxGeometry(124, 3.2, 0.6), mat("#B0603F"), 0, 1.55, -19.2);
      ["#3E7CB1", "#F2C14E", "#D1495B", "#5E8C3A", "#F2C14E", "#3E7CB1", "#D1495B"].forEach((c, i) =>
        mesh(new THREE.BoxGeometry(5.5, 1.6, 0.1), mat(c), -21 + i * 7, 1.6, -18.85),
      );
      const rnd = mulberry32(21), pastel = ["#E9D8A6", "#94D2BD", "#E3B66B", "#D98E73", "#BFD7EA", "#F0C987"];
      for (let i = 0; i < 26; i++) {
        const wdt = 5 + rnd() * 4, h = 3.5 + rnd() * 4.5, dd = 5 + rnd() * 3;
        const [x, z] = i < 14 ? [-58 + i * 8.6, -25 - rnd() * 6] : [(i % 2 ? 1 : -1) * (63 + rnd() * 8), -14 + (i - 14) * 6.5];
        mesh(new THREE.BoxGeometry(wdt, h, dd), mat(pastel[i % pastel.length]), x, h / 2 - 0.1, z);
        mesh(new THREE.BoxGeometry(wdt + 0.3, 0.3, dd + 0.3), mat("#8a7a6a"), x, h, z);
      }
      const copa = mat("#5E8C3A"), copa2 = mat("#6E9A3C"), tronco = mat("#6B4E2E");
      const arboles: [number, number][] = [];
      for (let i = 0; i < 26; i++) arboles.push([(i % 2 ? 1 : -1) * (30 + ((i * 53) % 28)), 22 + ((i * 37) % 40)]);
      for (let i = 0; i < 12; i++) arboles.push([-55 + i * 10, -22 - (i % 3) * 2]);
      arboles
        .filter(([x, z]) => ![...lotes, ...lotesLibres].some((l) => Math.abs(x - l.x) < 10 && z > l.z - 7 && z < l.z + 13))
        .forEach(([x, z], i) => {
          const s = 1 + ((i * 37) % 10) / 12;
          mesh(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 1.8 * s, 6), tronco, x, 0.9 * s, z);
          mesh(new THREE.IcosahedronGeometry(1.5 * s, 0), i % 2 ? copa : copa2, x, 2.6 * s, z);
        });
    }

    // ── cancha ──
    const BLANCO = mat("#F5F5F2", { roughness: 0.6 });
    const linea = (wd: number, dp: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(wd, 0.04, dp), BLANCO);
      m.position.set(x, 0.05, z);
      m.receiveShadow = true;
      scene.add(m);
    };
    linea(22, 0.14, 0, 6);
    linea(22, 0.14, 0, -6);
    linea(0.14, 12, 11, 0);
    linea(0.14, 12, -11, 0);
    linea(0.14, 12, 0, 0);
    for (const s of [-1, 1]) {
      linea(3, 0.14, s * 9.5, 3);
      linea(3, 0.14, s * 9.5, -3);
      linea(0.14, 6, s * 8, 0);
    }
    {
      const r = new THREE.Mesh(new THREE.RingGeometry(1.8, 1.94, 48), BLANCO);
      r.rotation.x = -Math.PI / 2;
      r.position.y = 0.06;
      scene.add(r);
    }
    const red = new THREE.LineBasicMaterial({ color: "#9FE8B2", transparent: true, opacity: 0.75 });
    for (const s of [-1, 1]) {
      const a = grupo();
      a.position.set(s * 11, 0, 0);
      mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), BLANCO, 0, 1.1, 1.8, a);
      mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), BLANCO, 0, 1.1, -1.8, a);
      mesh(new THREE.BoxGeometry(0.16, 0.16, 3.76), BLANCO, 0, 2.2, 0, a);
      const caja = new THREE.BoxGeometry(1.2, 2.2, 3.6, 3, 4, 8);
      caja.translate(s * 0.6, 1.1, 0);
      a.add(new THREE.LineSegments(new THREE.WireframeGeometry(caja), red));
      for (const z of [-6, 6]) {
        mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), BLANCO, 0, 0.7, z, a);
        mesh(new THREE.PlaneGeometry(0.5, 0.36), mat(VERDE, { side: THREE.DoubleSide, flatShading: false }), s * -0.25, 1.22, z, a);
      }
    }
    for (let i = 0; i < 10; i++) {
      const g = new THREE.PlaneGeometry(22 / 10 + 0.01, 12.4);
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, mat(i % 2 ? "#5DAF4A" : "#4E9E3F", { flatShading: false, roughness: 1 }));
      m.position.set(-11 + (i + 0.5) * 2.2, 0.03, 0);
      m.receiveShadow = true;
      scene.add(m);
    }
    const tex = new THREE.TextureLoader();
    const escudoTex = tex.load("/logo-tornear.png");
    escudoTex.colorSpace = THREE.SRGBColorSpace;
    {
      const e = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: escudoTex, transparent: true, opacity: 0.85, depthWrite: false }));
      e.rotation.x = -Math.PI / 2;
      e.rotation.z = -Math.PI / 2;
      e.position.y = 0.07;
      scene.add(e);
    }

    // ── tribuna (platea TorneAR) ──
    const TW = anchoTribuna(d.platea.length);
    const cemento = mat("#C9C2B6"), borde = mat("#0E0E0E");
    for (let k = 0; k < 5; k++) {
      const h = 0.55 * (k + 1);
      mesh(new THREE.BoxGeometry(TW, h, 0.9), cemento, 0, h / 2, 8.7 + 0.9 * k);
      mesh(new THREE.BoxGeometry(TW, 0.06, 0.12), mat(VERDE), 0, h + 0.03, 8.3 + 0.9 * k);
    }
    mesh(new THREE.BoxGeometry(TW + 0.4, 3.9, 0.3), borde, 0, 1.95, 13.3);
    const cartelPlatea = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.0), new THREE.MeshBasicMaterial({ transparent: true }));
    cartelPlatea.position.set(TW / 2 - 2.2, 3.3, 13.13);
    cartelPlatea.rotation.y = Math.PI;
    scene.add(cartelPlatea);
    // cerramiento, cabeceras, cartel de equipos y marcador del partido inaugural
    mesh(new THREE.BoxGeometry(34, 1.3, 0.3), cemento, 0, 0.65, -8.6);
    mesh(new THREE.BoxGeometry(34, 0.08, 0.34), mat(VERDE), 0, 1.33, -8.6);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.3, 1.3, 17), cemento, s * 14.2, 0.65, 0);
    const CAB_N = grupo();
    CAB_N.position.set(-16.6, 0, 0);
    mesh(new THREE.BoxGeometry(0.6, 5.2, 17), borde, 0, 2.6, 0, CAB_N);
    const escudoCab = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: escudoTex, transparent: true }));
    escudoCab.position.set(0.32, 3.1, -3.6);
    escudoCab.rotation.y = Math.PI / 2;
    CAB_N.add(escudoCab);
    const textoCab = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), new THREE.MeshBasicMaterial({ transparent: true }));
    textoCab.position.set(0.32, 3.1, 2.2);
    textoCab.rotation.y = Math.PI / 2;
    CAB_N.add(textoCab);
    const CAB_F = grupo();
    CAB_F.position.set(16.6, 0, 0);
    mesh(new THREE.BoxGeometry(0.6, 4.6, 17), borde, 0, 2.3, 0, CAB_F);
    const cartelEq = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.2), new THREE.MeshBasicMaterial({ transparent: true }));
    cartelEq.position.set(-0.32, 2.35, 0);
    cartelEq.rotation.y = -Math.PI / 2;
    CAB_F.add(cartelEq);
    for (const z of [-3.8, 3.8]) mesh(new THREE.BoxGeometry(0.28, 9.6, 0.28), borde, 0.2, 4.8, z, CAB_F);
    mesh(new THREE.BoxGeometry(0.4, 3.6, 8.4), borde, 0.2, 8.4, 0, CAB_F);
    const marcadorTablero = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.3), new THREE.MeshBasicMaterial({ transparent: true }));
    marcadorTablero.position.set(-0.05, 8.4, 0);
    marcadorTablero.rotation.y = -Math.PI / 2;
    CAB_F.add(marcadorTablero);

    // ── meta 7.500: cemento y bancos de suplentes ──
    const conBanco = metaOk(7500);
    const CEM: THREE.Mesh[] = [];
    if (conBanco) {
      (
        [
          [28, 2.4, 0, -7.4, true],
          [3, 12.4, 12.7, 0, false],
          [28, 2.4, 0, 7.4, false],
          [3, 12.4, -12.7, 0, false],
        ] as const
      ).forEach(([wd, dp, x, z, letras]) => {
        const g = new THREE.PlaneGeometry(wd, dp);
        g.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 }));
        m.position.set(x, 0.08, z);
        m.receiveShadow = true;
        m.userData = { letras, w: wd, d: dp };
        scene.add(m);
        CEM.push(m);
      });
    }
    const respaldoMat = new THREE.MeshBasicMaterial({ color: "#ffffff" }), lisoMat = mat("#16351f");
    if (conBanco) {
      for (const bx of [-4.2, 4.2]) {
        const b = grupo();
        b.position.set(bx, 0, -7.75);
        mesh(new THREE.BoxGeometry(4.4, 0.1, 1.0), borde, 0, 0.05, 0, b);
        for (let i = 0; i < 6; i++) {
          mesh(new THREE.BoxGeometry(0.6, 0.12, 0.5), mat(VERDE), -1.8 + i * 0.72, 0.5, 0.05, b);
          mesh(new THREE.BoxGeometry(0.6, 0.45, 0.08), mat(VERDE), -1.8 + i * 0.72, 0.78, -0.2, b);
          mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), borde, -1.8 + i * 0.72, 0.25, 0.05, b);
        }
        const resp = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.45), lisoMat);
        resp.position.set(0, 0.85, -0.42);
        b.add(resp);
        mesh(new THREE.BoxGeometry(4.7, 1.55, 0.06), borde, 0, 0.85, -0.47, b);
        for (const sx of [-2.3, 2.3]) mesh(new THREE.BoxGeometry(0.08, 1.7, 1.25), borde, sx, 0.85, 0.1, b);
        const techo = mesh(
          new THREE.BoxGeometry(4.9, 0.06, 1.45),
          new THREE.MeshStandardMaterial({ color: VERDE, transparent: true, opacity: 0.55, roughness: 0.2 }),
          0,
          1.72,
          0.12,
          b,
        );
        techo.rotation.x = -0.12;
        techo.castShadow = false;
        const frente = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 0.42), respaldoMat);
        frente.position.set(0, 1.88, 0.86);
        b.add(frente);
        mesh(new THREE.BoxGeometry(4.95, 0.46, 0.05), borde, 0, 1.88, 0.83, b);
      }
    }

    // ── palco VIP: arriba de la tribuna ──
    const P = this.palcoInfo;
    const PALCO = grupo();
    PALCO.position.set(0, 3.9, 13.0);
    mesh(new THREE.BoxGeometry(P.ancho, 0.25, 1.9), borde, 0, 0.12, 0, PALCO);
    mesh(new THREE.BoxGeometry(P.ancho, 2.1, 0.12), borde, 0, 1.15, 0.9, PALCO);
    for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.12, 2.1, 1.9), borde, (sx * (P.ancho - 0.1)) / 2, 1.15, 0, PALCO);
    const vidrio = new THREE.Mesh(
      new THREE.PlaneGeometry(P.ancho - 0.2, 1.9),
      new THREE.MeshStandardMaterial({ color: "#1d3a2a", transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.3 }),
    );
    vidrio.position.set(0, 1.15, -0.86);
    vidrio.rotation.y = Math.PI;
    PALCO.add(vidrio);
    mesh(new THREE.BoxGeometry(P.ancho + 0.6, 0.22, 2.2), mat(VERDE), 0, 2.3, 0, PALCO);
    mesh(new THREE.BoxGeometry(P.ancho, 0.12, 0.12), mat(VERDE), 0, 0.28, -0.92, PALCO);
    const cartelVip = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9), new THREE.MeshBasicMaterial({ transparent: true }));
    cartelVip.position.set(0, 2.95, -0.2);
    cartelVip.rotation.y = Math.PI;
    PALCO.add(cartelVip);
    for (const sx of [-1.7, 1.7]) mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), borde, sx, 2.6, -0.2, PALCO);
    const CUADROS: THREE.Mesh[] = [];
    for (let i = 0; i < P.lugares; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.82), new THREE.MeshBasicMaterial({ transparent: true }));
      m.position.set(palcoX(i, P.lugares), 1.1, -1.0);
      m.rotation.y = Math.PI;
      m.userData.equipo = P.ocupados[i] ?? -1;
      PALCO.add(m);
      CUADROS.push(m);
      this.tocables.push(m);
    }

    // ── polideportivos (o el de ejemplo) y los terrenos que esperan ──
    const CARTELES_POLI: { m: THREE.Mesh; foto: THREE.Mesh; equipo: number; ejemplo: boolean }[] = [];
    this.polis.forEach((p) => {
      const POLI = grupo();
      POLI.position.set(p.x, 0, p.z);
      POLI.userData.equipo = p.equipo;
      this.tocables.push(POLI);
      mesh(new THREE.BoxGeometry(14.4, 0.4, 8.4), mat("#C9C2B6"), 0, 0.2, 0, POLI);
      mesh(new THREE.BoxGeometry(14, 4, 8), mat("#EFE6D2"), 0, 2.2, 0, POLI);
      mesh(new THREE.BoxGeometry(14.06, 0.6, 8.06), mat(VERDE), 0, 0.7, 0, POLI);
      const g = new THREE.CylinderGeometry(4.2, 4.2, 14.4, 18, 1, false, 0, Math.PI);
      g.rotateZ(Math.PI / 2);
      mesh(g, mat("#2F9E55"), 0, 4.2, 0, POLI).scale.set(1, 0.5, 1);
      for (let i = -3; i <= 3; i++) mesh(new THREE.BoxGeometry(0.12, 0.2, 8.6), mat("#E8F7EC"), i * 2, 4.35, 0, POLI);
      mesh(new THREE.BoxGeometry(3.2, 2.6, 0.12), borde, 0, 1.7, 4.02, POLI);
      for (const wx of [-5, -3.6, 3.6, 5]) mesh(new THREE.BoxGeometry(1.0, 1.4, 0.1), mat("#9FD3E8", { roughness: 0.2 }), wx, 2.3, 4.03, POLI);
      const cartel = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1.6), new THREE.MeshBasicMaterial({ transparent: true }));
      cartel.position.set(0, 3.55, 4.08);
      POLI.add(cartel);
      const foto = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), new THREE.MeshBasicMaterial({ transparent: true }));
      foto.position.set(0, 6.1, 3.2);
      foto.rotation.x = -0.12;
      POLI.add(foto);
      mesh(new THREE.BoxGeometry(2.6, 2.6, 0.1), borde, 0, 6.1, 3.13, POLI).rotation.x = -0.12;
      mesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), borde, 0, 4.9, 3.1, POLI);
      const piso = mesh(new THREE.BoxGeometry(9, 0.06, 5.4), mat("#3E8E57", { flatShading: false }), 0, 0.03, 7.6, POLI);
      piso.castShadow = false;
      const lin = (wd: number, dp: number, x: number, z: number) => mesh(new THREE.BoxGeometry(wd, 0.02, dp), BLANCO, x, 0.07, z, POLI);
      lin(9, 0.08, 0, 4.95);
      lin(9, 0.08, 0, 10.25);
      lin(0.08, 5.3, 4.46, 7.6);
      lin(0.08, 5.3, -4.46, 7.6);
      lin(0.08, 5.3, 0, 7.6);
      for (const s of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.08, 1, 0.08), BLANCO, s * 4.4, 0.5, 6.8, POLI);
        mesh(new THREE.BoxGeometry(0.08, 1, 0.08), BLANCO, s * 4.4, 0.5, 8.4, POLI);
        mesh(new THREE.BoxGeometry(0.08, 0.08, 1.68), BLANCO, s * 4.4, 1.0, 7.6, POLI);
      }
      CARTELES_POLI.push({ m: cartel, foto, equipo: p.equipo, ejemplo: p.ejemplo });
    });
    const CARTELES_LOTE: THREE.Mesh[] = [];
    lotesLibres.slice(0, 1).forEach((l) => {
      const L = grupo();
      L.position.set(l.x, 0, l.z);
      // terreno marcado con estacas y cinta, y un cartel «reservado»
      const estaca = mat("#8a6a45"), cinta = mat(VERDE);
      for (const [x, z] of [[-7, -4], [7, -4], [7, 10], [-7, 10]] as const) mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), estaca, x, 0.45, z, L);
      mesh(new THREE.BoxGeometry(14, 0.05, 0.05), cinta, 0, 0.8, -4, L);
      mesh(new THREE.BoxGeometry(14, 0.05, 0.05), cinta, 0, 0.8, 10, L);
      mesh(new THREE.BoxGeometry(0.05, 0.05, 14), cinta, -7, 0.8, 3, L);
      mesh(new THREE.BoxGeometry(0.05, 0.05, 14), cinta, 7, 0.8, 3, L);
      for (const sx of [-2.2, 2.2]) mesh(new THREE.BoxGeometry(0.16, 3.2, 0.16), borde, sx, 1.6, 9.6, L);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.2), new THREE.MeshBasicMaterial({ transparent: true }));
      c.position.set(0, 2.6, 9.72);
      L.add(c);
      CARTELES_LOTE.push(c);
    });

    // ── carteles LED (meta 10.000): fantasmas mientras no se cumpla ──
    const conLed = metaOk(10000);
    const LED = grupo();
    {
      const pos: [number, number, number][] = [];
      for (let x = -9; x <= 9; x += 4.5) pos.push([x, -7.3, 0], [x, 7.3, Math.PI]);
      for (const z of [-4.5, 4.5]) pos.push([-12.6, z, Math.PI / 2], [12.6, z, -Math.PI / 2]);
      pos.forEach(([x, z, r], i) => {
        if (conBanco && z < 0 && Math.abs(x) > 2 && Math.abs(x) < 7) return;
        const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: conLed ? 1 : 0.28, depthWrite: conLed });
        const b = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), m);
        b.position.set(x, 0.6, z);
        b.rotation.y = r;
        b.userData.k = i % 3;
        LED.add(b);
        const e = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(3.6, 0.9, 0.12)),
          new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: conLed ? 0.9 : 0.5 }),
        );
        e.position.copy(b.position);
        e.rotation.y = r;
        LED.add(e);
      });
    }

    // ── gente ──
    this.pelota = mesh(new THREE.IcosahedronGeometry(0.19, 1), mat("#F5F5F5", { roughness: 0.6 }), 0, 0.19, 0);
    mesh(new THREE.TorusGeometry(0.19, 0.035, 6, 16), mat(VERDE), 0, 0, 0, this.pelota);
    const pibe = (color: string) => {
      const g = new THREE.Group();
      const ropa = mat(color), piel = mat("#C68B59"), short = mat("#2b2b2b");
      mesh(new THREE.CapsuleGeometry(0.27, 0.5, 4, 8), ropa, 0, 1.05, 0, g);
      mesh(new THREE.SphereGeometry(0.21, 10, 8), piel, 0, 1.62, 0, g);
      const pierna = (sx: number) => {
        const p = new THREE.Group();
        p.position.set(sx, 0.62, 0);
        g.add(p);
        mesh(new THREE.CapsuleGeometry(0.1, 0.42, 3, 6), short, 0, -0.3, 0, p);
        return p;
      };
      const brazo = (sx: number) => {
        const p = new THREE.Group();
        p.position.set(sx, 1.25, 0);
        g.add(p);
        mesh(new THREE.CapsuleGeometry(0.08, 0.36, 3, 6), ropa, 0, -0.24, 0, p);
        return p;
      };
      scene.add(g);
      return { g, pi: pierna(-0.13), pd: pierna(0.13), bi: brazo(-0.34), bd: brazo(0.34) };
    };
    this.pibes = ["#E63946", "#F1FAEE", "#1D3557", "#F4A261", "#2A9D8F", "#E9C46A"].map(pibe);
    if (conBanco) {
      for (const bx of [-4.2, 4.2])
        for (const dx of [-1.08, 0.36]) {
          const s = pibe(dx < 0 ? "#F1FAEE" : "#1D3557");
          s.g.position.set(bx + dx, 0, -7.42);
          s.g.scale.setScalar(0.92);
          s.pi.rotation.x = -1.4;
          s.pd.rotation.x = -1.4;
          this.suplentes.push(s);
        }
    }

    // hinchada y platea: una figura por persona, con un vaivén en el shader (barato para miles)
    const multitud = () => {
      const m = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = this.uTime;
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", "#include <common>\nuniform float uTime;")
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nfloat fase = float(gl_InstanceID) * 1.37;\ntransformed.y += 0.07 * max(0.0, sin(uTime * 3.2 + fase));",
          );
      };
      return m;
    };
    const cuerpo = new THREE.CapsuleGeometry(0.17, 0.36, 2, 6);
    cuerpo.translate(0, 0.35, 0);
    {
      const H = hinchada(d.hinchas.length);
      const lista = d.hinchas.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);
      const im = new THREE.InstancedMesh(cuerpo, multitud(), lista.length);
      const rnd = mulberry32(99);
      lista.forEach((i, k) => {
        this.dummy.position.set(H.pos[i * 2], 0, H.pos[i * 2 + 1]);
        this.dummy.rotation.set(0, Math.atan2(-H.pos[i * 2], 2 - H.pos[i * 2 + 1]), 0);
        this.dummy.scale.setScalar(0.9 + rnd() * 0.25);
        this.dummy.updateMatrix();
        im.setMatrixAt(k, this.dummy.matrix);
        im.setColorAt(k, C(COLS[Math.floor(rnd() * COLS.length)]));
        this.hinchaIdx.push(i);
        this.hinchaInst.set(i, k);
      });
      im.receiveShadow = true;
      scene.add(im);
      this.hinchasMesh = im;
      this.tocables.push(im);
    }
    {
      const lista = d.platea.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
      const im = new THREE.InstancedMesh(cuerpo, multitud(), lista.length);
      lista.forEach((i, k) => {
        const a = asientoPlatea(i, d.platea.length);
        this.dummy.position.set(a.x, a.y, a.z);
        this.dummy.rotation.set(0, Math.PI, 0);
        this.dummy.scale.setScalar(1);
        this.dummy.updateMatrix();
        im.setMatrixAt(k, this.dummy.matrix);
        im.setColorAt(k, C(i % 2 ? VERDE : "#ffffff"));
        this.plateaIdx.push(i);
        this.plateaInst.set(i, k);
      });
      im.castShadow = true;
      im.receiveShadow = true;
      scene.add(im);
      this.plateaMesh = im;
      this.tocables.push(im);
    }
    // marcador de «acá estás vos»: aro en el piso y flecha que flota
    {
      const aro = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.62, 32), new THREE.MeshBasicMaterial({ color: "#FABD32", transparent: true, opacity: 0.9, depthWrite: false }));
      aro.rotation.x = -Math.PI / 2;
      aro.position.y = 0.04;
      const flecha = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 4), new THREE.MeshBasicMaterial({ color: "#FABD32" }));
      flecha.rotation.x = Math.PI;
      this.marcador.add(aro, flecha);
      this.marcador.visible = false;
      scene.add(this.marcador);
    }
    // papelitos
    {
      const NP = 220;
      this.papelitos = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.13), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), NP);
      for (let i = 0; i < NP; i++) this.papelitos.setColorAt(i, C(i % 3 === 0 ? "#FABD32" : i % 2 ? VERDE : "#ffffff"));
      this.papelitos.visible = false;
      this.papelitos.frustumCulled = false;
      scene.add(this.papelitos);
    }

    // ── texturas con letra (cuando cargan las fuentes y los escudos) ──
    const fd = this.f.display, fu = this.f.ui;
    const canvasTex = (cw: number, ch: number, dibujar: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      dibujar(c.getContext("2d")!, cw, ch);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };
    const ponerMapa = (m: THREE.Mesh | THREE.Material, t: THREE.Texture) => {
      const mt = (m instanceof THREE.Mesh ? m.material : m) as THREE.MeshBasicMaterial;
      mt.map = t;
      mt.needsUpdate = true;
    };
    const cargarImg = (src: string | null) =>
      new Promise<HTMLImageElement | null>((ok) => {
        if (!src) return ok(null);
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = () => ok(null);
        im.src = src;
      });
    const cubrir = (g: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
      g.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
    };
    const redondo = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    };
    const recortar = (g: CanvasRenderingContext2D, s: string, max: number) => {
      while (g.measureText(s).width > max && s.length > 3) s = s.slice(0, -2) + "…";
      return s;
    };
    const torneAR = (g: CanvasRenderingContext2D, w: number, h: number, px: number) => {
      g.save();
      g.translate(w / 2, h / 2 + px * 0.04);
      g.transform(1, 0, -0.18, 1, 0, 0);
      g.font = `800 ${px}px ${fd}`;
      g.textBaseline = "middle";
      const a = g.measureText("TORNE").width, b = g.measureText("AR").width;
      g.textAlign = "left";
      g.fillStyle = "#ffffff";
      g.fillText("TORNE", -(a + b) / 2, 0);
      g.fillStyle = VERDE;
      g.fillText("AR", -(a + b) / 2 + a, 0);
      g.restore();
    };
    const escudos = Promise.all(d.equipos.map((e) => cargarImg(e.escudo)));
    const fuentesListas = document.fonts?.ready ?? Promise.resolve();
    Promise.all([escudos, fuentesListas]).then(([ims]) => {
      ponerMapa(textoCab, canvasTex(1440, 352, (g, w, h) => {
        g.fillStyle = "#0E0E0E";
        g.fillRect(0, 0, w, h);
        torneAR(g, w, h, 300);
      }));
      ponerMapa(cartelEq, canvasTex(2048, 860, (g, w, h) => {
        g.fillStyle = "#0E0E0E";
        g.fillRect(0, 0, w, h);
        g.strokeStyle = VERDE;
        g.lineWidth = 10;
        g.strokeRect(5, 5, w - 10, h - 10);
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = VERDE;
        g.font = `800 64px ${fd}`;
        g.fillText(`EQUIPOS EN TORNEAR · ${d.equipos.length}`, w / 2, 52);
        const cols = 5, filas = Math.ceil(d.equipos.length / cols), cw = (w - 60) / cols, ch = (h - 110) / filas;
        const colores = ["#53E076", "#ffffff", "#BCCBB9", "#F2C14E", "#3E7CB1", "#D1495B"];
        d.equipos.forEach((e, i) => {
          const x = 30 + (i % cols) * cw, y = 100 + Math.floor(i / cols) * ch;
          g.fillStyle = colores[i % colores.length];
          g.beginPath();
          g.moveTo(x + 8, y + 6);
          g.lineTo(x + 8, y + ch - 6);
          g.lineTo(x + 40, y + ch / 2);
          g.closePath();
          g.fill();
          g.fillStyle = "#ffffff";
          g.font = `700 ${Math.min(40, ch * 0.62)}px ${fu}`;
          g.textAlign = "left";
          g.fillText(recortar(g, e.nombre, cw - 56), x + 48, y + ch / 2 + 2);
        });
      }));
      ponerMapa(cartelPlatea, canvasTex(800, 200, (g, w, h) => {
        g.fillStyle = "#0E0E0E";
        g.fillRect(0, 0, w, h);
        g.strokeStyle = VERDE;
        g.lineWidth = 10;
        g.strokeRect(5, 5, w - 10, h - 10);
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = VERDE;
        g.font = `800 120px ${fd}`;
        g.fillText("PLATEA TORNEAR", w / 2, h / 2 + 6);
      }));
      ponerMapa(marcadorTablero, canvasTex(1440, 594, (g, w, h) => {
        g.fillStyle = "#0f1712";
        g.fillRect(0, 0, w, h);
        g.strokeStyle = VERDE;
        g.lineWidth = 16;
        g.strokeRect(8, 8, w - 16, h - 16);
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = VERDE;
        g.font = `800 96px ${fd}`;
        g.fillText("PARTIDO INAUGURAL", w / 2, 106);
        g.fillStyle = "#ffffff";
        g.font = `800 170px ${fd}`;
        g.fillText("???", 300, 330);
        g.fillText("???", w - 300, 330);
        g.fillStyle = "#F3C792";
        g.font = `800 150px ${fd}`;
        g.fillText("VS", w / 2, 330);
        g.fillStyle = "rgba(255,255,255,.65)";
        g.font = `700 50px ${fu}`;
        g.fillText("¿quién juega primero?", w / 2, 510);
      }));
      const ledTex = ["TU MARCA ACÁ", "TORNEAR", conLed ? "TU MARCA ACÁ" : "META 10.000"].map((txt, k) =>
        canvasTex(720, 180, (g, w, h) => {
          g.fillStyle = k === 1 ? "#0E0E0E" : "#111";
          g.fillRect(0, 0, w, h);
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillStyle = k === 1 ? VERDE : "#ffffff";
          g.font = `800 104px ${fd}`;
          g.fillText(txt, w / 2, h / 2 + 6);
        }),
      );
      LED.children.forEach((b) => {
        if (b instanceof THREE.Mesh) ponerMapa(b, ledTex[b.userData.k]);
      });
      CEM.forEach((m) => {
        const { letras, w: mw, d: md } = m.userData as { letras: boolean; w: number; d: number };
        const cw = 1024, ch = Math.max(64, Math.round((cw * md) / mw));
        ponerMapa(m, canvasTex(cw, ch, (g, w, h) => {
          g.fillStyle = "#C8D0D6";
          g.fillRect(0, 0, w, h);
          const r = mulberry32(11);
          for (let i = 0; i < 500; i++) {
            g.fillStyle = r() < 0.5 ? "rgba(0,0,0,.035)" : "rgba(255,255,255,.08)";
            g.fillRect(r() * w, r() * h, 2, 2);
          }
          const largo = Math.max(mw, md), losas = Math.round(largo / 1.4), lado = mw >= md;
          g.fillStyle = "rgba(60,66,72,.45)";
          for (let k = 1; k < losas; k++) {
            const q = k / losas;
            if (lado) g.fillRect(q * w - 1.5, 0, 3, h);
            else g.fillRect(0, q * h - 1.5, w, 3);
          }
          const bw = Math.max(5, h * 0.06);
          g.fillStyle = VERDE;
          g.fillRect(0, 0, w, bw);
          g.fillRect(0, h - bw, w, bw);
          if (letras) {
            g.textBaseline = "middle";
            g.font = `800 ${Math.round(h * 0.62)}px ${fd}`;
            for (const fx of [0.11, 0.5, 0.89]) {
              const cx = w * fx, a = g.measureText("TORNE").width, b = g.measureText("AR").width;
              g.textAlign = "left";
              g.fillStyle = "#0E0E0E";
              g.fillText("TORNE", cx - (a + b) / 2, h / 2 + 4);
              g.fillStyle = "#1f7a3e";
              g.fillText("AR", cx - (a + b) / 2 + a, h / 2 + 4);
            }
          }
        }));
      });
      respaldoMat.map = canvasTex(1024, 320, (g, w, h) => {
        g.fillStyle = "#0E0E0E";
        g.fillRect(0, 0, w, h);
        torneAR(g, w, h, 220);
      });
      respaldoMat.needsUpdate = true;
      ponerMapa(cartelVip, canvasTex(1008, 216, (g, w, h) => {
        g.fillStyle = "#0E0E0E";
        redondo(g, 4, 4, w - 8, h - 8, 30);
        g.fill();
        g.strokeStyle = VERDE;
        g.lineWidth = 10;
        redondo(g, 8, 8, w - 16, h - 16, 26);
        g.stroke();
        g.fillStyle = "#F2C14E";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = `800 150px ${fd}`;
        g.fillText("★ PALCO VIP ★", w / 2, h / 2 + 8);
      }));
      CUADROS.forEach((m) => {
        const k = m.userData.equipo as number, eq = k >= 0 ? d.equipos[k] : null, im = k >= 0 ? ims[k] : null;
        ponerMapa(m, canvasTex(620, 728, (g, w, h) => {
          if (eq) {
            g.fillStyle = "#ffffff";
            redondo(g, 6, 6, w - 12, h - 12, 34);
            g.fill();
            g.save();
            redondo(g, 30, 30, w - 60, w - 60, 22);
            g.clip();
            if (im) cubrir(g, im, 30, 30, w - 60, w - 60);
            else {
              g.fillStyle = "#0E0E0E";
              g.fillRect(30, 30, w - 60, w - 60);
              g.fillStyle = VERDE;
              g.font = `800 260px ${fd}`;
              g.textAlign = "center";
              g.textBaseline = "middle";
              g.fillText(eq.nombre.slice(0, 1).toUpperCase(), w / 2, w / 2);
            }
            g.restore();
            g.fillStyle = "#0E0E0E";
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.font = `800 64px ${fd}`;
            g.fillText(recortar(g, eq.nombre.toUpperCase(), w - 50), w / 2, w + 26);
            g.fillStyle = "#2c8a4a";
            g.font = `800 34px ${fd}`;
            g.fillText(`${eq.n} INTEGRANTES`, w / 2, w + 76);
          } else {
            g.fillStyle = "rgba(14,14,14,.88)";
            redondo(g, 6, 6, w - 12, h - 12, 34);
            g.fill();
            g.setLineDash([26, 18]);
            g.lineWidth = 8;
            g.strokeStyle = VERDE;
            redondo(g, 22, 22, w - 44, h - 44, 26);
            g.stroke();
            g.setLineDash([]);
            g.fillStyle = VERDE;
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.font = `800 200px ${fd}`;
            g.fillText("+", w / 2, h / 2 - 90);
            g.font = `800 78px ${fd}`;
            g.fillText("TU ESCUDO", w / 2, h / 2 + 60);
            g.fillText("ACÁ", w / 2, h / 2 + 136);
          }
        }));
      });
      CARTELES_POLI.forEach(({ m, foto, equipo, ejemplo }) => {
        const eq = d.equipos[equipo], im = ims[equipo];
        ponerMapa(m, canvasTex(1800, 300, (g, w, h) => {
          g.fillStyle = "#0E0E0E";
          g.fillRect(0, 0, w, h);
          g.strokeStyle = VERDE;
          g.lineWidth = 12;
          g.strokeRect(6, 6, w - 12, h - 12);
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillStyle = VERDE;
          g.font = `800 70px ${fd}`;
          g.fillText(ejemplo ? "POLIDEPORTIVO · EJEMPLO" : "POLIDEPORTIVO", w / 2, 70);
          g.fillStyle = "#ffffff";
          g.font = `800 150px ${fd}`;
          g.fillText(recortar(g, eq.nombre.toUpperCase(), w - 80), w / 2, 196);
        }));
        ponerMapa(foto, canvasTex(512, 512, (g, w, h) => {
          g.fillStyle = "#0E0E0E";
          g.fillRect(0, 0, w, h);
          if (im) cubrir(g, im, 0, 0, w, h);
        }));
      });
      CARTELES_LOTE.forEach((m) =>
        ponerMapa(m, canvasTex(1120, 440, (g, w, h) => {
          g.fillStyle = "#0E0E0E";
          redondo(g, 4, 4, w - 8, h - 8, 26);
          g.fill();
          g.strokeStyle = VERDE;
          g.lineWidth = 10;
          redondo(g, 9, 9, w - 18, h - 18, 22);
          g.stroke();
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillStyle = "#F2C14E";
          g.font = `800 66px ${fd}`;
          g.fillText("TERRENO RESERVADO", w / 2, 92);
          g.fillStyle = "#ffffff";
          g.font = `800 92px ${fd}`;
          g.fillText("PARA TU EQUIPO", w / 2, 200);
          g.fillStyle = "rgba(255,255,255,.75)";
          g.font = `700 40px ${fu}`;
          g.fillText("Jugá un partido en TorneAR", w / 2, 300);
          g.fillText("y acá construimos tu polideportivo", w / 2, 352);
        })),
      );
    });
  }
}
