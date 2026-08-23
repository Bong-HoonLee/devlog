import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Next.js 16 부터 @next/eslint-plugin-next 가 flat config 를 기본으로 내보내므로
// FlatCompat 없이 그대로 펼쳐 씁니다.
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
];

export default eslintConfig;
