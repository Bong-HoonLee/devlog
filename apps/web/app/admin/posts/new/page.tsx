import { PostEditor } from "@/components/admin/post-editor";
import { createPost } from "@/actions/posts";

export default function NewPostPage() {
  async function action(_prevState: string | null, formData: FormData): Promise<string | null> {
    "use server";
    try {
      await createPost(formData);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "오류가 발생했습니다.";
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">새 글 작성</h2>
      <PostEditor action={action} />
    </div>
  );
}
