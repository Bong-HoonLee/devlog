import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata = {
  title: "About",
  description: "개발자 소개 및 포트폴리오",
};

const skills = [
  { category: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { category: "Backend", items: ["Node.js", "PostgreSQL", "Prisma", "Supabase"] },
  { category: "DevOps", items: ["Vercel", "GitHub Actions", "Docker", "Turborepo"] },
  { category: "Tools", items: ["Git", "VS Code", "Figma", "pnpm"] },
];

const projects = [
  {
    title: "Dev Blog",
    description: "풀스택 개발 블로그. Next.js 15, Supabase, Prisma, Tailwind CSS v4로 구축. WYSIWYG 에디터, 댓글/리액션, 시리즈, 전문 검색, 이메일 구독 등 구현.",
    tech: ["Next.js", "React 19", "Prisma", "Supabase", "Tailwind CSS v4"],
    link: "/",
    github: "https://github.com/Bong-HoonLee",
  },
];

const timeline = [
  { year: "현재", content: "풀스택 웹 개발 학습 및 블로그 운영" },
];

export default function AboutPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <FadeIn>
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">안녕하세요!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            개발과 기술에 대한 이야기를 기록하는 블로그입니다.
            <br />
            새로운 기술을 배우고 실험하며, 그 과정을 공유합니다.
          </p>
        </section>
      </FadeIn>

      {/* Skills */}
      <FadeIn delay={0.1}>
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Skills</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {skills.map((group: { category: string; items: string[] }) => (
              <div
                key={group.category}
                className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
              >
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {group.category}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item: string) => (
                    <span
                      key={item}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Projects */}
      <FadeIn delay={0.15}>
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Projects</h2>
          <div className="space-y-4">
            {projects.map((project: { title: string; description: string; tech: string[]; link: string; github: string }) => (
              <div
                key={project.title}
                className="rounded-xl border border-gray-200 p-6 dark:border-gray-800"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <div className="flex gap-2">
                    <Link
                      href={project.link}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Live
                    </Link>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:underline dark:text-gray-400"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {project.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.tech.map((t: string) => (
                    <span
                      key={t}
                      className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Timeline */}
      <FadeIn delay={0.2}>
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Timeline</h2>
          <div className="space-y-4 border-l-2 border-gray-200 pl-6 dark:border-gray-800">
            {timeline.map((item: { year: string; content: string }) => (
              <div key={item.year} className="relative">
                <div className="absolute -left-8 top-1 h-3 w-3 rounded-full bg-blue-600" />
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {item.year}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Contact */}
      <FadeIn delay={0.25}>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Contact</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/Bong-HoonLee"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href="mailto:devpeaceb@gmail.com"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Email
            </a>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
