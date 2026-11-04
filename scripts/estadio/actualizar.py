"""Arma los datos de la web del estadio (/estadio): public/estadio/datos.json y los escudos.

La web no consulta la base nunca: todo lo que muestra sale de este archivo, que se actualiza a mano con cada
capítulo de «Del potrero al estadio» y se publica con un merge a main (Vercel).

Qué junta:
- hinchada: los que comentaron los reels de la serie (comentarios.json de contenido/2-proyectos/potrero-epN/datos,
  el que baja comentarios_navegador.py), con el capítulo en el que comentaron por primera vez.
- platea: los usuarios de la app (sin cuentas eliminadas, demo, revisor ni bloqueadas), con sus equipos.
- equipos activos (sin los de demo): integrantes, escudo y partidos jugados contra equipos reales.
  4 integrantes o más = palco VIP; un partido jugado = polideportivo.
- seguidores de @tornear.app (API de Instagram, con el token que guarda el dashboard).

Los lugares no se mueven entre actualizaciones: cada persona conserva su índice del datos.json anterior y los
nuevos se agregan al final (por fecha). Quien pide que lo saquen va a sacar.txt (uno por línea, sin @): queda un
hueco en su lugar y no se publica nunca más.

Uso (desde dashboard/):
  py -X utf8 scripts/estadio/actualizar.py --capitulo 3 [--comentarios RUTA] [--escudos]
  --escudos vuelve a bajar todos los escudos (si no, solo baja los que faltan).
"""
import argparse
import glob
import io
import json
import os
import re
import subprocess
import time
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.abspath(os.path.join(AQUI, "..", ".."))
RAIZ = os.path.abspath(os.path.join(WEB, ".."))
APP = os.path.join(RAIZ, "tornear")                       # carpeta con la CLI de Supabase linkeada a producción
SALIDA = os.path.join(WEB, "public", "estadio", "datos.json")
ESCUDOS = os.path.join(WEB, "public", "estadio", "escudos")
SACAR = os.path.join(AQUI, "sacar.txt")
GRAPH = "https://graph.instagram.com/v24.0"
PROPIA = "tornear.app"

# Reels de cada capítulo (shortcode → capítulo). Sumar los del capítulo nuevo antes de correr.
CAPITULOS = {
    1: ["DfIuz2VNI-a", "DfIzTlRNx9G", "DfIxG65N-Yc"],
    2: ["DfOI_RmMGxx", "DfOMd1wNz5Z", "DfOOEhutluV", "DfOP0Z9tjxj", "DfORe6ItdFp"],
}
# Equipo de los fundadores: su polideportivo se muestra como ejemplo mientras nadie haya jugado.
EJEMPLO_POLI = "1598937a-b682-4ec3-8552-2993e2f01d36"   # Maldito 32

# Metas de seguidores prometidas en la serie (las que ya se cumplieron se ven construidas).
METAS = [
    (300, "Arcos y líneas"), (500, "Césped"), (750, "Tribuna"), (1000, "Estadio"),
    (7500, "Banco de suplentes y cemento"), (10000, "Carteles alrededor"), (15000, "Camisetas"),
    (20000, "Segunda tribuna"), (25000, "Cabeceras"),
]

MALAS = ["puto", "puta", "trolo", "concha", "pija", "verga", "culo", "mierda", "forro", "pelotudo", "boludo", "choto",
         "orto", "nazi", "hitler", "sexo", "porn", "onlyfans", "putin", "mogolico", "pajero"]


def limpio(nombre):
    n = re.sub(r"[^a-z]", "", nombre.lower().translate(str.maketrans("áéíóúü013457", "aeiouuoieast")))
    return not any(m in n for m in MALAS)


