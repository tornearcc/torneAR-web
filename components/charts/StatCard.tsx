export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-outline-variant bg-surface-container p-5">
      <p className="text-sm text-neutral-on-surface-variant">{label}</p>
      <p className="font-display mt-1 text-4xl text-neutral-on-surface">
        {value.toLocaleString("es-AR")}
      </p>
    </div>
  );
}
