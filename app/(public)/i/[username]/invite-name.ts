/**
 * Nombre visible de quien invita, leído del parámetro opcional `?n=` de
 * `/i/<username>?n=<nombre>`.
 *
 * ─── Por qué viaja en la URL y no se busca en la base ──────────────────────
 * Resolverlo desde el username exigiría una RPC pública que devuelva datos de
 * cualquier perfil a quien no tiene sesión, y eso deja recorrer el padrón de
 * usuarios, que incluye menores. La zona pública sigue sin cliente de Supabase
 * (ver `app/(public)/layout.tsx`).
 *
 * El costo es que el valor se puede falsificar editando el link: lo peor que
 * pasa es que la invitación muestre un nombre equivocado. La vinculación real
 * la hace el username del path, no esto.
 *
 * ─── Qué limpia ─────────────────────────────────────────────────────────────
 * El escapado HTML lo hacen React (en el cuerpo) y Next (en las `<meta>`), así
 * que acá no se escapa a mano: se limpia lo que el escapado NO resuelve.
 *  · `\p{C}`: caracteres de control, de formato y sin asignar. Incluye los
 *    overrides bidireccionales (U+202E), que dan vuelta visualmente el texto
 *    que sigue, y los de ancho cero, que hacen que dos nombres que se ven
 *    iguales no lo sean.
 *  · Espacios repetidos o saltos de línea, que en un `<h1>` o en el título de
 *    una preview de WhatsApp desarman el texto.
 *  · Largo: se corta por code points (`Array.from`) y no por unidades UTF-16,
 *    para no partir un emoji al medio y dejar un carácter roto.
 */

/** Suficiente para nombre y apellido; más largo rompe el título de la preview. */
const MAX_NAME_LENGTH = 40;

export function sanitizeInviteName(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;

  const cleaned = value
    .normalize("NFC")
    .replace(/\p{C}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  const chars = Array.from(cleaned);
  if (chars.length <= MAX_NAME_LENGTH) return cleaned;
  return `${chars.slice(0, MAX_NAME_LENGTH).join("").trimEnd()}…`;
}
