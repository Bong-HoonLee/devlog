"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleLike(postId: string, postSlug: string) {
  const session = await auth();
  if (!session) throw new Error("로그인이 필요합니다.");

  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { postId, userId: session.user.id },
    });
  }

  revalidatePath(`/blog/${postSlug}`);
}
