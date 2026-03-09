"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { EMOJI_OPTIONS } from "@/lib/config";

export async function toggleReaction(
  commentId: string,
  emoji: string,
  postSlug: string
) {
  const session = await requireAuth();
  await checkRateLimit("reaction");

  if (!EMOJI_OPTIONS.includes(emoji as typeof EMOJI_OPTIONS[number])) {
    throw new Error("유효하지 않은 이모지입니다.");
  }

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
