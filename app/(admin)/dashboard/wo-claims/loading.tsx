import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function WoClaimsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[520px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
