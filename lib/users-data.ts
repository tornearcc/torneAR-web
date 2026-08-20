import { createClient } from "@/lib/supabase/server";

/**
 * Listado de usuarios para /dashboard/users.
 *
 * Todo pasa por `dashboard_users_list` (SECURITY DEFINER) y no por una query
 * directa a `profiles`, por dos razones que se suman: el estado de suspensión
 * vive en `auth.users.banned_until`, que Supabase no expone a PostgREST; y los
 * conteos de equipos y partidos son agregaciones que por §1.2 de
 * WEB_SPECIFICATION.md van en Postgres, no en N+1 desde Next.
 */

export const USER_STATUSES = ["all", "active", "suspended", "admin"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USERS_PAGE_SIZE = 25;

export interface AdminUserRow {
  profile_id: string;
  username: string;
  full_name: string;
  zone: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
  is_suspended: boolean;
  banned_until: string | null;
  teams_count: number;
  matches_count: number;
  referred_by_username: string | null;
  total_count: number;
}

export interface UserFilters {
  search: string;
  status: UserStatus;
  page: number;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveUserFilters(params: {
  [key: string]: string | string[] | undefined;
}): UserFilters {
  const rawStatus = firstParam(params.status);
  const rawPage = Number(firstParam(params.page));

  return {
    search: (firstParam(params.q) ?? "").trim().slice(0, 100),
    status: USER_STATUSES.includes(rawStatus as UserStatus)
      ? (rawStatus as UserStatus)
      : "all",
    page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1,
  };
}

export interface UsersPage {
  rows: AdminUserRow[];
  total: number;
  error: string | null;
}

export async function fetchUsersPage(filters: UserFilters): Promise<UsersPage> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("dashboard_users_list", {
    p_search: filters.search || undefined,
    p_status: filters.status,
    p_limit: USERS_PAGE_SIZE,
    p_offset: (filters.page - 1) * USERS_PAGE_SIZE,
  });

  if (error) {
    if (error.code !== "42501") {
      console.error("[users] dashboard_users_list falló:", error.message);
    }
    return { rows: [], total: 0, error: error.message };
  }

  const rows = (data ?? []) as AdminUserRow[];

  // `total_count` viaja repetido en cada fila (window function sobre el set
  // filtrado, antes del LIMIT). Sin filas no hay de dónde sacarlo, y 0 es la
  // respuesta correcta en ese caso.
  return { rows, total: rows[0]?.total_count ?? 0, error: null };
}
