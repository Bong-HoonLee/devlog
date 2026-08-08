import { Suspense } from "react";
import { PostList } from "@/components/blog/post-list";
import { BlogListSkeleton } from "@/components/ui/skeleton";

export const revalidate = 60;

export const metadata = {
  title: "Blog",
  description: "개발과 기술에 대한 글 목록",
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

// loading.tsx 를 쓰지 않고 여기서 Suspense 를 잡습니다.
// 세그먼트 단위 loading.tsx 는 /blog/[slug] 까지 감싸서,
// 없는 글에 대한 notFound() 가 200 으로 응답되는 문제가 있습니다.
export default async function BlogPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  return (
    <Suspense key={currentPage} fallback={<BlogListSkeleton />}>
      <PostList currentPage={currentPage} />
    </Suspense>
  );
}
