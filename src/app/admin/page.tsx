'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface RoomForm {
  id?: string;
  name: string;
  location: string;
  capacity: number;
}

type JsonCapableResponse = Response & {
  json?: () => Promise<any>;
  text?: () => Promise<string>;
  clone?: () => Response;
};

type SupabaseClient = ReturnType<typeof createClient>;
type RealtimeChannel = ReturnType<SupabaseClient['channel']>;

function safeAlert(message: string) {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  } else {
    console.error(message);
  }
}

function safeConfirm(message: string) {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return window.confirm(message);
  }
  console.warn(message);
  return true;
}

async function readJson<T = unknown>(res: JsonCapableResponse): Promise<T | null> {
  const cloned = typeof res.clone === 'function' ? res.clone() : null;

  if (typeof res.json === 'function') {
    try {
      return (await res.json()) as T;
    } catch {
      if (cloned && typeof cloned.text === 'function') {
        const fallback = await cloned.text();
        if (!fallback) {
          return null;
        }
        try {
          return JSON.parse(fallback) as T;
        } catch {
          throw new Error('Invalid JSON response');
        }
      }
      return null;
    }
  }

  if (typeof res.text === 'function') {
    const text = await res.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Invalid JSON response');
    }
  }

  return null;
}

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [form, setForm] = useState<RoomForm>({ name: '', location: '', capacity: 4 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rooms', { cache: 'no-store' });
      const json = await readJson<{ data?: any[]; error?: string }>(res);

      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }

      if (!res.ok) {
        safeAlert(json?.error || '회의실 목록을 불러오지 못했습니다.');
        return;
      }

      setUnauthorized(false);
      setRooms(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error('Failed to load rooms', error);
      safeAlert('회의실 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let client: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;

    try {
      client = createClient();
    } catch (error) {
      console.warn('Supabase realtime is not configured; skipping subscription.', error);
      return;
    }

    channel = client
      .channel('meeting_rooms:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_rooms' }, () => {
        void load();
      })
      .subscribe();

    return () => {
      if (channel) {
        client?.removeChannel(channel);
      }
    };
  }, [load]);

  const submit = async () => {
    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/rooms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await readJson<{ data?: any; error?: string }>(res);

      if (!res.ok) {
        safeAlert(json?.error || '회의실 정보를 저장하지 못했습니다.');
        return;
      }

      const payload = json?.data;
      if (payload) {
        setRooms((prev) => {
          if (form.id) {
            return prev.map((room) => (room.id === payload.id ? payload : room));
          }
          return [...prev, payload];
        });
      }

      setForm({ name: '', location: '', capacity: 4 });
      await load();
    } catch (error) {
      console.error('Failed to submit room form', error);
      safeAlert('회의실 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const remove = async (id: string) => {
    if (!safeConfirm('삭제하시겠습니까? 관련 예약도 함께 삭제됩니다.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/rooms?id=${id}`, { method: 'DELETE' });
      const json = await readJson<{ error?: string }>(res);

      if (!res.ok) {
        safeAlert(json?.error || '회의실 삭제에 실패했습니다.');
        return;
      }

      setRooms((prev) => prev.filter((room) => room.id !== id));
      await load();
    } catch (error) {
      console.error('Failed to delete room', error);
      safeAlert('회의실 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const logout = async () => {
    try {
      const res = await fetch('/api/admin/auth', { method: 'DELETE' });
      if (res.ok) {
        setUnauthorized(true);
      }
    } catch (error) {
      console.error('Failed to logout', error);
      safeAlert('로그아웃에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Room Management</h2>
        {!unauthorized && (
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        )}
      </div>
      {unauthorized && (
        <Card className="p-4 text-sm">
          관리자 권한이 필요합니다.{` `}
          <a className="underline" href="/admin/login">
            로그인 페이지로 이동
          </a>
        </Card>
      )}

      {!unauthorized && (
        <>
          <Card className="p-4 space-y-3">
            <h2 className="font-medium">회의실 생성/수정</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="room-name">이름</Label>
                <Input
                  id="room-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="room-location">위치</Label>
                <Input
                  id="room-location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="room-capacity">수용 인원</Label>
                <Input
                  id="room-capacity"
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value || 0) })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} data-testid="submit-button">
                {form.id ? '수정' : '생성'}
              </Button>
              {form.id && (
                <Button
                  variant="secondary"
                  onClick={() => setForm({ name: '', location: '', capacity: 4 })}
                >
                  취소
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="font-medium">회의실 목록</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : unauthorized ? (
              <p className="text-sm text-muted-foreground">권한이 없습니다.</p>
            ) : (
              <ul className="divide-y">
                {rooms.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between py-2">
                    <div className="text-sm">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-muted-foreground">
                        {r.location} · {r.capacity}인
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setForm({
                            id: r.id,
                            name: r.name,
                            location: r.location,
                            capacity: r.capacity,
                          })
                        }
                      >
                        수정
                      </Button>
                      <Button variant="destructive" onClick={() => remove(r.id)}>
                        삭제
                      </Button>
                    </div>
                  </li>
                ))}
                {rooms.length === 0 && (
                  <li className="py-4 text-sm text-muted-foreground">
                    등록된 회의실이 없습니다.
                  </li>
                )}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

