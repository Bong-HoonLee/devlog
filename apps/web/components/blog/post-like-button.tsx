import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { LikeButton } from "./like-button";

interface PostLikeButtonProps {
  postId: string;
  postSlug: string;
}

export async function PostLikeButton({ postId, postSlug }: PostLikeButtonProps) {
  const session = await getSession();
  // 세션이 있어도 JWT 에 userId 가 없으면(로그인 시 DB 조회 실패 등) undefined 가 넘어가
  // Prisma 가 throw 하고, Suspense 가 이를 잡지 못해 페이지 전체가 에러로 떨어집니다.
  const userId = session?.user?.id;

  const [likeCount, userLike] = await Promise.all([
    prisma.like.count({ where: { postId } }),
    userId
      ? prisma.like.findUnique({
          where: { postId_userId: { postId, userId } },
        })
      : null,
  ]);

  return (
    <LikeButton
      postId={postId}
      postSlug={postSlug}
      likeCount={likeCount}
      isLiked={!!userLike}
    />
  );
}
