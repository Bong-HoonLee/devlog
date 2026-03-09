"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await auth();
  if (!session) return [];

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      comment: {
        include: {
          user: { select: { name: true, image: true } },
          post: { select: { slug: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session) return;

  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}
