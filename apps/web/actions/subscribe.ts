"use server";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { BASE_URL } from "@/lib/config";

export async function subscribe(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "올바른 이메일 주소를 입력해주세요." };
  }

  await checkRateLimit("subscribe");

  const existing = await prisma.subscriber.findUnique({ where: { email } });

  if (existing?.verified) {
    return { error: "이미 구독 중인 이메일입니다." };
  }

  const subscriber = existing
    ? existing
    : await prisma.subscriber.create({ data: { email } });

  // Send verification email
  if (resend) {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "[Dev Blog] 이메일 구독 확인",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Dev Blog 구독 확인</h2>
          <p style="color: #4b5563;">아래 버튼을 클릭하여 구독을 확인해주세요.</p>
          <a href="${BASE_URL}/api/subscribe/verify?token=${subscriber.token}"
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; margin: 16px 0;">
            구독 확인
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            본인이 요청하지 않았다면 이 메일을 무시해주세요.
          </p>
        </div>
      `,
    });
  } else {
    // No Resend configured — auto-verify for development
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { verified: true },
    });
    return { success: "구독이 완료되었습니다! (개발 모드)" };
  }

  return { success: "확인 이메일을 발송했습니다. 메일함을 확인해주세요." };
}

export async function unsubscribe(token: string) {
  const subscriber = await prisma.subscriber.findUnique({ where: { token } });
  if (!subscriber) return { error: "유효하지 않은 링크입니다." };

  await prisma.subscriber.delete({ where: { id: subscriber.id } });
  return { success: "구독이 해제되었습니다." };
}

export async function getSubscriberCount() {
  return prisma.subscriber.count({ where: { verified: true } });
}
