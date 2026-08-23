import { cache } from "react";
import { unified, type Plugin } from "unified";
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

export interface Heading {
  id: string;
  text: string;
  level: number;
}

// ─── Callout ───
// > [!NOTE] 형태의 blockquote 를 mdast 단계에서 div 로 바꿉니다.
// HTML 문자열을 끼워넣던 이전 방식은 allowDangerousHtml / rehype-raw 없이는
// remark-rehype 가 통째로 버려서 콜아웃이 렌더링에서 사라졌습니다.
// 노드로 다루면 raw HTML 파싱을 열지 않고도 본문 안의 마크다운이 그대로 살아납니다.

interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

const CALLOUT_MARKER = /^\[!(NOTE|TIP|WARNING|DANGER|INFO)\]\s*/;

function applyCallout(blockquote: MdastNode): void {
  const firstParagraph = blockquote.children?.[0];
  if (!firstParagraph || firstParagraph.type !== "paragraph") return;

  const marker = firstParagraph.children?.[0];
  if (!marker || marker.type !== "text") return;

  const match = CALLOUT_MARKER.exec(marker.value ?? "");
  if (!match) return;

  const type = match[1];
  marker.value = (marker.value ?? "").slice(match[0].length);

  // 마커만 있던 줄이면 빈 텍스트 노드(와 뒤따르는 hard break)를 걷어냅니다.
  if (marker.value === "") {
    firstParagraph.children?.shift();
    if (firstParagraph.children?.[0]?.type === "break") {
      firstParagraph.children.shift();
    }
    if (firstParagraph.children?.length === 0) blockquote.children?.shift();
  }

  blockquote.data = {
    ...blockquote.data,
    hName: "div",
    hProperties: { className: ["callout", `callout-${type.toLowerCase()}`] },
  };

  blockquote.children?.unshift({
    type: "paragraph",
    data: { hProperties: { className: ["callout-title"] } },
    children: [{ type: "text", value: type }],
  });
}

function transformCallouts(node: MdastNode): void {
  for (const child of node.children ?? []) {
    if (child.type === "blockquote") applyCallout(child);
    transformCallouts(child);
  }
}

const remarkCallout: Plugin<[]> = () => (tree) => {
  transformCallouts(tree as unknown as MdastNode);
};

// ─── Heading 수집 ───
// rehype-slug 직후, 즉 실제로 HTML 에 박히는 id 를 그대로 읽습니다.
// 원문 마크다운을 정규식으로 다시 훑으면 코드 펜스 안의 '#' 주석을 헤딩으로
// 오인하고, 중복 제목의 -1 접미사 규칙도 rehype-slug 와 어긋납니다.

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { id?: unknown };
  children?: HastNode[];
}

const HEADING_TAGS: Record<string, number> = { h1: 1, h2: 2, h3: 3 };

function textContent(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textContent).join("");
}

function collectHeadings(node: HastNode, headings: Heading[]): void {
  for (const child of node.children ?? []) {
    const level = child.tagName ? HEADING_TAGS[child.tagName] : undefined;
    const id = child.properties?.id;
    if (level && typeof id === "string") {
      headings.push({ id, text: textContent(child), level });
    }
    collectHeadings(child, headings);
  }
}

const rehypeCollectHeadings: Plugin<[]> = () => (tree, file) => {
  const headings: Heading[] = [];
  collectHeadings(tree as unknown as HastNode, headings);
  file.data.headings = headings;
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkCallout)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeCollectHeadings)
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

export interface RenderedMarkdown {
  html: string;
  headings: Heading[];
}

// 본문과 목차가 서로 다른 Suspense 경계에서 렌더되므로 cache 로 한 번만 처리합니다.
export const renderMarkdown = cache(
  async (content: string): Promise<RenderedMarkdown> => {
    const result = await processor.process(content);

    return {
      html: result.toString(),
      headings: (result.data.headings as Heading[] | undefined) ?? [],
    };
  }
);
