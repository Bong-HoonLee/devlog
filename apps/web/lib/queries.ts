import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { publicPostWhere } from "@/lib/post-visibility";

/**
 * 공개 화면이 읽는 조회를 모아둔 캐시 계층.
 *
 * Cache Components 는 프리렌더 중 new Date() 같은 불안정한 값을 금지하는데,
 * publicPostWhere() 는 예약 발행 판단에 현재 시각이 필요합니다.
 * "use cache" 스코프 안에서는 결과에 수명이 붙으므로 이 조합이 허용되고,
 * 덕분에 공개 페이지가 정적 셸을 가져 <Link> 프리페치가 동작합니다.
 *
 * 캐시 수명(minutes)은 예약 글이 공개되기까지의 최대 지연이기도 합니다.
 * 어드민에서 글을 저장/삭제하면 actions/posts.ts 가 즉시 무효화합니다.
 */
export const POSTS_TAG = "posts";

const postWithTags = { tags: { include: { tag: true } } } as const;

export async function getRecentPosts(take: number) {
  "use cache";
  cacheLife("minutes");
  cacheTag(POSTS_TAG);

  return prisma.post.findMany({
    where: publicPostWhere(),
    orderBy: { publishedAt: "desc" },
    take,
    include: postWithTags,
  });
}

export async function getPostPage(page: number, perPage: number) {
  "use cache";
  cacheLife("minutes");
  cacheTag(POSTS_TAG);

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: publicPostWhere(),
      orderBy: { publishedAt: "desc" },
      include: postWithTags,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where: publicPostWhere() }),
  ]);

  return { posts, totalCount };
}

/** 공개 글이 하나 이상 달린 태그만. 고아 태그는 0개 페이지가 되므로 제외합니다. */
export async function getPublicTags() {
  "use cache";
  cacheLife("minutes");
  cacheTag(POSTS_TAG);

  return prisma.tag.findMany({
    where: { posts: { some: { post: publicPostWhere() } } },
    include: {
      _count: { select: { posts: { where: { post: publicPostWhere() } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTagWithPosts(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(POSTS_TAG);

  return prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { post: publicPostWhere() },
        include: { post: { include: postWithTags } },
        orderBy: { post: { publishedAt: "desc" } },
      },
    },
  });
}

export async function getPublicSeries() {
  "use cache";
  cacheLife("minutes");
  cacheTag(POSTS_TAG);

  return prisma.series.findMany({
    orderBy: { title: "asc" },
    include: {
      posts: {
        where: publicPostWhere(),
        orderBy: { publishedAt: "asc" },
        select: { id: true, title: true, slug: true, publishedAt: true },
      },
    },
  });
}

export async function getSeriesBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(POSTS_TAG);

  return prisma.series.findUnique({
    where: { slug },
    include: {
      posts: {
        where: publicPostWhere(),
        orderBy: { publishedAt: "asc" },
        include: postWithTags,
      },
    },
  });
}

export async function getSitemapEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_TAG);

  const [posts, tags, series] = await Promise.all([
    prisma.post.findMany({
      where: publicPostWhere(),
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { posts: { some: { post: publicPostWhere() } } },
      select: { slug: true },
    }),
    prisma.series.findMany({
      where: { posts: { some: publicPostWhere() } },
      select: { slug: true },
    }),
  ]);

  return { posts, tags, series };
}

export async function getFeedPosts(take: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_TAG);

  return prisma.post.findMany({
    where: publicPostWhere(),
    orderBy: { publishedAt: "desc" },
    take,
    select: { title: true, slug: true, excerpt: true, publishedAt: true },
  });
}
