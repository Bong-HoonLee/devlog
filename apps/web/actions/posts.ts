"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createPost(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string | null;
  const status = formData.get("status") as string;
  const tags = (formData.get("tags") as string)
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const slug = slugify(title);

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      status,
      publishedAt: status === "published" ? new Date() : null,
      tags: tags?.length
        ? {
            create: tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: slugify(tagName) },
                  create: { name: tagName, slug: slugify(tagName) },
                },
              },
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string | null;
  const status = formData.get("status") as string;
  const tags = (formData.get("tags") as string)
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { status: true, publishedAt: true },
  });

  // 처음 published 될 때만 publishedAt 설정
  const publishedAt =
    status === "published" && existingPost?.status !== "published"
      ? new Date()
      : existingPost?.publishedAt;

  // 기존 태그 삭제 후 새로 연결
  await prisma.postTag.deleteMany({ where: { postId: id } });

  await prisma.post.update({
    where: { id },
    data: {
      title,
      slug: slugify(title),
      content,
      excerpt: excerpt || null,
      status,
      publishedAt,
      tags: tags?.length
        ? {
            create: tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: slugify(tagName) },
                  create: { name: tagName, slug: slugify(tagName) },
                },
              },
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/admin/posts/${id}`);
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
