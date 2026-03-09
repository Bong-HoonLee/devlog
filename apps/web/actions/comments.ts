"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { renderCommentMarkdown } from "@/lib/comment-markdown";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { BASE_URL, VALIDATION } from "@/lib/config";

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
) {
  const session = await requireAuth();
  await checkRateLimit("comment");

  const trimmed = validateCommentContent(content);
  const htmlContent = renderCommentMarkdown(trimmed);

  const comment = await prisma.comment.create({
    data: {
      content: htmlContent,
      postId,
      userId: session.user.id,
      parentId: parentId ?? null,
    },
    include: {
      post: { select: { slug: true, title: true } },
      user: { select: { name: true } },
    },
  });

  // Send notification for replies
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { userId: true },
    });

    if (parentComment && parentComment.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "reply",
          userId: parentComment.userId,
          commentId: comment.id,
        },
      });

      sendReplyNotification(
        parentComment.userId,
        comment.user.name,
        trimmed,
        comment.post.title,
        comment.post.slug
      ).catch((err) => {
        console.error("[Email] Reply notification failed:", err);
      });
    }
  }

  revalidatePath(`/blog/${comment.post.slug}`);
}

async function findCommentOrThrow(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { slug: true } } },
  });
  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");
  return comment;
}

function validateCommentContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("댓글 내용을 입력해주세요.");
  if (trimmed.length > VALIDATION.COMMENT_MAX_LENGTH) {
    throw new Error(`댓글은 ${VALIDATION.COMMENT_MAX_LENGTH}자 이내로 작성해주세요.`);
  }
  return trimmed;
}

export async function updateComment(commentId: string, content: string) {
  const session = await requireAuth();
  await checkRateLimit("comment");

  const comment = await findCommentOrThrow(commentId);
  if (comment.userId !== session.user.id) {
    throw new Error("수정 권한이 없습니다.");
  }

  const trimmed = validateCommentContent(content);

  await prisma.comment.update({
    where: { id: commentId },
    data: { content: renderCommentMarkdown(trimmed) },
  });

  revalidatePath(`/blog/${comment.post.slug}`);
}

export async function deleteComment(commentId: string) {
  const session = await requireAuth();

  const comment = await findCommentOrThrow(commentId);

  if (comment.userId !== session.user.id && session.user.role !== "admin") {
    throw new Error("삭제 권한이 없습니다.");
  }

  await prisma.comment.delete({ where: { id: commentId } });

  revalidatePath(`/blog/${comment.post.slug}`);
}

export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      user: { select: { id: true, name: true, image: true } },
      reactions: true,
      replies: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          reactions: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function sendReplyNotification(
  targetUserId: string,
  replierName: string,
  replyContent: string,
  postTitle: string,
  postSlug: string
) {
  if (!resend) return;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { email: true },
  });

  if (!user?.email) return;

  const postUrl = `${BASE_URL}/blog/${postSlug}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: `[Dev Blog] ${replierName}님이 회원님의 댓글에 답글을 남겼습니다`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">${replierName}님의 답글</h2>
        <p style="color: #4b5563;">
          <strong>"${postTitle}"</strong> 글에서 회원님의 댓글에 답글이 달렸습니다.
        </p>
        <blockquote style="border-left: 3px solid #3b82f6; padding: 8px 16px; margin: 16px 0; background: #f9fafb; color: #374151;">
          ${replyContent}
        </blockquote>
        <a href="${postUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">
          글 보러 가기
        </a>
      </div>
    `,
  });
}
