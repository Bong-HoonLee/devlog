import { headers } from "next/headers";
import { ratelimit } from "./redis";

export async function checkRateLimit(prefix = "api") {
  if (!ratelimit) return; // Skip if Redis not configured

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "anonymous";

  const { success } = await ratelimit.limit(`${prefix}:${ip}`);

  if (!success) {
    throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }
}
