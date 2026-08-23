import { getFeedPosts } from "@/lib/queries";
import { BASE_URL } from "@/lib/config";

// 수동 s-maxage 는 CDN 에 남아 revalidatePath 로 무효화할 수 없습니다.
// Next 캐시(lib/queries.ts 의 "use cache")에 맡겨야
// 글 생성/수정/삭제 시 즉시 갱신됩니다.
export async function GET() {
  const posts = await getFeedPosts(20);

  const items = posts
    .map(
      (post: { title: string; slug: string; excerpt: string | null; publishedAt: Date | null }) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt ?? ""}]]></description>
      <pubDate>${post.publishedAt?.toUTCString()}</pubDate>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dev Blog</title>
    <link>${BASE_URL}</link>
    <description>개발과 기술에 대한 블로그</description>
    <language>ko</language>
    <atom:link href="${BASE_URL}/api/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
