import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries";
import { BASE_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 글이 없는 태그는 /tags 목록에서도 숨기므로(0개 페이지) sitemap 에서도 제외합니다.
  // 태그 행은 글 수정/삭제 후에도 남기 때문에 필터 없이는 빈 페이지를 계속 제출하게 됩니다.
  const { posts, tags, series: seriesList } = await getSitemapEntries();

  const postEntries = posts.map((post: { slug: string; updatedAt: Date }) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const tagEntries = tags.map((tag: { slug: string }) => ({
    url: `${BASE_URL}/tags/${tag.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const seriesEntries = seriesList.map((series: { slug: string }) => ({
    url: `${BASE_URL}/series/${series.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/series`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/tags`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...postEntries,
    ...seriesEntries,
    ...tagEntries,
  ];
}
