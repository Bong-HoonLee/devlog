"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleReaction(
  commentId: string,
  emoji: string,
  postSlug: string
) {
  const session = await auth();
  if (!session) throw new Error("로그인이 필요합니다.");

  const existing = await prisma.reaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId,
        userId: session.user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: {
        emoji,
        commentId,
        userId: session.user.id,
      },
    });
  }

  revalidatePath(`/blog/${postSlug}`);
}
