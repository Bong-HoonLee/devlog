"use server";

import { prisma } from "@/lib/prisma";
import { SEARCH_RESULTS_LIMIT } from "@/lib/config";

interface SearchResult {
  title: string;
  slug: string;
  excerpt: string | null;
}

export async function searchPosts(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Convert user query to tsquery format: "next js" → "next & js"
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word}:*`)
    .join(" & ");

  try {
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT "title", "slug", "excerpt"
      FROM "Post"
      WHERE "status" = 'published'
        AND (
          setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
          setweight(to_tsvector('simple', coalesce("excerpt", '')), 'B') ||
          setweight(to_tsvector('simple', coalesce("content", '')), 'C')
        ) @@ to_tsquery('simple', ${tsQuery})
      ORDER BY ts_rank(
        setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
        setweight(to_tsvector('simple', coalesce("excerpt", '')), 'B') ||
        setweight(to_tsvector('simple', coalesce("content", '')), 'C'),
        to_tsquery('simple', ${tsQuery})
      ) DESC
      LIMIT ${SEARCH_RESULTS_LIMIT}
    `;
    return results;
  } catch {
    // Fallback to simple search if tsquery fails (e.g., special characters)
    return prisma.post.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { excerpt: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { title: true, slug: true, excerpt: true },
      take: SEARCH_RESULTS_LIMIT,
      orderBy: { publishedAt: "desc" },
    });
  }
}
