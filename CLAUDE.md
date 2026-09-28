@AGENTS.md

## Ramas y deploy (repo `torneAR-web`)

- **Ramas (D-58, desde el 27/09/2026), igual que en el repo de la app:** `develop` es donde se trabaja y `main` es producción. Vercel despliega a producción (`tornear.vercel.app`) cada merge a `main`.
- Features y fixes en `feature/<nombre>` o `fix/<nombre>`, **desde `develop`** y con PR **hacia `develop`**. Para publicar: PR `develop → main` con merge commit. Cada push de rama (incluida `develop`) genera una Preview Deployment, protegida con el login de Vercel (curl y los crawlers reciben un 302 al SSO).
- La rama por defecto de GitHub sigue siendo `main` a propósito: no se cambió para no arriesgar la rama de producción de Vercel. Al abrir un PR, elegir `develop` como base.
- Las RPCs `dashboard_*` **no** se versionan acá: sus migraciones viven en `tornear/supabase/migrations/`. Si un panel usa una RPC nueva, la migración se aplica **antes** del merge a `main`; si no, el panel muestra el error de carga en producción. `types/supabase.ts` de este repo se actualiza a mano con la firma nueva.
- Rutas de las que la app 1.0.0 depende en runtime y que un deploy no puede romper: `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json`, `/i/[username]`, `/legal/tyc`, `/legal/privacidad`, `/api/og/[template]`.
