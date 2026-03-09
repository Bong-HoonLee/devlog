import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Dev Blog";
  const description = searchParams.get("description") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          backgroundColor: "#09090b",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 28,
              color: "#a1a1aa",
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 80,
            fontSize: 24,
            color: "#71717a",
          }}
        >
          Dev Blog
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
