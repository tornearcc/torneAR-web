import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function VersionsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
