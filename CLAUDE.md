@AGENTS.md

## Ramas y deploy (repo `torneAR-web`)

- **`main` es la rama viva.** Vercel despliega a producción (`tornear.vercel.app`) cada merge a `main`. No hay `develop` en este repo.
- Features y fixes en `feature/<nombre>` o `fix/<nombre>`, **desde `main`** y con PR **hacia `main`**. Cada push de rama genera una Preview Deployment, protegida con el login de Vercel (curl y los crawlers reciben un 302 al SSO).
- ⚠️ **El repo de la app (`torneAR`, carpeta `tornear/`) usa la convención opuesta:** allá la rama viva es `develop` y `main` está desactualizada desde el 20/08/2026. Antes de mergear en cualquiera de los dos repos, confirmá en cuál estás. Detalle en `tornear/docs/WORKFLOW.md`.
- Las RPCs `dashboard_*` **no** se versionan acá: sus migraciones viven en `tornear/supabase/migrations/`. Si un panel usa una RPC nueva, la migración se aplica **antes** del merge a `main`; si no, el panel muestra el error de carga en producción. `types/supabase.ts` de este repo se actualiza a mano con la firma nueva.
- Rutas de las que la app 1.0.0 depende en runtime y que un deploy no puede romper: `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json`, `/i/[username]`, `/legal/tyc`, `/legal/privacidad`, `/api/og/[template]`.
