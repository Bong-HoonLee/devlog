import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import TurndownService from "turndown";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

export function markdownToHtml(md: string): string {
  const result = processor.processSync(md);
  return String(result);
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

turndown.addRule("fencedCodeBlock", {
  filter: (node) => {
    return (
      node.nodeName === "PRE" &&
      node.firstChild !== null &&
      node.firstChild.nodeName === "CODE"
    );
  },
  replacement: (_content, node) => {
    const code = node.firstChild as HTMLElement;
    const className = code.getAttribute("class") || "";
    const langMatch = className.match(/language-(\S+)/);
    const lang = langMatch ? langMatch[1] : "";
    const text = code.textContent || "";
    return `\n\`\`\`${lang}\n${text}\n\`\`\`\n`;
  },
});

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html);
}
