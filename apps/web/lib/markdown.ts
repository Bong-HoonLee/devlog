import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeShiki from "@shikijs/rehype";
import rehypeKatex from "rehype-katex";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "wrap" })
  .use(rehypeKatex)
  .use(rehypeShiki, {
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    transformers: [
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationFocus(),
    ],
  })
  .use(rehypeStringify);

export async function renderMarkdown(content: string): Promise<string> {
  // Callout 변환: > [!NOTE] → <div class="callout callout-note">
  const processed = content.replace(
    /^> \[!(NOTE|TIP|WARNING|DANGER|INFO)\]\s*\n((?:^>.*\n?)*)/gm,
    (_match, type: string, body: string) => {
      const text = body
        .replace(/^> ?/gm, "")
        .trim();
      const lower = type.toLowerCase();
      return `<div class="callout callout-${lower}"><p class="callout-title">${type}</p><p>${text}</p></div>\n`;
    }
  );

  const result = await processor.process(processed);
  return result.toString();
}

export function extractHeadings(
  content: string
): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s가-힣-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}
