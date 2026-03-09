/**
 * Simple inline markdown renderer for comments.
 * Supports: **bold**, *italic*, `code`, ~~strikethrough~~, [link](url), newlines
 * No block-level elements (headings, lists, code blocks) for security.
 */
export function renderCommentMarkdown(text: string): string {
  return text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code (before other inline styles)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Strikethrough
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // Links
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline dark:text-blue-400">$1</a>'
    )
    // Newlines
    .replace(/\n/g, "<br />");
}
