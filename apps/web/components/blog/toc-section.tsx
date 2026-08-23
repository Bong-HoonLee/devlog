import { renderMarkdown } from "@/lib/markdown";
import { Toc } from "./toc";

// 목차는 본문과 같은 렌더 결과에서 뽑습니다. renderMarkdown 이 cache 로 감싸져 있어
// ArticleBody 와 파이프라인을 공유하고, 요청당 한 번만 처리됩니다.
export async function TocSection({ content }: { content: string }) {
  const { headings } = await renderMarkdown(content);

  return <Toc headings={headings} />;
}
