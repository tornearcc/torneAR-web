import { requireAdminAuth } from "@/lib/admin-guard";
import { fetchUsersPage, resolveUserFilters, USERS_PAGE_SIZE } from "@/lib/users-data";
import { UsersTable } from "@/components/admin/UsersTable";
import { UsersToolbar } from "@/components/admin/UsersToolbar";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { Pagination } from "@/components/ui/Pagination";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = resolveUserFilters(params);

  // `requireAdminAuth()` acá además del layout: se necesita el `profile.id` del
  // admin logueado para no ofrecerle acciones sobre su propia cuenta. Es la
  // misma sesión ya resuelta, no una verificación duplicada.
  const [{ profile }, usersResult] = await Promise.all([
    requireAdminAuth(),
    fetchUsersPage(filters),
  ]);

  return (
    <PageTransition className="gap-6">
      <PageHeader
        title="Usuarios"
        description={
          usersResult.error
            ? "Gestión de cuentas."
            : `${usersResult.total.toLocaleString("es-AR")} ${usersResult.total === 1 ? "usuario" : "usuarios"} con los filtros actuales.`
        }
      />

      <UsersToolbar filters={filters} />

      {usersResult.error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar los usuarios: {usersResult.error}
        </p>
      ) : (
        <>
          <UsersTable users={usersResult.rows} currentAdminProfileId={profile.id} />
          <Pagination
            page={filters.page}
            size={USERS_PAGE_SIZE}
            total={usersResult.total}
          />
        </>
      )}
    </PageTransition>
  );
}
