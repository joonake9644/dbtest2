'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface RoomForm { id?: string; name: string; location: string; capacity: number }

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [form, setForm] = useState<RoomForm>({ name: '', location: '', capacity: 4 });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/rooms');
    const json = await res.json();
    setLoading(false);
    if (res.status === 401) {
      setUnauthorized(true);
      return;
    }
    if (!res.ok) return alert(json.error || '불러오기 실패');
    setRooms(json.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('meeting_rooms:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_rooms' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const submit = async () => {
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/rooms', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || '저장 실패');
    setForm({ name: '', location: '', capacity: 4 });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('삭제하시겠습니까? 관련 예약이 함께 삭제됩니다.')) return;
    const res = await fetch('/api/admin/rooms?id=' + id, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) return alert(json.error || '삭제 실패');
    load();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">관리자 - 회의실 관리</h1>
      {unauthorized && (
        <Card className="p-4 text-sm">
          관리자 권한이 필요합니다. <a className="underline" href="/admin/login">로그인 페이지로 이동</a>
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <h2 className="font-medium">회의실 생성/수정</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="room-name">이름</Label>
            <Input id="room-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="room-location">위치</Label>
            <Input id="room-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="room-capacity">수용 인원</Label>
            <Input id="room-capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value || 0) })} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={submit} data-testid="submit-button">{form.id ? '수정' : '생성'}</Button>
          {form.id && <Button variant="secondary" onClick={() => setForm({ name: '', location: '', capacity: 4 })}>취소</Button>}
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
                  <div className="text-muted-foreground">{r.location} · {r.capacity}인</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setForm({ id: r.id, name: r.name, location: r.location, capacity: r.capacity })}>수정</Button>
                  <Button variant="destructive" onClick={() => remove(r.id)}>삭제</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
