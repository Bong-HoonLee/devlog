import { redis } from "./redis";
import { prisma } from "./prisma";
import { VIEW_COUNT_SYNC_INTERVAL } from "./config";

const VIEW_COUNT_PREFIX = "views:";

export async function incrementViewCount(slug: string): Promise<number> {
  if (redis) {
    const count = await redis.incr(`${VIEW_COUNT_PREFIX}${slug}`);
    if (count % VIEW_COUNT_SYNC_INTERVAL === 0) {
      prisma.post
        .update({
          where: { slug },
          data: { viewCount: count },
        })
        .catch(() => {});
    }
    return count;
  }

  // Fallback: direct DB increment
  const post = await prisma.post.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });
  return post.viewCount;
}

export async function getViewCount(slug: string): Promise<number> {
  if (redis) {
    const count = await redis.get<number>(`${VIEW_COUNT_PREFIX}${slug}`);
    return count ?? 0;
  }

  const post = await prisma.post.findUnique({
    where: { slug },
    select: { viewCount: true },
  });
  return post?.viewCount ?? 0;
}
