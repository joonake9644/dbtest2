import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/lib/auth/admin';

const createSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  capacity: z.number().int().positive(),
});

const updateSchema = createSchema.extend({ id: z.string().uuid() });

function formatServerError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('Supabase URL or key')) {
      return '서버 설정 오류: Supabase 키가 설정되지 않았습니다.';
    }
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

function handleServerError(error: unknown, status = 500) {
  console.error('[api/admin/rooms]', error);
  const message = formatServerError(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from('meeting_rooms').select('*').order('name');
    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (error) {
    return handleServerError(error);
  }
}

export async function POST(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 JSON 본문입니다.' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('meeting_rooms')
      .insert(parsed.data)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleServerError(error);
  }
}

export async function PUT(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 JSON 본문입니다.' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('meeting_rooms')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (error) {
    return handleServerError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('meeting_rooms').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleServerError(error);
  }
}

