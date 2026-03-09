"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";

export async function toggleLike(postId: string, postSlug: string) {
  const session = await requireAuth();
  await checkRateLimit("like");

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
