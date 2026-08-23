"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import { POST_STATUSES, VALIDATION } from "@/lib/config";
import { POSTS_TAG } from "@/lib/queries";

function validatePostInput(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const excerpt = (formData.get("excerpt") as string)?.trim() || null;
  const status = formData.get("status") as string;
  const scheduledAtRaw = formData.get("scheduledAt") as string | null;
  const seriesId = formData.get("seriesId") as string | null;
  const tags = (formData.get("tags") as string)
    ?.split(",")
    .map((t: string) => t.trim())
    .filter((t: string) => t.length > 0 && t.length <= VALIDATION.TAG_MAX_LENGTH);

  if (!title || title.length > VALIDATION.TITLE_MAX_LENGTH) {
    throw new Error("제목은 1~200자 이내로 입력해주세요.");
  }
  if (!content) {
    throw new Error("내용을 입력해주세요.");
  }
  if (excerpt && excerpt.length > VALIDATION.EXCERPT_MAX_LENGTH) {
    throw new Error("요약은 500자 이내로 입력해주세요.");
  }
  if (!POST_STATUSES.includes(status as typeof POST_STATUSES[number])) {
    throw new Error("유효하지 않은 상태값입니다.");
  }

  // 예약 시각 없는 scheduled 는 영원히 공개되지 않으므로 여기서 막습니다.
  let scheduledAt: Date | null = null;
  if (status === "scheduled") {
    const parsed = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      throw new Error("예약 발행 시각을 올바르게 입력해주세요.");
    }
    scheduledAt = parsed;
  }

  return { title, content, excerpt, status, scheduledAt, seriesId, tags };
}

/**
 * 예약 글도 publishedAt 을 채웁니다.
 * 목록/RSS 가 publishedAt 으로 정렬하고 카드가 이 값을 날짜로 표시하기 때문에,
 * null 로 두면 공개되는 순간 정렬 맨 앞에 날짜 없이 나타납니다.
 */
function resolvePublishedAt(
  status: string,
  scheduledAt: Date | null,
  existing?: { status: string; publishedAt: Date | null } | null
): Date | null {
  if (status === "scheduled") return scheduledAt;
  if (status !== "published") return existing?.publishedAt ?? null;
  // 이미 발행된 글은 최초 발행 시각을 유지합니다.
  return existing?.status === "published" ? existing.publishedAt : new Date();
}

function buildTagsCreate(tags: string[]) {
  if (!tags.length) return undefined;
  return {
    create: tags.map((tagName: string) => ({
      tag: {
        connectOrCreate: {
          where: { slug: slugify(tagName) },
          create: { name: tagName, slug: slugify(tagName) },
        },
      },
    })),
  };
}

export async function createPost(formData: FormData) {
  await requireAdmin();

  const { title, content, excerpt, status, scheduledAt, seriesId, tags } =
    validatePostInput(formData);

  const post = await prisma.post.create({
    data: {
      title,
      slug: slugify(title),
      content,
      excerpt,
      status,
      publishedAt: resolvePublishedAt(status, scheduledAt),
      scheduledAt,
      seriesId: seriesId || null,
      tags: buildTagsCreate(tags),
    },
  });

  // updateTag 는 Server Action 전용으로, 다음 요청이 새 데이터를 기다리게 합니다
  // (read-your-writes). 어드민이 저장 직후 반영된 화면을 보게 됩니다.
  updateTag(POSTS_TAG);
  updateTag(`post-${post.slug}`);
  revalidatePath("/admin/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/api/rss");
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdmin();

  const { title, content, excerpt, status, scheduledAt, seriesId, tags } =
    validatePostInput(formData);

  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { status: true, publishedAt: true, slug: true },
  });

  const publishedAt = resolvePublishedAt(status, scheduledAt, existingPost);

  await prisma.postTag.deleteMany({ where: { postId: id } });

  const newSlug = slugify(title);

  await prisma.post.update({
    where: { id },
    data: {
      title,
      slug: newSlug,
      content,
      excerpt,
      status,
      publishedAt,
      scheduledAt,
      seriesId: seriesId || null,
      tags: buildTagsCreate(tags),
    },
  });

  updateTag(POSTS_TAG);
  updateTag(`post-${newSlug}`);
  // 제목이 바뀌어 slug 가 달라졌다면 이전 주소의 캐시도 함께 비웁니다.
  if (existingPost && existingPost.slug !== newSlug) {
    updateTag(`post-${existingPost.slug}`);
  }
  revalidatePath("/admin/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/api/rss");
  revalidatePath(`/admin/posts/${id}`);
}

export async function autoSavePost(
  id: string,
  data: { title: string; content: string; excerpt: string; tags: string }
) {
  await requireAdmin();

  await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || null,
    },
  });
}

export async function deletePost(id: string) {
  await requireAdmin();

  const deleted = await prisma.post.delete({ where: { id } });

  updateTag(POSTS_TAG);
  updateTag(`post-${deleted.slug}`);
  revalidatePath("/admin/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/api/rss");
  redirect("/admin/posts");
}

export type PostWithTags = Prisma.PostGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

export async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getPosts(): Promise<PostWithTags[]> {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}
