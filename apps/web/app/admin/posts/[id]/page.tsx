import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { getPost, updatePost } from "@/actions/posts";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  async function action(_prevState: string | null, formData: FormData): Promise<string | null> {
    "use server";
    try {
      await updatePost(id, formData);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "오류가 발생했습니다.";
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">글 수정</h2>
      <PostEditor
        action={action}
        initialData={{
          title: post.title,
          content: post.content,
          excerpt: post.excerpt ?? "",
          tags: post.tags.map((pt: { tag: { name: string } }) => pt.tag.name).join(", "),
          status: post.status,
        }}
      />
    </div>
  );
}
