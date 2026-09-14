/**
 * Ficha de torneAR en la App Store de Argentina.
 *
 * Es la misma URL que `app_versions.update_url` (platform = 'ios'), la que la
 * app abre en el modal de actualización forzada. Si la ficha cambia, hay que
 * tocar las dos: esta constante y esa fila.
 *
 * Sin constante de Google Play a propósito: la app no está publicada en Play,
 * y un botón que lleva a una ficha inexistente es peor que no tener botón.
 *
 * Vive fuera de `lib/supabase` para que la zona pública pueda importarla sin
 * romper la regla de "cero cliente de Supabase" de `app/(public)/layout.tsx`.
 */
export const APP_STORE_URL = "https://apps.apple.com/ar/app/tornear/id6809490985";
