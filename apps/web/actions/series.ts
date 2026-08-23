"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import { POSTS_TAG } from "@/lib/queries";

export async function getAllSeries() {
  return prisma.series.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function createSeries(formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!title) throw new Error("시리즈 이름을 입력해주세요.");

  await prisma.series.create({
    data: {
      title,
      slug: slugify(title),
      description,
    },
  });

  updateTag(POSTS_TAG);
  revalidatePath("/admin/series");
  redirect("/admin/series");
}

export async function updateSeries(id: string, formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!title) throw new Error("시리즈 이름을 입력해주세요.");

  await prisma.series.update({
    where: { id },
    data: {
      title,
      slug: slugify(title),
      description,
    },
  });

  updateTag(POSTS_TAG);
  revalidatePath("/admin/series");
}

export async function deleteSeries(id: string) {
  await requireAdmin();

  await prisma.post.updateMany({
    where: { seriesId: id },
    data: { seriesId: null },
  });

  await prisma.series.delete({ where: { id } });

  updateTag(POSTS_TAG);
  revalidatePath("/admin/series");
  redirect("/admin/series");
}
