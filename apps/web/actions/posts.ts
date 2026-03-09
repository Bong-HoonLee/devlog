"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import { POST_STATUSES, VALIDATION } from "@/lib/config";

function validatePostInput(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const excerpt = (formData.get("excerpt") as string)?.trim() || null;
  const status = formData.get("status") as string;
  const scheduledAt = formData.get("scheduledAt") as string | null;
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

  return { title, content, excerpt, status, scheduledAt, seriesId, tags };
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

  const isScheduled = status === "scheduled" && scheduledAt;
  const post = await prisma.post.create({
    data: {
      title,
      slug: slugify(title),
      content,
      excerpt,
      status: isScheduled ? "scheduled" : status,
      publishedAt: status === "published" ? new Date() : null,
      scheduledAt: isScheduled ? new Date(scheduledAt) : null,
      seriesId: seriesId || null,
      tags: buildTagsCreate(tags),
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdmin();

  const { title, content, excerpt, status, scheduledAt, seriesId, tags } =
    validatePostInput(formData);

  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { status: true, publishedAt: true },
  });

  const isScheduled = status === "scheduled" && scheduledAt;
  const publishedAt =
    status === "published" && existingPost?.status !== "published"
      ? new Date()
      : existingPost?.publishedAt;

  await prisma.postTag.deleteMany({ where: { postId: id } });

  await prisma.post.update({
    where: { id },
    data: {
      title,
      slug: slugify(title),
      content,
      excerpt,
      status: isScheduled ? "scheduled" : status,
      publishedAt,
      scheduledAt: isScheduled ? new Date(scheduledAt) : null,
      seriesId: seriesId || null,
      tags: buildTagsCreate(tags),
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
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

  await prisma.post.delete({ where: { id } });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}

const postWithTags = prisma.post.findUnique({
  where: { id: "" },
  include: { tags: { include: { tag: true } } },
});
export type PostWithTags = NonNullable<Awaited<typeof postWithTags>>;

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
