"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }
  return session;
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
) {
  const session = await requireAuth();

  await prisma.comment.create({
    data: {
      content,
      postId,
      userId: session.user.id,
      parentId: parentId ?? null,
    },
  });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { slug: true },
  });

  if (post) {
    revalidatePath(`/blog/${post.slug}`);
  }
}

export async function deleteComment(commentId: string) {
  const session = await requireAuth();

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { slug: true } } },
  });

  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");

  // 본인 댓글이거나 어드민만 삭제 가능
  if (comment.userId !== session.user.id && session.user.role !== "admin") {
    throw new Error("삭제 권한이 없습니다.");
  }

  await prisma.comment.delete({ where: { id: commentId } });

  revalidatePath(`/blog/${comment.post.slug}`);
}

export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      user: { select: { id: true, name: true, image: true } },
      reactions: true,
      replies: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          reactions: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
