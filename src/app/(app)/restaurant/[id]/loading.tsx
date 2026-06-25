import { Skeleton } from "@/components/ui/skeleton";

export default function RestaurantLoading() {
  return (
    <div className="mx-auto h-full max-w-lg overflow-y-auto bg-[#F5F0E8] pb-20 md:pb-0">
      <Skeleton className="h-[220px] w-full rounded-none" />
      <div className="space-y-4 px-4 pt-4 pb-6">
        <div className="flex flex-wrap gap-1.5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <div>
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <div className="space-y-px overflow-hidden rounded-xl">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
