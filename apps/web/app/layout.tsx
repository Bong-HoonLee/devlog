import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchPalette } from "@/components/blog/search-palette";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { BASE_URL } from "@/lib/config";
import "katex/dist/katex.min.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
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
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
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
