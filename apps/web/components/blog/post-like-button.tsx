import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LikeButton } from "./like-button";

interface PostLikeButtonProps {
  postId: string;
  postSlug: string;
}

export async function PostLikeButton({ postId, postSlug }: PostLikeButtonProps) {
  const session = await auth();

  const [likeCount, userLike] = await Promise.all([
    prisma.like.count({ where: { postId } }),
    session
      ? prisma.like.findUnique({
          where: { postId_userId: { postId, userId: session.user.id } },
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
