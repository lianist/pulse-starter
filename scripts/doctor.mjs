// 실행: npm run doctor
// PULSE 실습 준비 상태를 점검합니다. 키를 넣을 .env.local이 없으면 만들어 줍니다.
// 의존성 없이 Node만으로 돕니다. 아무것도 지우거나 고치지 않습니다.

import { execSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);

let failed = 0;
let warned = 0;

function pass(label) {
  console.log(`${paint(32, "✓")} ${label}`);
}
function fail(label, fix) {
  failed += 1;
  console.log(`${paint(31, "✗")} ${label}`);
  if (fix) console.log(`  ${paint(90, "→")} ${fix}`);
}
function caution(label, fix) {
  warned += 1;
  console.log(`${paint(33, "!")} ${label}`);
  if (fix) console.log(`  ${paint(90, "→")} ${fix}`);
}
function note(label) {
  console.log(`${paint(90, "·")} ${paint(90, label)}`);
}
function heading(label) {
  console.log(`\n${paint(1, label)}`);
}

function run(command) {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 30000,
    }).trim();
  } catch {
    return null;
  }
}

function atLeast(version, minimum) {
  const a = version.split(".").map(Number);
  const b = minimum.split(".").map(Number);
  for (let i = 0; i < b.length; i += 1) {
    if ((a[i] ?? 0) !== b[i]) return (a[i] ?? 0) > b[i];
  }
  return true;
}

function osName() {
  if (process.platform === "darwin") {
    const version = run("sw_vers -productVersion");
    return version ? `macOS ${version}` : "macOS";
  }
  if (isWindows) {
    const build = Number(os.release().split(".")[2] ?? 0);
    return `Windows ${build >= 22000 ? "11" : "10"} (빌드 ${build})`;
  }
  return `${os.type()} ${os.release()}`;
}

function readEnvFile(file) {
  const values = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

const now = new Date();
const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
console.log(paint(1, "PULSE 셋업 점검"));
note(`${osName()} · ${stamp}`);

// 1. 프로그램
heading("프로그램");

const node = process.versions.node;
if (atLeast(node, "22.12.0")) pass(`Node.js v${node}`);
else fail(`Node.js v${node}: v22.12 이상이 필요합니다`, "셋업 가이드 3번으로 최신 LTS를 다시 설치합니다");

const npm = run("npm -v");
if (npm) pass(`npm ${npm}`);
else fail("npm을 찾지 못했습니다", "Node.js를 다시 설치하고 터미널을 새로 엽니다");

const git = run("git --version");
if (git) pass(git);
else fail("Git을 찾지 못했습니다", "셋업 가이드 2번을 하고 터미널을 새로 엽니다");

const gitName = git ? run("git config --global user.name") : null;
const gitEmail = git ? run("git config --global user.email") : null;
if (gitName && gitEmail) pass(`Git 사용자: ${gitName} <${gitEmail}>`);
else if (git) fail("Git에 이름이나 메일이 등록되지 않았습니다", "셋업 가이드 2번의 git config 두 줄을 넣습니다");

const claude = run("claude --version");
if (claude) pass(`Claude Code ${claude.replace(/\s*\(Claude Code\)\s*$/, "")}`);
else fail("Claude Code를 찾지 못했습니다", "셋업 가이드 5번(안 될 때 포함)을 합니다");

// 2. 이 폴더
heading("수업용 폴더");

const installed = ["next", "@anthropic-ai/sdk", "@react-pdf/renderer", "tsx", "vitest"].every((name) =>
  existsSync(path.join(root, "node_modules", ...name.split("/"), "package.json")),
);
if (installed) pass("npm install 완료");
else fail("필요한 부품이 설치되지 않았습니다", "이 폴더에서 npm install을 다시 실행합니다");

const envFile = path.join(root, ".env.local");
const envExample = path.join(root, ".env.local.example");
if (!existsSync(envFile) && existsSync(envExample)) {
  copyFileSync(envExample, envFile);
  pass(".env.local을 만들었습니다");
} else if (existsSync(envFile)) {
  pass(".env.local 있음");
} else {
  fail(".env.local.example이 없습니다", "저장소를 다시 받습니다");
}

if (existsSync(envFile)) {
  const env = readEnvFile(envFile);
  const empty = ["PULSE_CLAUDE_KEY", "UPSTAGE_API_KEY"].filter((key) => !env[key]);
  if (empty.length === 0) pass("키가 채워져 있습니다");
  else note(`비어 있는 키: ${empty.join(", ")} (수업에서 받아 채웁니다)`);
}

const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
if (installed && existsSync(tsxCli) && existsSync(envFile)) {
  const result = spawnSync(process.execPath, [tsxCli, "--env-file=.env.local", "scripts/hello.ts"], {
    cwd: root,
    encoding: "utf8",
    timeout: 60000,
  });
  if (result.status === 0 && result.stdout.includes("Hello, PULSE!")) pass("npm run cli 로 스크립트 실행");
  else fail("TypeScript 스크립트를 실행하지 못했습니다", "npm install을 다시 하고, 그래도 안 되면 이 화면을 질문 채널에 올립니다");
}

const files = [
  "samples/sample.pdf",
  "public/fonts/pretendard/Pretendard-Regular.ttf",
  "public/fonts/pretendard/Pretendard-Medium.ttf",
  "public/fonts/pretendard/Pretendard-Bold.ttf",
];
const missing = files.filter((file) => !existsSync(path.join(root, file)));
if (missing.length === 0) pass("샘플 PDF와 폰트");
else fail(`없는 파일: ${missing.join(", ")}`, "저장소를 다시 받습니다");

// 3. 사고 예방
heading("주의할 것");

const apiKeyVars = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"].filter((key) => process.env[key]);
if (apiKeyVars.length === 0) {
  pass("ANTHROPIC_API_KEY 환경변수 없음");
} else {
  fail(
    `${apiKeyVars.join(", ")} 환경변수가 컴퓨터에 잡혀 있습니다. Claude Code가 구독 대신 이 키로 결제할 수 있습니다`,
    isWindows
      ? `[Environment]::SetEnvironmentVariable('${apiKeyVars[0]}', $null, 'User') 를 넣고 터미널을 전부 닫았다 엽니다`
      : `~/.zshrc 에서 ${apiKeyVars[0]} 줄을 지우고 터미널을 종료했다 엽니다`,
  );
}

const projects = isWindows ? "C:\\Projects" : "~/Projects";
if (/onedrive/i.test(root)) {
  caution(`OneDrive 폴더 안에 있습니다: ${root}`, `동기화 때문에 설치와 실행이 꼬일 수 있습니다. ${projects} 아래에서 다시 받습니다`);
} else if (/[^\x20-\x7E]/.test(root)) {
  caution(`폴더 경로에 한글이나 특수문자가 있습니다: ${root}`, `${projects} 아래에서 다시 받는 것을 권합니다`);
} else {
  pass(`폴더 위치: ${root}`);
}

// 결과
console.log("");
if (failed === 0) {
  console.log(paint(32, "모두 통과했습니다. 이 화면을 캡처해 제출합니다."));
  if (warned > 0) console.log("! 표시는 당장 문제는 아니지만, 안내대로 옮겨 두면 수업 중에 덜 막힙니다.");
} else {
  console.log(paint(31, `${failed}개 항목을 해결해야 합니다. 위에서부터 → 안내대로 하고 npm run doctor를 다시 실행합니다.`));
  console.log("막히면 이 화면 전체를 캡처해 질문 채널에 올립니다.");
}
