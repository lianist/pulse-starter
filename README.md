# pulse-starter

PULSE 2강 실습용 저장소입니다.

## 처음 한 번

```bash
git clone https://github.com/lianist/pulse-starter.git
cd pulse-starter
npm install
npm run doctor
```

`npm run doctor`는 준비 상태를 점검하고, 키를 넣을 `.env.local` 파일을 만들어 줍니다. 마지막 줄에 "모두 통과했습니다"가 나오면 준비된 것입니다.

## 키

수업에서 받은 키를 `.env.local`의 `=` 뒤에 붙여넣습니다. 이 파일은 GitHub에 올라가지 않습니다. 키를 채팅, 코드, 스크린샷에 남기지 않습니다.

## 스크립트 실행

`scripts/` 안의 TypeScript 파일은 이렇게 실행합니다. `.env.local`의 값이 함께 읽힙니다.

```bash
npm run cli scripts/hello.ts
```

## 웹 화면

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다. 화면은 3강에서 만듭니다.
