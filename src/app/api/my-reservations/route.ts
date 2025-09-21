import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

interface LegacyLookupInput {
  phone: string;
  password: string;
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

const FUNCTION_NOT_FOUND = 'PGRST202';
const COLUMN_NOT_FOUND = '42703';

type RoomInfo = {
  name: string | null;
  location: string | null;
  capacity: number | null;
};

function isFunctionMissing(error?: SupabaseError | null) {
  return error?.code === FUNCTION_NOT_FOUND;
}

function isColumnMissing(error?: SupabaseError | null) {
  return error?.code === COLUMN_NOT_FOUND;
}

function normalizeStatus(input?: string | null): 'active' | 'cancelled' | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (['전체', 'all', 'any', '전체보기'].includes(trimmed) || ['all', 'any'].includes(lowered)) {
    return null;
  }
  if (['active', '예약중', '예약완료', 'confirmed', '진행중'].includes(lowered) || trimmed === '예약중') {
    return 'active';
  }
  if (['cancelled', 'canceled', '취소', 'cancel'].includes(lowered) || trimmed === '취소') {
    return 'cancelled';
  }
  return null;
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function sanitizeReservation(record: any, roomMap?: Record<string, RoomInfo>) {
  const directRoom = record.room ?? record.meeting_rooms ?? null;
  const mappedRoom = roomMap?.[record.room_id ?? record.roomId ?? ''];
  const finalRoom = mappedRoom ?? (directRoom
    ? {
        name: directRoom.name ?? null,
        location: directRoom.location ?? null,
        capacity: typeof directRoom.capacity === 'number' ? directRoom.capacity : directRoom.capacity ?? null,
      }
    : null);

  return {
    id: record.id,
    room_id: record.room_id,
    reservation_date: record.reservation_date,
    start_time: record.start_time,
    end_time: record.end_time,
    reserver_name: record.reserver_name,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    room: finalRoom ?? null,
  };
}

async function loadRoomMap(supabase: ReturnType<typeof createServiceClient>, reservations: any[]) {
  const roomIds = Array.from(new Set(reservations.map((r) => r.room_id).filter(Boolean)));
  if (roomIds.length === 0) {
    return {} as Record<string, RoomInfo>;
  }
  const { data, error } = await supabase
    .from('meeting_rooms')
    .select('id,name,location,capacity')
    .in('id', roomIds);
  if (error) {
    throw error;
  }
  const map: Record<string, RoomInfo> = {};
  (data ?? []).forEach((room: any) => {
    map[room.id] = {
      name: room.name ?? null,
      location: room.location ?? null,
      capacity: typeof room.capacity === 'number' ? room.capacity : room.capacity ?? null,
    };
  });
  return map;
}

async function callHashedLookup(
  supabase: ReturnType<typeof createServiceClient>,
  phone: string,
  password: string
): Promise<any[] | null> {
  const { data, error } = await supabase.rpc('get_my_reservations', {
    p_phone: phone,
    p_password: password,
  });
  if (!error) {
    return Array.isArray(data) ? data : [];
  }
  if (isFunctionMissing(error) || isColumnMissing(error)) {
    return null;
  }
  throw error;
}

async function legacyLookup(input: LegacyLookupInput) {
  const phone = input.phone?.trim();
  const password = input.password?.trim();
  if (!phone || !password) {
    return { error: '전화번호와 비밀번호를 모두 입력해주세요.', status: 400 } as const;
  }

  const status = normalizeStatus(input.status ?? null);
  const fromDate = normalizeDate(input.fromDate ?? null);
  const toDate = normalizeDate(input.toDate ?? null);

  const supabase = createServiceClient();

  let reservations: any[] | null = null;
  try {
    reservations = await callHashedLookup(supabase, phone, password);
  } catch (rpcError: any) {
    console.error('[api/my-reservations] RPC get_my_reservations error', rpcError);
    return {
      error: rpcError?.message ?? '예약 조회 중 오류가 발생했습니다.',
      status: 500,
    } as const;
  }

  if (reservations !== null) {
    let filtered = reservations;
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    if (fromDate) {
      filtered = filtered.filter((item) => item.reservation_date >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter((item) => item.reservation_date <= toDate);
    }

    try {
      const roomMap = await loadRoomMap(supabase, filtered);
      const sanitized = filtered.map((record) => sanitizeReservation(record, roomMap));
      return { data: sanitized } as const;
    } catch (roomError: any) {
      console.error('[api/my-reservations] meeting_rooms fetch failed', roomError);
      return {
        error: roomError?.message ?? '회의실 정보를 불러오지 못했습니다.',
        status: 500,
      } as const;
    }
  }

  // Legacy schema without hashed passwords: query directly using reserver_password
  let query = supabase
    .from('reservations')
    .select(
      'id, room_id, reservation_date, start_time, end_time, reserver_name, status, created_at, updated_at, meeting_rooms(name,location,capacity)'
    )
    .eq('reserver_phone', phone)
    .eq('reserver_password', password)
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }
  if (fromDate) {
    query = query.gte('reservation_date', fromDate);
  }
  if (toDate) {
    query = query.lte('reservation_date', toDate);
  }

  const { data, error } = await query;
  if (error) {
    if (isColumnMissing(error)) {
      return {
        error: '예약 비밀번호 컬럼을 찾을 수 없습니다. 데이터베이스 마이그레이션 상태를 확인해주세요.',
        status: 500,
      } as const;
    }
    console.error('[api/my-reservations] legacy select error', error);
    return {
      error: error.message ?? '예약 조회 중 오류가 발생했습니다.',
      status: 500,
    } as const;
  }

  const sanitized = (data ?? []).map((record: any) => sanitizeReservation(record));
  return { data: sanitized } as const;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get('phone');
    const password = url.searchParams.get('password');

    if (phone && password) {
      const result = await legacyLookup({
        phone,
        password,
        status: url.searchParams.get('status'),
        fromDate: url.searchParams.get('fromDate') ?? url.searchParams.get('from'),
        toDate: url.searchParams.get('toDate') ?? url.searchParams.get('to'),
      });
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
      }
      return NextResponse.json({ data: result.data });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let session: any = null;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (parseError) {
      console.error('[api/my-reservations] failed to parse session cookie', parseError);
    }

    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: reservations, error } = await supabase.rpc('get_my_reservations_for_user', {
      p_user_id: userId,
    });

