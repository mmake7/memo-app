# 메모장 (Memo App)

React + Node.js(Express) + PostgreSQL로 구현한 메모장 웹앱.

Supabase는 **PostgreSQL DB만** 사용하고, 데이터 접근은 직접 만든 Node.js 백엔드를 통해 이루어집니다.

## 기술 스택

- **Frontend**: React 18 + Tailwind CSS (CDN, Babel 런타임)
- **Backend**: Node.js + Express + `pg`
- **Database**: PostgreSQL (Supabase 무료 티어의 DB 풀러 사용)

## 파일 구조

```
memo-app/
├── server.js        # Express 서버 + Postgres pool + /api/notes CRUD
├── client.js        # React 앱 (JSX, fetch 기반 storage)
├── index.html       # 앱 진입점 (React/Tailwind/Babel CDN)
├── schema.sql       # 참고용 스키마 (server.js가 기동 시 자동 생성)
├── package.json
├── .env.example     # 환경변수 예시
└── .gitignore
```

## 설치 및 실행

### 1. 저장소 클론 & 의존성 설치

```bash
git clone https://github.com/mmake7/memo-app.git
cd memo-app
npm install
```

### 2. 환경변수 설정

`.env.example`을 `.env`로 복사하고 본인의 Postgres 연결 문자열을 입력하세요.

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://USER:URL_ENCODED_PASSWORD@HOST:6543/postgres
PORT=3005
```

> 비밀번호에 `!@#$` 같은 특수문자가 있으면 **URL 인코딩**이 필요합니다.
> 예: `!` → `%21`, `@` → `%40`, `#` → `%23`, `$` → `%24`

### 3. 서버 실행

```bash
npm start
# → Server running at http://localhost:3005
```

서버 시작 시 `notes` 테이블과 `updated_at` 자동 갱신 트리거를 자동 생성합니다.

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
