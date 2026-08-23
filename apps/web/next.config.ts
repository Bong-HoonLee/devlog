import type { NextConfig } from "next";

// 업로드 이미지 호스트는 NEXT_PUBLIC_SUPABASE_URL 하나에서 유도합니다.
// 하드코딩하면 스테이징 등 다른 Supabase 프로젝트를 가리킬 때
// next/image 가 "hostname is not configured" 로 전부 실패합니다.
function supabaseImageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  // Partial Prerendering. 정적 셸을 먼저 내보내고 요청 시점 데이터만 스트리밍합니다.
  // 덕분에 공개 페이지가 프리렌더되고 <Link> 프리페치가 실제로 동작합니다.
  cacheComponents: true,
  images: {
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "lh3.googleusercontent.com" },
      ...(supabaseHost ? [{ hostname: supabaseHost }] : []),
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "shiki", "@tiptap/react"],
  },
};

export default nextConfig;
