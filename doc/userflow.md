회의실 관리 시스템 유저플로우
개요
본 문서는 Next.js + Supabase + Vercel 스택을 사용한 회의실 관리 시스템의 핵심 유저플로우를 정의합니다. 시스템은 관리자(회의실 CRUD)와 사용자(예약 및 조회) 기능으로 구분됩니다.

1. 회의실 예약 (사용자)
입력 (사용자 상호작용)
전체 예약 현황 페이지 접근
회의실별 예약 현황 확인 (날짜별, 시간대별 예약 상태 조회)
특정 회의실의 "예약하기" 버튼 클릭
예약 모달/페이지에서 날짜 선택
사용 가능한 시간대 중 원하는 시간 선택
예약자 정보 입력 (이름, 휴대폰번호, 비밀번호)
예약 확인 버튼 클릭
처리 (시스템 내부 로직)
전체 회의실 예약 현황 데이터 조회 및 표시
실시간 예약 상태 업데이트
선택한 회의실의 해당 날짜/시간 예약 가능 여부 재확인
입력 데이터 유효성 검증 (필수 필드, 휴대폰번호 형식 등)
동시성 처리 (다른 사용자가 같은 시간 예약 시도 시)
예약 데이터 데이터베이스 저장
전체 예약 현황 페이지 데이터 갱신
출력 (사용자 피드백)
초기 진입: 모든 회의실의 예약 현황 시각적 표시 (달력/그리드 형태)
예약 진행: 선택한 회의실 정보 및 사용 가능 시간 표시
성공 시: 예약 완료 메시지, 업데이트된 전체 예약 현황 표시
실패 시: 구체적인 오류 메시지, 전체 현황 페이지로 복귀
내 예약 조회 페이지로의 이동 옵션 제공
엣지케이스 대응
페이지 로딩 중 다른 사용자의 예약으로 인한 현황 변경
예약 진행 중 다른 사용자가 같은 시간 예약 완료 시
네트워크 오류로 인한 중복 제출 방지
전체 현황 페이지에서 실시간 데이터 동기화 오류 처리
2. 내 예약 조회 (사용자)
입력 (사용자 상호작용)
내 예약 조회 페이지 접근
휴대폰번호 입력
비밀번호 입력
조회 버튼 클릭
(조회 후) 특정 예약 선택하여 상세 정보 확인
(선택적) 예약 취소 버튼 클릭
처리 (시스템 내부 로직)
입력된 휴대폰번호 형식 유효성 검증
휴대폰번호와 비밀번호 조합으로 예약 데이터 조회
해당 휴대폰번호로 등록된 모든 예약 내역 검색
비밀번호 매칭 확인 (각 예약별로)
조회된 예약 데이터 정렬 (최신순 또는 예약 시간순)
(예약 취소 시) 취소 가능 시간 확인 및 상태 업데이트
출력 (사용자 피드백)
성공 시: 매칭된 예약 목록 표시 (회의실명, 예약일시, 예약자명, 상태)
예약 없음: "해당 정보로 등록된 예약이 없습니다" 메시지
인증 실패: "입력하신 정보와 일치하는 예약이 없습니다" 메시지
예약 상세: 선택한 예약의 모든 정보 표시
취소 완료: 취소 확인 메시지 및 업데이트된 예약 목록
엣지케이스 대응
잘못된 휴대폰번호 형식 입력
존재하지 않는 휴대폰번호 입력
올바른 휴대폰번호이지만 잘못된 비밀번호
동일 휴대폰번호로 여러 예약이 있지만 각기 다른 비밀번호
이미 지난 예약에 대한 취소 시도
네트워크 오류로 인한 조회 실패
3. 관리자 - 회의실 등록
입력 (사용자 상호작용)
관리자 페이지 접근
"새 회의실 등록" 버튼 클릭
회의실 정보 입력
회의실 이름 입력
회의실 위치 입력
수용 가능 인원수 입력
등록 버튼 클릭
처리 (시스템 내부 로직)
관리자 권한 확인 (세션 또는 인증 토큰 검증)
입력 데이터 유효성 검증
회의실 이름 중복 확인
필수 필드 입력 확인
수용 인원 숫자 형식 확인
회의실 데이터 데이터베이스 저장
회의실 고유 ID 생성
관리자 회의실 목록 데이터 갱신
출력 (사용자 피드백)
성공 시: "회의실이 성공적으로 등록되었습니다" 메시지
중복 오류: "이미 존재하는 회의실 이름입니다" 메시지
입력 오류: 구체적인 필드별 오류 메시지 표시
권한 오류: "관리자 권한이 필요합니다" 메시지
등록된 회의실이 포함된 전체 회의실 목록으로 이동
방금 등록된 회의실 하이라이트 표시
엣지케이스 대응
관리자 권한 없는 사용자의 접근 시도
회의실 이름 중복 (대소문자, 공백 포함 유사성 검사)
특수문자나 너무 긴 이름 입력
수용 인원에 음수나 0, 비현실적으로 큰 숫자 입력
네트워크 오류로 인한 중복 등록 방지
필수 필드 누락 상태에서 등록 시도
4. 관리자 - 회의실 수정
입력 (사용자 상호작용)
관리자 페이지의 회의실 목록에서 특정 회의실 선택
"수정" 버튼 클릭
수정 모달/페이지에서 기존 정보 확인
수정할 필드 변경
회의실 이름 수정
회의실 위치 수정
수용 가능 인원수 수정
"수정 완료" 버튼 클릭
처리 (시스템 내부 로직)
관리자 권한 확인
수정 대상 회의실 존재 여부 확인
변경된 데이터 유효성 검증
회의실 이름 중복 확인 (다른 회의실과)
해당 회의실에 기존 예약이 있는지 확인
데이터베이스 업데이트 실행
관리자 회의실 목록 데이터 갱신
출력 (사용자 피드백)
성공 시: "회의실 정보가 성공적으로 수정되었습니다" 메시지
중복 오류: "이미 존재하는 회의실 이름입니다" 메시지
기존 예약 주의: "기존 예약에 영향을 줄 수 있습니다" 경고
수정된 회의실이 포함된 전체 목록으로 이동
수정된 회의실 하이라이트 표시
엣지케이스 대응
수정 중 다른 관리자가 동일 회의실 수정 시도
회의실에 활성 예약이 있을 때 중요 정보(위치, 인원) 수정
존재하지 않는 회의실 ID로 수정 시도
권한 없는 사용자의 접근
5. 관리자 - 회의실 삭제
입력 (사용자 상호작용)
관리자 페이지의 회의실 목록에서 특정 회의실 선택
"삭제" 버튼 클릭
삭제 확인 다이얼로그에서 "확인" 클릭
(기존 예약이 있을 경우) 추가 확인 메시지에서 "강제 삭제" 선택
처리 (시스템 내부 로직)
관리자 권한 확인
삭제 대상 회의실 존재 여부 확인
해당 회의실의 기존 예약 현황 조회
예약이 있는 경우 관리자에게 경고 및 선택권 제공
관련 예약 데이터 처리 (삭제 또는 상태 변경)
회의실 데이터 데이터베이스에서 삭제
관리자 회의실 목록 데이터 갱신
출력 (사용자 피드백)
예약 없음: "회의실이 성공적으로 삭제되었습니다" 메시지
기존 예약 존재: "X건의 예약이 있습니다. 정말 삭제하시겠습니까?" 경고
삭제 완료: 관련 예약 처리 결과와 함께 완료 메시지
삭제 취소: "삭제가 취소되었습니다" 메시지
업데이트된 회의실 목록 표시
엣지케이스 대응
삭제 중 해당 회의실에 새로운 예약 생성 시도
존재하지 않는 회의실 ID로 삭제 시도
삭제 과정에서 네트워크 오류 발생
다른 관리자가 동시에 같은 회의실 삭제 시도
권한 없는 사용자의 삭제 시도
기술적 고려사항
Next.js + Supabase + Vercel 스택 사용
실시간 데이터 동기화 (Supabase Realtime 활용)
모던하고 심플한 UI/UX 디자인 (Apple 스타일)
동시성 처리 및 데이터 일관성 보장
오버 엔지니어링 방지, 기본에 충실한 MVP 구현


