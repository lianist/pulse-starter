// 실행: npm run cli scripts/hello.ts
// scripts/ 안의 TypeScript 파일은 이렇게 실행합니다. .env.local의 값이 process.env로 들어옵니다.

const keys = ["PULSE_CLAUDE_KEY", "UPSTAGE_API_KEY", "PULSE_MODEL"];

console.log("Hello, PULSE!");
for (const key of keys) {
  console.log(`${key}: ${process.env[key] ? "들어 있음" : "비어 있음"}`);
}

export {};
