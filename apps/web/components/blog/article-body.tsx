import { renderMarkdown } from "@/lib/markdown";

export async function ArticleBody({ content }: { content: string }) {
  const { html } = await renderMarkdown(content);

  return (
    <div
      className="prose prose-gray max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:bg-transparent prose-pre:p-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