6. 데이터 스키마

데이터플로우 (간략)
확정된 유저플로우를 기반으로 데이터베이스 관점의 데이터 흐름을 정리하면:

1. 회의실 데이터 흐름
생성: 관리자 → 회의실 테이블
조회: 사용자/관리자 → 회의실 테이블
수정: 관리자 → 회의실 테이블 (기존 예약 확인 필요)
삭제: 관리자 → 예약 테이블 확인 → 회의실 테이블 삭제
2. 예약 데이터 흐름
생성: 사용자 입력 → 중복 시간 확인 → 예약 테이블
조회: 휴대폰번호+비밀번호 → 예약 테이블 필터링
전체 현황: 회의실 테이블 + 예약 테이블 조인
취소: 예약 ID → 예약 테이블 상태 업데이트
3. 실시간 동기화
예약 생성/취소 → 전체 현황 페이지 업데이트
회의실 수정/삭제 → 관련 예약 데이터 처리
PostgreSQL 데이터베이스 스키마
유저플로우에서 명시된 데이터만을 포함한 최소 스펙 스키마:

테이블 1: meeting_rooms (회의실)

sql
CREATE TABLE meeting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
테이블 2: reservations (예약)

sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reserver_name VARCHAR(50) NOT NULL,
    reserver_phone VARCHAR(20) NOT NULL,
    reserver_password VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 동일 회의실, 동일 날짜의 시간 중복 방지
    CONSTRAINT no_overlapping_reservations 
    EXCLUDE USING GIST (
        room_id WITH =,
        reservation_date WITH =,
        tsrange(start_time::text, end_time::text) WITH &&
    ) WHERE (status = 'active')
);
인덱스 (성능 최적화)

