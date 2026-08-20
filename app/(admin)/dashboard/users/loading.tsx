import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      {/* Toolbar: búsqueda + filtro de estado. */}
      <Skeleton className="h-9 w-[560px] max-w-full rounded-md" />
      <Skeleton className="h-[560px] rounded-lg" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
