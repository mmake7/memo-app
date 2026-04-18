# 메모장 (Memo App)

React + Vercel Functions + PostgreSQL로 구현한 메모장 웹앱.

Supabase는 **PostgreSQL DB만** 사용(REST/Auth 미사용), 데이터 접근은 Vercel 서버리스 함수에서 `pg`로 직접 처리합니다.

## 기술 스택

- **Frontend**: React 18 + Tailwind CSS (CDN, Babel 런타임)
- **Backend**: Vercel Functions (Node.js) + `pg`
- **Database**: PostgreSQL (Supabase 무료 티어 DB 풀러)

## 파일 구조

```
memo-app/
├── api/
│   ├── notes.js         # GET, POST  →  /api/notes
│   └── notes/
│       └── [id].js      # PUT, DELETE → /api/notes/:id
├── lib/
│   └── db.js            # pg Pool + 스키마 자동 초기화
├── index.html           # 앱 진입점 (정적 파일)
├── client.js            # React 앱 (JSX, fetch 기반 storage)
├── schema.sql           # 참고용 스키마 (lib/db.js가 자동 실행)
├── package.json
├── .env.example
├── .vercelignore
└── .gitignore
```

## 로컬 개발

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env` 파일 생성:

```env
DATABASE_URL=postgresql://USER:URL_ENCODED_PASSWORD@HOST:6543/postgres
```

> 비밀번호 특수문자는 URL 인코딩 필요: `!` → `%21`, `@` → `%40`, `#` → `%23`, `$` → `%24`

### 3. 로컬 실행

```bash
npm run dev   # = vercel dev
```

`http://localhost:3000` 에서 접근. 최초 로컬 실행 시 Vercel 로그인 필요.

## Vercel 배포

### 1. Vercel 로그인

```bash
vercel login
```

### 2. 프로젝트 초기화 & Preview 배포

```bash
vercel
```

대화형 질문에 답하면 프로젝트가 연결됩니다.

### 3. 환경변수 등록

```bash
vercel env add DATABASE_URL
```
값으로 Postgres 연결 문자열 입력. `Production`, `Preview`, `Development` 모두 선택.

또는 [Vercel 대시보드 → Project → Settings → Environment Variables](https://vercel.com/dashboard) 에서 등록.

### 4. 프로덕션 배포

```bash
npm run deploy   # = vercel --prod
```

## API

| Method | Path              | 설명       |
|--------|-------------------|----------|
| GET    | `/api/notes`      | 전체 조회    |
| POST   | `/api/notes`      | 메모 생성    |
| PUT    | `/api/notes/:id`  | 메모 수정    |
| DELETE | `/api/notes/:id`  | 메모 삭제    |

## 기능

- 메모 생성 / 수정 / 삭제
- 제목 · 본문 분리 입력
- 디바운스 자동 저장 (500ms)
- `updated_at` 기준 자동 정렬
- 사이드바 검색
- 반응형 레이아웃 (모바일 사이드바 토글)
