import { getAllSeries, createSeries, deleteSeries } from "@/actions/series";

export default async function AdminSeriesPage() {
  const seriesList = await getAllSeries();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">시리즈 관리</h2>

      {/* 새 시리즈 생성 */}
      <form action={createSeries} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex-1 space-y-1">
          <label htmlFor="title" className="text-sm font-medium">시리즈 이름</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="예: Next.js 완전 정복"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="description" className="text-sm font-medium">설명 (선택)</label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="시리즈 설명"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          생성
        </button>
      </form>

      {/* 시리즈 목록 */}
      {seriesList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">등록된 시리즈가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {seriesList.map((series: { id: string; title: string; slug: string; description: string | null; _count: { posts: number } }) => (
            <div
              key={series.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div>
                <p className="font-medium">{series.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {series.description && `${series.description} · `}
                  {series._count.posts}개의 글
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteSeries(series.id);
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  삭제
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
