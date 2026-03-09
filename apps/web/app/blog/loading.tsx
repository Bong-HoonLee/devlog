import { PostListSkeleton } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-24" />
        <Skeleton className="mt-2 h-5 w-32" />
      </div>
      <PostListSkeleton count={5} />
    </div>
  );
}
