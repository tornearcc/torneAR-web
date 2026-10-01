import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div data-admin-shell className="flex min-h-dvh items-center justify-center bg-pitch">
      <Loader2 className="h-8 w-8 animate-spin text-chalk-dim" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
