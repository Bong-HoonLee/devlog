import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { getPost, updatePost } from "@/actions/posts";
import { getAllSeries } from "@/actions/series";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, seriesList] = await Promise.all([getPost(id), getAllSeries()]);

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
        postId={id}
        seriesList={seriesList.map((s: { id: string; title: string }) => ({ id: s.id, title: s.title }))}
        initialData={{
          title: post.title,
          content: post.content,
          excerpt: post.excerpt ?? "",
          tags: post.tags.map((pt: { tag: { name: string } }) => pt.tag.name).join(", "),
          status: post.status,
          scheduledAt: post.scheduledAt?.toISOString().slice(0, 16),
          seriesId: post.seriesId ?? undefined,
        }}
      />
    </div>
  );
}
