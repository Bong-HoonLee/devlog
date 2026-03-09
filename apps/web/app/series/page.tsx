import Link from "next/link";
import type { Metadata } from "next";
import { getSeries } from "@/actions/series";

export const metadata: Metadata = {
  title: "시리즈",
  description: "연재 시리즈 목록",
};

export default async function SeriesListPage() {
  const seriesList = await getSeries();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">시리즈</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          주제별로 묶어 읽는 연재 시리즈
        </p>
      </div>

      {seriesList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          등록된 시리즈가 없습니다.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {seriesList.map((series: { id: string; title: string; slug: string; description: string | null; posts: { id: string }[] }) => (
            <Link
              key={series.id}
              href={`/series/${series.slug}`}
              className="group rounded-xl border border-gray-200 p-6 transition-colors hover:border-blue-300 dark:border-gray-800 dark:hover:border-blue-700"
            >
              <h2 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {series.title}
              </h2>
              {series.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {series.description}
                </p>
              )}
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                {series.posts.length}개의 글
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
