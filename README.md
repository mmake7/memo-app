# 메모장 (Memo App)

React + Tailwind CSS + Supabase로 구현한 단일 파일 메모장 웹앱.

## 기술 스택

- **React 18** (CDN, Babel 런타임)
- **Tailwind CSS** (CDN)
- **Supabase** (PostgreSQL + REST API)

## 기능

- 메모 생성 / 수정 / 삭제
- 제목 · 본문 분리 입력
- `updated_at` 기준 자동 정렬
- 사이드바에서 메모 목록 탐색

## 실행 방법

### 1. Supabase 준비

1. [Supabase](https://supabase.com) 프로젝트 생성
2. `SQL Editor`에서 [`schema.sql`](./schema.sql) 실행
3. `index.html` 상단의 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`를 본인 값으로 교체

### 2. 로컬 실행

빌드 도구 없이 `index.html`을 브라우저로 열면 동작합니다.

```bash
# 간단한 로컬 서버 예시
python -m http.server 8000
# → http://localhost:8000
```

## 파일 구조

```
memo-app/
├── index.html   # 앱 전체 (React 컴포넌트 + 스타일)
├── schema.sql   # Supabase 테이블 · RLS 정책 · 시드 데이터
└── README.md
```

## 주의사항

`schema.sql`의 RLS 정책은 개발용으로 `anon` 키에 모든 CRUD를 허용합니다. 프로덕션에서는 `auth.uid()` 기반 정책으로 교체하세요.
