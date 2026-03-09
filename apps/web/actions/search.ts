"use server";

import { prisma } from "@/lib/prisma";

export async function searchPosts(query: string) {
  if (!query.trim()) return [];

  return prisma.post.findMany({
    where: {
      status: "published",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
    },
    take: 10,
    orderBy: { publishedAt: "desc" },
  });
}
