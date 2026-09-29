import { sanitizeInviteName } from "./invite-name";

/**
 * Invitación a un equipo: `/i/<username>?n=<nombre>&e=<código>&t=<equipo>`
 * (Tanda 7, P1-11).
 *
 * La arma la app en `tornear/lib/team-invite-link.ts`. Reutiliza `/i/` porque
 * es el único path que el SO ya abre en la app (Universal Link en iOS, App
 * Link en Android); un path nuevo en Android necesitaría una build.
 *
 * `t` (nombre del equipo) viaja en la URL por el mismo motivo que `n`: la zona
 * pública no consulta la base. Se limpia con la misma regla que el nombre de
 * quien invita. Si alguien lo edita, la página muestra otro nombre, pero la
 * solicitud se manda al equipo del código.
 */

export interface TeamInvite {
  code: string;
  teamName: string | null;
}

/** Mismo formato que acepta «Unirme a un equipo» en la app. */
export function sanitizeTeamCode(raw: string | string[] | undefined): string | null {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase() ?? "";
  return /^[A-Z0-9]{6,12}$/.test(value) ? value : null;
}

/** `null` si el link no trae un código válido: es una invitación personal de siempre. */
export function resolveTeamInvite(params: {
  [key: string]: string | string[] | undefined;
}): TeamInvite | null {
  const code = sanitizeTeamCode(params.e);
  if (!code) return null;
  return { code, teamName: sanitizeInviteName(params.t) };
}
