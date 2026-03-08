export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Dev Blog</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          개발과 기술에 대한 이야기를 기록합니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">최근 포스트</h2>
        <p className="text-gray-500 dark:text-gray-400">
          아직 작성된 포스트가 없습니다.
        </p>
      </section>
    </div>
  );
}
