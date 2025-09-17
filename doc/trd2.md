# TRD v2 - 회의실 관리 시스템 (상세)

현재 구현을 기준으로, 개발 시 오류를 최소화하기 위한 기술 요구사항을 세분화합니다.

## 1. 기술 스택/버전
- Next.js 15(App Router, Middleware), React 19, TypeScript 5
- Tailwind 3 + shadcn-ui
- Supabase: PostgreSQL 15+, Realtime, RPC, RLS(차후 활성화 예정)
- 테스트: Vitest + @testing-library/react, jsdom

## 2. 레이어/경계
- Presentation(UI): App Router pages/components (클라 UI 로직 최소화, 폼 검증은 Zod 병행)
- Services: `src/lib/services/*` 비즈니스 로직(데이터 집계, 변환, 호출)
- Data Access: Supabase client/server/service 클라이언트
- Cross-cutting: 인증/미들웨어, 타입, 유틸, 로깅

## 3. 디렉터리 구조(상세)
```
src/
  app/
    admin/login/page.tsx           # 관리자 로그인 UI
    admin/page.tsx                 # 관리자 회의실 CRUD
    api/admin/auth/route.ts        # 인증 API(ID/PW → admin_session)
    api/admin/rooms/route.ts       # 회의실 CRUD API
    my-reservations/page.tsx       # 내 예약 조회/취소
    page.tsx                       # 메인(예약 현황/생성)
    layout.tsx, providers.tsx, globals.css
  lib/
    auth/admin.ts                  # 세션 쿠키 가드
    services/{rooms,reservations}.ts
    supabase/{client,server,service}.ts
    utils.ts
  types/{database.ts,index.ts}
  middleware.ts                    # /admin 가드
```

## 4. 데이터 모델/DDL(권장 스키마)
```sql
CREATE TABLE IF NOT EXISTS meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(200) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reserver_name VARCHAR(50) NOT NULL,
  reserver_phone VARCHAR(20) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성능/무결성
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_end_after_start CHECK (end_time > start_time);
DO $$ BEGIN
  ALTER TABLE reservations
  ADD CONSTRAINT no_overlap EXCLUDE USING GIST (
    room_id WITH =,
    reservation_date WITH =,
    tsrange((reservation_date::timestamp + start_time), (reservation_date::timestamp + end_time)) WITH &&
  ) WHERE (status='active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at 트리거(옵션)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DO $$ BEGIN
  CREATE TRIGGER tr_upd_rooms BEFORE UPDATE ON meeting_rooms FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER tr_upd_resv  BEFORE UPDATE ON reservations  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 공개 조회용 뷰(민감정보 제외)
CREATE OR REPLACE VIEW public_reservations AS
  SELECT id, room_id, reservation_date, start_time, end_time, status, created_at, updated_at
  FROM reservations;
```

## 5. RPC 정의(권장 사양)
```sql
-- create_reservation(p_room_id, p_date, p_start, p_end, p_name, p_phone, p_password)
-- 내부에서 bcrypt 해시 저장, 충돌 시 에러 반환
-- cancel_reservation(p_id, p_phone, p_password)
-- 비밀번호/전화 검증 후 status='cancelled'
-- get_my_reservations(p_phone, p_password)
-- 비밀번호 검증 후 본인 예약 목록 반환
```

## 6. 인증/세션
- API: POST /api/admin/auth { username, password } → 200 { ok } | 401 { error }
- 쿠키: `admin_session`(HttpOnly, SameSite=Lax, Secure in prod, Max-Age=8h)
- 미들웨어: `/admin/*` 접근 시 `admin_session` 없으면 `/admin/login`으로 리다이렉트
- ENV: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (추후 DB 인증으로 전환 계획)

## 7. API 명세(정형)
- 회의실 목록 GET `/api/admin/rooms`
  - 200 { data: Room[] } | 401 { error }
- 회의실 생성 POST `/api/admin/rooms`
  - body: { name: string(1..100), location: string(1..200), capacity: int>0 }
  - 201 { data: Room } | 400 { error } | 401 | 500
- 회의실 수정 PUT `/api/admin/rooms`
  - body: { id: uuid, name?, location?, capacity? }
  - 200 { data: Room } | 400 | 401 | 500
- 회의실 삭제 DELETE `/api/admin/rooms?id=uuid`
  - 200 { ok: true } | 400 | 401 | 500

오류 포맷: `{ error: string | ZodErrorFlatten }`

## 8. 검증/에러 매핑
- 클라이언트: Zod 스키마로 사전 검증, 에러 메시지 한국어 통일
- 서버: Zod + DB 에러 문자열 매핑(중복 키 → "이미 존재", 제약 위반 → "시간 겹침")
- 토스트: 성공/실패 통일 메시지, 상세는 콘솔/로그로 남김

## 9. 실시간 설계
- 채널: `reservations:realtime`, `meeting_rooms:realtime`
- 이벤트: `*` -> 목록 재조회(날짜 필터 동기화)
- 언서브스크립션: 컴포넌트 언마운트 시 removeChannel 호출

## 10. 환경변수/설정
- 공개: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 서버: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- 예시: `.env.example` 동기화, 로컬 `.env.local`에서 값 주입

## 11. 테스트 전략
- 단위: 서비스/유틸(Zod 스키마, 시간 겹침, 슬롯 생성)
- 컴포넌트: 로그인/회의실 CRUD/예약 폼 상호작용
- 통합(모킹): fetch/Supabase 클라이언트 모킹, Realtime 콜백 시 재조회 호출 검증
- 케이스: 에지(마지막 슬롯, 동일 시작/끝, 전화 형식, 중복 이름)

## 12. 보안/성능
- HTTPS 전제, 쿠키 보안 속성 설정, 민감정보 미노출
- 비밀번호 해시(DB), 세션 추후 서명/JWT 고려
- 성능: 목록 쿼리 인덱스, N+1 방지(뷰/집계), 불필요 렌더 최소화

## 13. 배포/릴리즈 체크리스트
- [ ] ENV 구성(ADMIN_*, SUPABASE_*)
- [ ] DB 마이그레이션(테이블→제약/인덱스→뷰→RPC→RLS)
- [ ] Smoke 테스트(로그인/CRUD/예약/실시간)
- [ ] 롤백 스크립트 준비

## 14. 마이그레이션/롤백 전략
- 전진: DDL → 뷰 → RPC → 앱 배포 → 모니터링
- 롤백: 앱 중지 → RPC/뷰/제약 제거 → 스키마 원복 → 앱 재시작

## 15. 재사용 원칙(1줄)
타입/스키마 고정(Zod/TS) + 서비스 레이어 재사용 + 핵심 경로 테스트로 회귀 최소화.
