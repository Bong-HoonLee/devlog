"use server";

import { requireAdmin } from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { UPLOAD } from "@/lib/config";

export async function uploadImage(formData: FormData) {
  await requireAdmin();

  await checkRateLimit("upload");

  const file = formData.get("file") as File;
  if (!file || !file.size) {
    throw new Error("파일을 선택해주세요.");
  }

  if (file.size > UPLOAD.MAX_SIZE) {
    throw new Error("파일 크기는 5MB 이하만 가능합니다.");
  }

  if (!UPLOAD.ALLOWED_TYPES.includes(file.type as typeof UPLOAD.ALLOWED_TYPES[number])) {
    throw new Error("JPG, PNG, GIF, WebP, AVIF 파일만 업로드 가능합니다.");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `posts/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(UPLOAD.BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(UPLOAD.BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
}
