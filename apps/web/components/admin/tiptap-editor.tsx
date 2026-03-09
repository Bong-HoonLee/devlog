"use client";

import { useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import { TiptapToolbar } from "./tiptap-toolbar";
import { markdownToHtml, htmlToMarkdown } from "@/lib/editor-markdown";

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  initialContent?: string;
  name?: string;
}

export function TiptapEditor({
  initialContent = "",
  name = "content",
}: TiptapEditorProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleUpdate = useCallback(
    ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (hiddenRef.current && editor) {
          hiddenRef.current.value = htmlToMarkdown(editor.getHTML());
        }
      }, 300);
    },
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-blue-600 underline dark:text-blue-400",
        },
      }),
      Placeholder.configure({
        placeholder: "마크다운으로 글을 작성하세요...",
      }),
    ],
    content: initialContent ? markdownToHtml(initialContent) : "",
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class:
          "prose prose-gray dark:prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={initialContent}
      />
    </div>
  );
}
