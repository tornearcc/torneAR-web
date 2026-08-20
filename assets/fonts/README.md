# Fuentes para `/api/og/*`

`lib/og/fonts.ts` lee estos 4 archivos con `fs.readFileSync`. Sin ellos,
`/api/og/mvp` y `/api/og/elo` responden con una tarjeta de error explicando
qué falta — no rompen el build ni el resto del dashboard.

| Familia          | Archivo                          | Peso |
| ---------------- | --------------------------------- | ---- |
| Barlow Condensed  | `BarlowCondensed-Bold.ttf`        | 700  |
| Barlow Condensed  | `BarlowCondensed-ExtraBold.ttf`   | 800  |
| Inter (18pt)      | `Inter_18pt-Medium.ttf`           | 500  |
| Inter (18pt)      | `Inter_18pt-Bold.ttf`             | 700  |

Inter viene repartida por tamaño óptico (`_18pt`/`_24pt`/`_28pt` — instancias
estáticas de un mismo eje variable). Se usa sólo `_18pt`: todo el texto en
Inter de las plantillas actuales cae entre 22px y 32px, justo el rango para
el que ese master está afinado. Si `Inter_24pt-*.ttf` o `Inter_28pt-*.ttf`
están de más en esta carpeta, no hacen nada — sólo no se cargan.

Por qué TTF y no el WOFF2 que ya carga `app/layout.tsx` vía
`next/font/google`: Satori (el motor de `ImageResponse`) sólo soporta
TTF/OTF/WOFF. Con WOFF2 el render falla sin mencionar la fuente en ningún
lado.

Si el deploy es en Vercel: esta carpeta ya está declarada en
`next.config.ts` (`outputFileTracingIncludes`) para que la función
serverless de `/api/og/[template]` la incluya en su bundle — `assets/` no es
`public/`, así que Next no la detecta sola.
