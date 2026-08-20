import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-lowest">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
