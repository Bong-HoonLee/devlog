// ─── Site ───
// 배포 환경에서는 NEXT_PUBLIC_SITE_URL 을 반드시 설정해야 합니다.
// 누락 시 OG 이미지 / sitemap / RSS / canonical 링크가 잘못된 주소를 가리킵니다.
// ?? 가 아니라 || 인 이유: CI 등에서 미설정 변수가 빈 문자열로 주입되면
// ?? 는 이를 통과시켜 new URL("") 이 터집니다.
function resolveBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  // Vercel 배포에서는 프로젝트 프로덕션 도메인으로 폴백합니다.
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  // 프로덕션 빌드에서 localhost 를 SEO 메타데이터에 굽는 것보다 즉시 실패가 낫습니다.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL 이 설정되지 않았습니다. " +
        "sitemap / RSS / OG / canonical 링크가 잘못된 주소로 배포되는 것을 막기 위해 빌드를 중단합니다."
    );
  }

  return "http://localhost:3000";
}

export const BASE_URL = resolveBaseUrl();

// ─── Pagination ───
export const POSTS_PER_PAGE = 10;
export const SEARCH_RESULTS_LIMIT = 10;

// ─── Rate Limiting ───
export const RATE_LIMIT = {
  WINDOW: "10 s",
  MAX_REQUESTS: 10,
} as const;

// ─── Upload ───
export const UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
  ],
  BUCKET: "images",
} as const;

// ─── View Count ───
export const VIEW_COUNT_SYNC_INTERVAL = 10;

// ─── Debounce ───
export const SEARCH_DEBOUNCE_MS = 300;
export const AUTO_SAVE_DEBOUNCE_MS = 5000;
export const EDITOR_DEBOUNCE_MS = 300;

// ─── Content ───
export const READING_SPEED_WPM = 200;
export const SCROLL_THRESHOLD_PX = 400;

// ─── Reactions ───
export const EMOJI_OPTIONS = ["👍", "❤️", "🎉", "😄", "🤔", "👀"] as const;

// ─── Validation ───
export const VALIDATION = {
  COMMENT_MAX_LENGTH: 5000,
  TAG_MAX_LENGTH: 30,
  TITLE_MAX_LENGTH: 200,
  EXCERPT_MAX_LENGTH: 500,
} as const;

// ─── Post Status ───
export const POST_STATUSES = ["draft", "published", "scheduled"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

// ─── Command Palette ───
export const NAV_PAGES = [
  { name: "홈", path: "/", icon: "🏠" },
  { name: "블로그", path: "/blog", icon: "📝" },
  { name: "태그", path: "/tags", icon: "🏷️" },
  { name: "시리즈", path: "/series", icon: "📚" },
  { name: "소개", path: "/about", icon: "👤" },
] as const;

export const THEME_OPTIONS = [
  { value: "light", label: "라이트 모드", icon: "☀️" },
  { value: "dark", label: "다크 모드", icon: "🌙" },
  { value: "system", label: "시스템 설정", icon: "💻" },
] as const;
