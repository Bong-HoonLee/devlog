import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchPalette } from "@/components/blog/search-palette";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import "katex/dist/katex.min.css";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devlog.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Dev Blog",
    template: "%s | Dev Blog",
  },
  description: "개발과 기술에 대한 블로그",
  openGraph: {
    title: "Dev Blog",
    description: "개발과 기술에 대한 블로그",
    url: BASE_URL,
    siteName: "Dev Blog",
    locale: "ko_KR",
    type: "website",
    images: [`${BASE_URL}/api/og?title=Dev+Blog`],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    types: {
      "application/rss+xml": `${BASE_URL}/api/rss`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SearchPalette />
          <Header />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
            {children}
          </main>
          <Footer />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
