import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}?subscribe=error`);
  }

  const subscriber = await prisma.subscriber.findUnique({ where: { token } });

  if (!subscriber) {
    return NextResponse.redirect(`${BASE_URL}?subscribe=invalid`);
  }

  if (!subscriber.verified) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { verified: true },
    });
  }

  return NextResponse.redirect(`${BASE_URL}?subscribe=success`);
}
