# 회의실 관리 시스템
Next.js 15 + TypeScript + Supabase 기반 회의실 예약/관리 서비스

## 로컬 실행
```bash
npm run dev
# http://localhost:3000
```

## 구조
```
src/
  app/                    # Next.js App Router
    page.tsx             # 메인(예약 현황 + 예약)
    layout.tsx           # 루트 레이아웃
    providers.tsx        # React Query Provider
    admin/               # 관리자 페이지
      login/             # 관리자 로그인
    my-reservations/     # 내 예약 조회/취소
  components/ui/         # shadcn-ui 구성요소
  lib/supabase/          # Supabase 클라이언트(서버/클라이언트)
  lib/services/          # 비즈니스 로직(Service 계층)
  types/                 # 타입 정의
```

## 현재 개발 현황(핵심)
- 사용자: 날짜별 예약 현황 조회, 예약 생성, 내 예약 조회/취소, 실시간 갱신.
- 관리자: 회의실 목록/생성/수정/삭제(CRUD) 구현 및 실시간 반영.
- 인증: 관리자 아이디/비밀번호 로그인(`/admin/login`), 세션 쿠키(`admin_session`).
- 기본 계정: 아이디 `joonake`, 비밀번호 `1234` (환경변수 `ADMIN_USERNAME`, `ADMIN_PASSWORD`로 변경 가능).
- 백엔드: Supabase(PostgreSQL), 중복 예약 방지 제약조건(GIST), RPC 기반 처리.
- 프런트: Next.js(App Router), shadcn-ui, React Hook Form + Zod 검증 적용.

## 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`

## 향후 개발 중요 원칙(1줄 요약)
타입과 스키마로 계약을 고정(Zod/TS)하고 서비스 계층 재사용으로 단일 책임을 지키며(중복 최소화), 필수 경로에 테스트를 붙여 회귀 오류를 방지한다.