def sql(q):
    f = os.path.join(AQUI, ".q.sql")
    with open(f, "w", encoding="utf-8") as fh:
        fh.write(q)
    try:
        r = subprocess.run(f'npx supabase db query --linked -f "{f}" -o json', cwd=APP, shell=True,
                           capture_output=True, text=True, encoding="utf-8")
    finally:
        os.remove(f)
    if "[" not in r.stdout:
        raise SystemExit("la consulta falló:\n" + (r.stderr or r.stdout)[-800:])
    filas = json.JSONDecoder().raw_decode(r.stdout[r.stdout.index("["):])[0]
    return filas.get("rows", []) if isinstance(filas, dict) else filas


def seguidores():
    filas = sql("""select s.decrypted_secret as t from public.social_accounts a
      join vault.decrypted_secrets s on s.id = a.access_token_secret_id
     where a.platform = 'instagram' and a.is_active limit 1;""")
    if not filas:
        raise SystemExit("no encontré el token de Instagram (¿la cuenta está conectada en el dashboard?)")
    url = f"{GRAPH}/me?" + urllib.parse.urlencode({"fields": "followers_count", "access_token": filas[0]["t"]})
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)["followers_count"]


def ordenar_estable(previos, nuevos, sacados):
    """previos: lista del datos.json anterior (con huecos None). nuevos: [(clave, fecha)].
    Devuelve la lista con los previos en su lugar y los que no estaban al final, por fecha."""
    lista = [None if (p is None or p.lower() in sacados) else p for p in previos]
    ya = {p.lower() for p in lista if p}
    for clave, _ in sorted(nuevos, key=lambda x: x[1]):
        if clave.lower() not in ya and clave.lower() not in sacados:
            lista.append(clave)
            ya.add(clave.lower())
    return lista


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--capitulo", type=int, required=True, help="capítulo que la web muestra como actual")
    ap.add_argument("--comentarios", help="comentarios.json (por defecto, el del último potrero-epN)")
    ap.add_argument("--escudos", action="store_true", help="volver a bajar todos los escudos")
    a = ap.parse_args()

    ruta_com = a.comentarios or sorted(glob.glob(os.path.join(RAIZ, "contenido", "2-proyectos", "potrero-ep*", "datos", "comentarios.json")),
                                       key=lambda p: int(re.search(r"ep(\d+)", p).group(1)))[-1]
    previo = json.load(open(SALIDA, encoding="utf-8")) if os.path.exists(SALIDA) else {}
    sacados = set()
    if os.path.exists(SACAR):
        sacados = {l.strip().lstrip("@").lower() for l in open(SACAR, encoding="utf-8") if l.strip() and not l.startswith("#")}

    # ── hinchada: primer comentario de cada uno ──
    cap_de = {sc: c for c, scs in CAPITULOS.items() for sc in scs}
    primero = {}
    for c in json.load(open(ruta_com, encoding="utf-8")):
        u = (c.get("usuario") or "").strip()
        if not u or u == PROPIA or not limpio(u):
            continue
        cap = cap_de.get(c.get("media"), 0)
        if u not in primero or c["fecha"] < primero[u][0]:
            primero[u] = (c["fecha"], cap)
    hinchas = ordenar_estable([h[0] if h else None for h in previo.get("hinchas", [])], [(u, f) for u, (f, _) in primero.items()], sacados)
    cap_previo = {h[0]: h[1] for h in previo.get("hinchas", []) if h}
    hinchas = [[u, primero[u][1] if u in primero else cap_previo.get(u, 0)] if u else None for u in hinchas]

    # ── equipos ──
    equipos = sql("""
      with demo as (
        select team_id from ambassador_exclusions where team_id is not null
        union select m.team_id from team_members m join profiles p on p.id = m.profile_id
         where p.username like 'demo\\_%' or p.username = 'revisor'),
      pj as (
        select x.tid, count(*) c from (
          select team_a_id tid, team_b_id rid from matches where status = 'FINALIZADO'
          union all select team_b_id, team_a_id from matches where status = 'FINALIZADO') x
         where x.rid not in (select team_id from demo) group by 1)
      select t.id, t.name, t.shield_url, t.created_at,
             (select count(*) from team_members m where m.team_id = t.id) n, coalesce(pj.c, 0) jugados
        from teams t left join pj on pj.tid = t.id
       where t.is_active and t.id not in (select team_id from demo)
       order by t.created_at;""")
    equipos = [e for e in equipos if int(e["n"]) > 0 and limpio(e["name"]) and e["name"].strip().lower() not in sacados]
    idx_eq = {e["id"]: i for i, e in enumerate(equipos)}

    # ── platea: usuarios de la app con sus equipos ──
    usuarios = sql("""
      select p.username, p.created_at, coalesce(array_agg(m.team_id) filter (where m.team_id is not null), '{}') equipos
        from profiles p join auth.users u on u.id = p.auth_user_id
        left join team_members m on m.profile_id = p.id
       where p.username not like 'usuario\\_eliminado%' and p.username not like 'demo\\_%' and p.username <> 'revisor'
         and (u.banned_until is null or u.banned_until <= now())
       group by p.id order by p.created_at;""")
    usuarios = [u for u in usuarios if limpio(u["username"])]
    def lista_ids(v):   # la CLI devuelve el array de Postgres como lista o como texto «{a,b}»
        return v if isinstance(v, list) else [x for x in str(v).strip("{}").split(",") if x]
    eq_de = {u["username"]: [idx_eq[t] for t in lista_ids(u["equipos"]) if t in idx_eq] for u in usuarios}
    platea = ordenar_estable([p[0] if p else None for p in previo.get("platea", [])], [(u["username"], u["created_at"]) for u in usuarios], sacados)
    platea = [[u, eq_de.get(u, [])] if u and u in eq_de else None for u in platea]

    # ── escudos (256 px, dentro de la web: no se linkea a Supabase) ──
    from PIL import Image
    base = [l.split("=", 1)[1].strip() for l in open(os.path.join(APP, ".env"), encoding="utf-8")
            if l.startswith("EXPO_PUBLIC_SUPABASE_URL=")][0]
    os.makedirs(ESCUDOS, exist_ok=True)
    salida_eq = []
    for e in equipos:
        escudo = None
        if e["shield_url"]:
            nombre = e["id"][:8] + ".jpg"
            destino = os.path.join(ESCUDOS, nombre)
            if a.escudos or not os.path.exists(destino):
                try:
                    with urllib.request.urlopen(f"{base}/storage/v1/object/public/shields/{e['shield_url']}", timeout=30) as r:
                        im = Image.open(io.BytesIO(r.read())).convert("RGB")
                    im.thumbnail((256, 256))
                    im.save(destino, "JPEG", quality=84)
                except Exception as err:   # un escudo roto no frena la actualización
                    print("  escudo sin bajar:", e["name"], err)
            if os.path.exists(destino):
                escudo = "/estadio/escudos/" + nombre
        n, jug = int(e["n"]), int(e["jugados"])
        salida_eq.append({"nombre": e["name"].strip(), "n": n, "escudo": escudo, "jugados": jug,
                          "ejemplo": e["id"] == EJEMPLO_POLI and jug == 0})

    seg = seguidores()
    datos = {
        "capitulo": a.capitulo,
        "actualizado": time.strftime("%Y-%m-%d"),
        "seguidores": seg,
        "metas": [{"n": n, "txt": t, "ok": seg >= n} for n, t in METAS],
        "hinchas": hinchas,
        "platea": platea,
        "equipos": salida_eq,
    }
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
    palco = [e["nombre"] for e in salida_eq if e["n"] >= 4]
    poli = [e["nombre"] for e in salida_eq if e["jugados"] > 0 or e["ejemplo"]]
    print(f"hinchada {sum(1 for h in hinchas if h)} · platea {sum(1 for p in platea if p)} · equipos {len(salida_eq)} · "
          f"palco {palco} · polideportivos {poli} · seguidores {seg} · {os.path.getsize(SALIDA) // 1024} KB")


if __name__ == "__main__":
    main()
