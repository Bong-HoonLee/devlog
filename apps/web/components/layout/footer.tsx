import { cacheLife } from "next/cache";

// 저작권 연도는 프리렌더 중 new Date() 를 직접 부르면 Cache Components 가 막습니다
// (렌더마다 달라질 수 있는 값). 하루 단위로 캐시해 연도가 바뀌면 자연히 갱신되게 합니다.
export async function Footer() {
  "use cache";
  cacheLife("days");

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {year} Dev Blog. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
