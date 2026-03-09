import { auth } from "./auth";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("권한이 없습니다.");
  }
  return session;
}