    if (error) {
      if (isFunctionMissing(error) || isColumnMissing(error)) {
        return NextResponse.json(
          {
            error:
              '현재 데이터베이스가 계정 기반 조회로 마이그레이션되지 않았습니다. 전화번호/비밀번호 조회를 사용해주세요.',
          },
          { status: 501 }
        );
      }
      console.error('[api/my-reservations] get_my_reservations_for_user error', error);
      return NextResponse.json({ error: error.message ?? 'unexpected error' }, { status: 500 });
    }

    try {
      const roomMap = await loadRoomMap(supabase, reservations ?? []);
      const sanitized = (reservations ?? []).map((record: any) => sanitizeReservation(record, roomMap));
      return NextResponse.json({ data: sanitized });
    } catch (roomError: any) {
      console.error('[api/my-reservations] meeting room lookup failed', roomError);
      return NextResponse.json({ error: roomError?.message ?? '회의실 정보를 불러오지 못했습니다.' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('[api/my-reservations] unexpected GET error', e);
    return NextResponse.json({ error: e?.message ?? 'unexpected error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let payload: any = null;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error('[api/my-reservations] failed to parse POST body', parseError);
    }

    const phone = typeof payload?.phone === 'string' ? payload.phone : typeof payload?.reserver_phone === 'string' ? payload.reserver_phone : '';
    const password =
      typeof payload?.password === 'string'
        ? payload.password
        : typeof payload?.reserver_password === 'string'
        ? payload.reserver_password
        : '';

    if (!phone || !password) {
      return NextResponse.json({ error: '전화번호와 비밀번호를 모두 입력해주세요.' }, { status: 400 });
    }

    const result = await legacyLookup({
      phone,
      password,
      status: payload?.status ?? payload?.state ?? null,
      fromDate: payload?.fromDate ?? payload?.startDate ?? null,
      toDate: payload?.toDate ?? payload?.endDate ?? null,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (e: any) {
    console.error('[api/my-reservations] unexpected POST error', e);
    return NextResponse.json({ error: e?.message ?? 'unexpected error' }, { status: 500 });
  }
}
