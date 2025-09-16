# 회의실 관리 시스템

Next.js 15 + TypeScript + Supabase 기반의 회의실 예약 관리 시스템입니다.

## 🚀 Getting Started

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인할 수 있습니다.

## 📋 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈페이지 (예약 현황)
│   ├── layout.tsx         # 루트 레이아웃
│   └── providers.tsx      # React Query Provider
├── components/
│   └── ui/                # shadcn-ui 컴포넌트
├── lib/
│   ├── supabase/          # Supabase 클라이언트
│   │   ├── client.ts      # 클라이언트 사이드
│   │   └── server.ts      # 서버 사이드
│   └── utils.ts           # 유틸리티 함수
└── hooks/
    └── use-toast.ts       # Toast 훅
```

## 🗄️ 데이터베이스 스키마

### meeting_rooms
- `id` (UUID, PK)
- `name` (VARCHAR(100), UNIQUE) - 회의실명
- `location` (VARCHAR(200)) - 위치
- `capacity` (INTEGER) - 수용인원
- `created_at`, `updated_at` (TIMESTAMP)

### reservations
- `id` (UUID, PK)
- `room_id` (UUID, FK) - 회의실 ID
- `reservation_date` (DATE) - 예약일
- `start_time`, `end_time` (TIME) - 시작/종료 시간
- `reserver_name` (VARCHAR(50)) - 예약자명
- `reserver_phone` (VARCHAR(20)) - 예약자 전화번호
- `reserver_password` (VARCHAR(100)) - 예약 비밀번호
- `password_hash` (TEXT) - 해싱된 비밀번호
- `status` (VARCHAR(20)) - 'active' | 'cancelled'
- `created_at`, `updated_at` (TIMESTAMP)

### users (미사용)
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `name` (TEXT)
- `created_at` (TIMESTAMP)

## 🔧 핵심 기능

### 데이터베이스 제약조건
- **시간 중복 방지**: GIST 제약조건으로 동일 회의실, 동일 날짜의 시간 겹침 방지
- **시간 유효성**: 종료 시간 > 시작 시간 검증
- **비밀번호 보안**: bcrypt 해싱으로 비밀번호 암호화

### Supabase 설정
- **RLS 활성화**: Row Level Security로 데이터 접근 제어
- **정책**: 
  - 회의실: 모든 사용자 읽기 가능
  - 예약: 모든 사용자 읽기/생성, 서비스 역할만 수정/삭제
- **인덱스**: 성능 최적화를 위한 복합 인덱스

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn-ui
- **Backend**: Supabase (PostgreSQL)
- **Form**: React Hook Form, Zod
- **State**: React Query, Zustand
- **Icons**: Lucide React
- **Utils**: date-fns, es-toolkit, ts-pattern

## 📝 개발 가이드라인

### 핵심 원칙
- **타입 안전성 우선**: TypeScript + Zod로 런타임/컴파일타임 오류 방지
- **서버 컴포넌트 우선**: Next.js App Router의 서버 컴포넌트 기본 사용
- **단순함**: 복잡한 패턴보다 명확한 해결책
- **실용성**: 이론보다 동작하는 코드 우선

### 파일 구조 규칙
- **컴포넌트**: PascalCase (ReservationForm.tsx)
- **서비스**: camelCase (roomService.ts)
- **타입**: PascalCase (Database.ts)
- **유틸리티**: camelCase (utils.ts)

### Supabase 클라이언트 사용법
```typescript
// 클라이언트 사이드
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// 서버 사이드
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

## 🔒 보안 고려사항

- **비밀번호 해싱**: bcrypt로 예약 비밀번호 암호화
- **입력 검증**: Zod 스키마로 모든 사용자 입력 검증
- **RLS 정책**: Supabase Row Level Security로 데이터 접근 제어
- **HTTPS**: Vercel 기본 제공 HTTPS 사용

## 📋 TODO

- [ ] 예약 현황 조회 페이지 구현
- [ ] 예약 생성 폼 구현
- [ ] 내 예약 조회 기능 구현
- [ ] 관리자 회의실 관리 페이지 구현
- [ ] 실시간 업데이트 기능 구현
- [ ] 모바일 반응형 최적화

## 🚨 중요 사항

- **RLS 비활성화**: 현재 RLS가 비활성화되어 있어 모든 데이터에 접근 가능
- **비밀번호 보안**: 예약 비밀번호는 bcrypt로 해싱되어 저장
- **시간 중복 방지**: GIST 제약조건으로 데이터베이스 레벨에서 중복 예약 방지
- **타입 안전성**: 모든 데이터베이스 작업은 TypeScript 타입으로 보호됨