sql
-- 예약 조회 성능 향상 (휴대폰번호 기반 조회)
CREATE INDEX idx_reservations_phone ON reservations(reserver_phone);

-- 전체 예약 현황 조회 성능 향상
CREATE INDEX idx_reservations_date_room ON reservations(reservation_date, room_id, status);

-- 회의실명 검색 성능 향상
CREATE INDEX idx_meeting_rooms_name ON meeting_rooms(name);
이 스키마가 유저플로우의 모든 요구사항을 충족하는지 확인해 주세요. 특히 시간 중복 방지 제약조건과 필요한 필드들이 적절한지 검토 부탁드립니다.



4. 데이터베이스 설계
회의실 관리 시스템 데이터베이스 설계
개요
Next.js + Supabase(PostgreSQL) + Vercel 스택을 사용한 회의실 관리 시스템의 데이터베이스 설계 문서입니다. 최소 스펙의 MVP 구현을 위한 데이터플로우와 스키마를 정의합니다.

데이터플로우
1. 회의실 데이터 흐름
1.1 회의실 등록 (관리자)
관리자 입력 → 유효성 검증 → 중복 확인 → meeting_rooms 테이블 INSERT
1.2 회의실 조회 (전체)
사용자/관리자 요청 → meeting_rooms 테이블 SELECT → 결과 반환
1.3 회의실 수정 (관리자)
관리자 입력 → 권한 확인 → 기존 예약 확인 → meeting_rooms 테이블 UPDATE
1.4 회의실 삭제 (관리자)
관리자 요청 → 권한 확인 → reservations 테이블 확인 → 경고/확인 → meeting_rooms 테이블 DELETE
2. 예약 데이터 흐름
2.1 예약 현황 조회
사용자 요청 → meeting_rooms + reservations 테이블 JOIN → 시간대별 예약 상태 반환
2.2 예약 생성
사용자 입력 → 시간 중복 확인 → 유효성 검증 → reservations 테이블 INSERT → 현황 업데이트
2.3 내 예약 조회
휴대폰번호+비밀번호 입력 → reservations 테이블 WHERE 조건 필터링 → 결과 반환
2.4 예약 취소
예약 ID + 인증 → 취소 가능 시간 확인 → reservations 테이블 status UPDATE
3. 실시간 동기화 흐름
데이터 변경 이벤트 → Supabase Realtime → 클라이언트 실시간 업데이트
데이터베이스 스키마
테이블 구조
1. meeting_rooms (회의실 정보)
CREATE TABLE meeting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
필드 설명:

