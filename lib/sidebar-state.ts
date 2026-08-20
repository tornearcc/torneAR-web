/**
 * Estado colapsado del sidebar, compartido entre el Server Component que lo
 * lee (app/(admin)/dashboard/layout.tsx) y el Client Component que lo escribe
 * (components/admin/AdminSidebar.tsx).
 *
 * Vive en un módulo aparte y sin `"use server"`/`"use client"` para que ambos
 * lados importen la misma constante: si el nombre de la cookie se desincroniza
 * el sidebar arranca siempre expandido y el bug es silencioso.
 */
export const SIDEBAR_COOKIE_NAME = "tornear_admin_sidebar_collapsed";

/** Un año: es una preferencia de UI, no hay razón para que expire antes. */
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
