-- 1. 확장 활성화 (btree_gist)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. 테이블 생성 (meeting_rooms, reservations)
CREATE TABLE IF NOT EXISTS meeting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 제약조건 추가 (GIST)
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_reservations
EXCLUDE USING GIST (
    room_id WITH =,
    reservation_date WITH =,
    tsrange(
        (reservation_date::timestamp + start_time),
        (reservation_date::timestamp + end_time)
    ) WITH &&
) WHERE (status = 'active');

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(reserver_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_date_room ON reservations(reservation_date, room_id, status);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_name ON meeting_rooms(name);

-- 5. RLS 비활성화
ALTER TABLE meeting_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- 6. 트리거 함수 생성 (updated_at 자동화)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meeting_rooms_updated_at
    BEFORE UPDATE ON meeting_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. PostgreSQL 함수 생성 (중복 확인)
CREATE OR REPLACE FUNCTION check_time_conflict(
    p_room_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM reservations 
        WHERE room_id = p_room_id 
        AND reservation_date = p_date 
        AND status = 'active'
        AND tsrange(
                (p_date::timestamp + p_start_time),
                (p_date::timestamp + p_end_time)
            ) && tsrange(
                (reservation_date::timestamp + start_time),
                (reservation_date::timestamp + end_time)
            )
    );
END;
$$ LANGUAGE plpgsql;

-- 8. 더미 데이터 삽입
INSERT INTO meeting_rooms (name, location, capacity) VALUES
('휴게실 A', '1층 동쪽', 4),
('휴게실 B', '1층 서쪽', 6),
('휴게실 C', '2층 중앙', 8),
('휴게실 D', '2층 북쪽', 4),
('휴게실 E', '3층 남쪽', 10)
ON CONFLICT (name) DO NOTHING;
