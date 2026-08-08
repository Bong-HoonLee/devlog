import { incrementViewCount } from "@/lib/view-count";

export async function ViewCount({ slug }: { slug: string }) {
  const count = await incrementViewCount(slug);

  return <span>{count} views</span>;
}
