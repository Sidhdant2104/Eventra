import { Skeleton } from "@/components/ui";

export default function EventLoading() {
  return (
    <div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-[70vh] w-full" />
    </div>
  );
}
