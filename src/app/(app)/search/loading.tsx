import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="flex h-full flex-col bg-[#F5F0E8]">
      <div className="border-b border-[#D4C8B4] px-4 py-3">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-stretch px-4">
            <Skeleton className="my-1.5 mr-3 w-[3px] shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5 border-b border-[#EDE6D8] py-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
