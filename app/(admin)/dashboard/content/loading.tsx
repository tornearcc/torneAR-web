import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ContentLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />

      <div className="flex flex-col items-center gap-4">
        {/* 1080×1350 escalado a la misma referencia que la preview real
            (max-w-md), para que no salte el layout al llegar la imagen. */}
        <Skeleton className="aspect-[4/5] w-full max-w-md rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    </div>
  );
}
