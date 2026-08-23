import { Suspense } from "react";
import { PostList } from "@/components/blog/post-list";
import { BlogListSkeleton } from "@/components/ui/skeleton";

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
//
// searchParams 는 요청 시점에만 알 수 있으므로 여기서 await 하지 않고
// promise 그대로 경계 안으로 내려보냅니다. 그래야 이 페이지의 셸이 프리렌더됩니다.
export default function BlogPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<BlogListSkeleton />}>
      <BlogListSection searchParams={searchParams} />
    </Suspense>
  );
}

async function BlogListSection({ searchParams }: Props) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  return <PostList currentPage={currentPage} />;
}
