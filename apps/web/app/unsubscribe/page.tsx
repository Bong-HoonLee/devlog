import Link from "next/link";
import { unsubscribe } from "@/actions/subscribe";

// 인증이 필요한 화면이라 요청 시점 렌더가 정상입니다.
// 프리페치 이득이 없으므로 즉시 렌더 검증에서 제외합니다.
export const instant = false;

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = { title: "구독 해지" };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="text-gray-500">유효하지 않은 링크입니다.</p>
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">홈으로</Link>
      </div>
    );
  }

  const result = await unsubscribe(token);

  return (
    <div className="text-center space-y-4 py-12">
      {result.error ? (
        <p className="text-red-500">{result.error}</p>
      ) : (
        <p className="text-green-600 dark:text-green-400">{result.success}</p>
      )}
      <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">홈으로</Link>
    </div>
  );
}
