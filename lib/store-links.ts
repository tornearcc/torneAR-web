/**
 * Fichas de torneAR en las tiendas.
 *
 * Son las mismas URLs que `app_versions.update_url` (una fila por plataforma),
 * las que la app abre en el modal de actualización forzada. Si una ficha
 * cambia, hay que tocar las dos: la constante y esa fila.
 *
 * Google Play: publicada en producción el 12/10/2026.
 *
 * Vive fuera de `lib/supabase` para que la zona pública pueda importarla sin
 * romper la regla de "cero cliente de Supabase" de `app/(public)/layout.tsx`.
 */
export const APP_STORE_URL = "https://apps.apple.com/ar/app/tornear/id6809490985";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.agussala2003.tornear";