id: 회의실 고유 식별자 (UUID)
name: 회의실 이름 (중복 불가)
location: 회의실 위치
capacity: 수용 가능 인원수 (양수)
created_at: 생성 일시
updated_at: 수정 일시
2. reservations (예약 정보)
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reserver_name VARCHAR(50) NOT NULL,
    reserver_phone VARCHAR(20) NOT NULL,
    reserver_password VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 동일 회의실, 동일 날짜의 시간 중복 방지
    CONSTRAINT no_overlapping_reservations 
    EXCLUDE USING GIST (
        room_id WITH =,
        reservation_date WITH =,
        tsrange(start_time::text, end_time::text) WITH &&
    ) WHERE (status = 'active')
);
필드 설명:

id: 예약 고유 식별자 (UUID)
room_id: 회의실 참조 (외래키, CASCADE 삭제)
reservation_date: 예약 날짜
start_time: 시작 시간
end_time: 종료 시간
reserver_name: 예약자 이름
reserver_phone: 예약자 휴대폰번호 (조회 키)
reserver_password: 예약 비밀번호 (조회 인증)
status: 예약 상태 (active, cancelled)
created_at: 예약 생성 일시
updated_at: 예약 수정 일시
제약 조건
1. 시간 중복 방지
CONSTRAINT no_overlapping_reservations 
EXCLUDE USING GIST (
    room_id WITH =,
    reservation_date WITH =,
    tsrange(start_time::text, end_time::text) WITH &&
) WHERE (status = 'active')
동일 회의실, 동일 날짜에서 활성 예약 시간 겹침 방지
취소된 예약은 제약에서 제외
2. 참조 무결성
room_id UUID NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE
회의실 삭제 시 관련 예약도 함께 삭제
성능 최적화 인덱스
1. 예약 조회 최적화
-- 휴대폰번호 기반 예약 조회
CREATE INDEX idx_reservations_phone ON reservations(reserver_phone);

-- 날짜별 예약 현황 조회
CREATE INDEX idx_reservations_date_room ON reservations(reservation_date, room_id, status);
2. 회의실 조회 최적화
-- 회의실명 검색
CREATE INDEX idx_meeting_rooms_name ON meeting_rooms(name);
주요 쿼리 패턴
1. 전체 예약 현황 조회
SELECT 
    mr.id, mr.name, mr.location, mr.capacity,
    r.reservation_date, r.start_time, r.end_time, r.status
FROM meeting_rooms mr
LEFT JOIN reservations r ON mr.id = r.room_id 
WHERE r.reservation_date = $1 AND r.status = 'active'
ORDER BY mr.name, r.start_time;
2. 내 예약 조회
SELECT 
    r.id, mr.name, mr.location, 
    r.reservation_date, r.start_time, r.end_time, r.status
FROM reservations r
JOIN meeting_rooms mr ON r.room_id = mr.id
WHERE r.reserver_phone = $1 AND r.reserver_password = $2
ORDER BY r.reservation_date DESC, r.start_time DESC;
3. 예약 시간 중복 확인
SELECT COUNT(*) FROM reservations 
WHERE room_id = $1 
AND reservation_date = $2 
AND status = 'active'
AND tsrange($3::text, $4::text) && tsrange(start_time::text, end_time::text);
데이터 무결성 보장
1. 동시성 제어
PostgreSQL의 GIST 인덱스를 활용한 시간 범위 겹침 방지
트랜잭션 레벨에서 예약 중복 방지
2. 데이터 일관성
외래키 제약을 통한 참조 무결성 보장
CHECK 제약을 통한 유효한 데이터 값 보장
3. 실시간 동기화
Supabase Realtime을 활용한 실시간 데이터 동기화
클라이언트 측에서 즉시 UI 업데이트
확장성 고려사항
1. 파티셔닝 (필요시)
예약 테이블을 날짜별로 파티셔닝 (대용량 데이터 시)
2. 아카이브 전략 (필요시)
과거 예약 데이터의 별도 테이블 보관
3. 캐싱 전략 (필요시)
회의실 정보는 클라이언트 캐싱
당일 예약 현황은 실시간 조회
RLS 정책 (비활성화)
요구사항에 따라 Row Level Security는 비활성화하여 단순한 구조로 유지합니다.

ALTER TABLE meeting_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;






