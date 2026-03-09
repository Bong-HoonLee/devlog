export const metadata = {
  title: "About",
  description: "블로그 소개",
};

export default function AboutPage() {
  return (
    <div className="prose prose-gray max-w-none dark:prose-invert">
      <h1>About</h1>
      <p>
        안녕하세요! 개발과 기술에 대한 이야기를 기록하는 블로그입니다.
      </p>

      <h2>기술 스택</h2>
      <ul>
        <li>Next.js 15 (App Router, Turbopack)</li>
        <li>React 19 (Server Components)</li>
        <li>Tailwind CSS v4</li>
        <li>Supabase (PostgreSQL)</li>
        <li>Prisma ORM</li>
        <li>Vercel</li>
      </ul>

      <h2>Contact</h2>
      <ul>
        <li>
          GitHub:{" "}
          <a
            href="https://github.com/Bong-HoonLee"
            target="_blank"
            rel="noopener noreferrer"
          >
            @Bong-HoonLee
          </a>
        </li>
        <li>
          Email:{" "}
          <a href="mailto:devpeaceb@gmail.com">devpeaceb@gmail.com</a>
        </li>
      </ul>
    </div>
  );
}
