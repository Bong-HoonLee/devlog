import { READING_SPEED_WPM } from "./config";

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / READING_SPEED_WPM));
  return `${minutes}분`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** PostTag 배열을 { name, slug } 배열로 변환 */
export function mapPostTags(
  tags: { tag: { name: string; slug: string } }[]
): { name: string; slug: string }[] {
  return tags.map((pt) => ({ name: pt.tag.name, slug: pt.tag.slug }));
}
