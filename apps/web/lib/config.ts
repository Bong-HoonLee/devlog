// ─── Site ───
export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://devlog.vercel.app";

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
