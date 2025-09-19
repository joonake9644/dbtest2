import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyReservationsPage from './page';
import * as reservationService from '@/lib/services/reservations';
import * as roomService from '@/lib/services/rooms';
import { vi } from 'vitest';

vi.mock('@/lib/services/reservations');
vi.mock('@/lib/services/rooms');

const mockedGetMyReservations = vi.mocked(reservationService.getMyReservations);
const mockedCancelReservation = vi.mocked(reservationService.cancelReservation);
const mockedGetRooms = vi.mocked(roomService.getRooms);

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const sampleRooms = [
  { id: 'room-1', name: '대회의실', location: '본관 3층', capacity: 12, created_at: '', updated_at: '' },
  { id: 'room-2', name: '소회의실', location: '본관 2층', capacity: 6, created_at: '', updated_at: '' },
];

describe('MyReservationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRooms.mockResolvedValue(sampleRooms);
  });

  it('should display reservations when correct credentials are provided', async () => {
    const mockReservations = [
      {
        id: '1',
        room_id: 'room-1',
        reservation_date: '2025-09-20',
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'active',
        reserver_name: '홍길동',
        reserver_phone: '010-1234-5678',
      },
      {
        id: '2',
        room_id: 'room-2',
        reservation_date: '2025-09-21',
        start_time: '14:00:00',
        end_time: '15:00:00',
        status: 'cancelled',
        reserver_name: '이몽룡',
        reserver_phone: '010-0000-0000',
      },
    ];
    mockedGetMyReservations.mockResolvedValue({ success: true, data: mockReservations });

    render(<MyReservationsPage />);

    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    await waitFor(() => {
      expect(screen.getByText('2025-09-20 · 10:00~11:00')).toBeInTheDocument();
      expect(screen.getByText('2025-09-21 · 14:00~15:00')).toBeInTheDocument();
    });

    expect(screen.getByText(/대회의실/)).toBeInTheDocument();
    expect(screen.getByText(/소회의실/)).toBeInTheDocument();
    expect(mockedGetMyReservations).toHaveBeenCalledWith('010-1234-5678', 'password123');
  });

  it('should show empty state when no reservations are found', async () => {
    mockedGetMyReservations.mockResolvedValue({ success: true, data: [] });

    render(<MyReservationsPage />);

    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    await waitFor(() => {
      expect(screen.getByText('조회된 예약이 없습니다.')).toBeInTheDocument();
    });
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('should call cancelReservation when the cancel button is clicked', async () => {
    const mockReservations = [
      {
        id: '1',
        room_id: 'room-1',
        reservation_date: '2025-09-20',
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'active',
        reserver_name: '홍길동',
        reserver_phone: '010-1234-5678',
      },
    ];
    mockedGetMyReservations.mockResolvedValueOnce({ success: true, data: mockReservations });
    mockedGetMyReservations.mockResolvedValueOnce({ success: true, data: [] });
    mockedCancelReservation.mockResolvedValue({ success: true });

    render(<MyReservationsPage />);

    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678 ' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123 ' } });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    const cancelButton = await screen.findByRole('button', { name: '취소' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockedCancelReservation).toHaveBeenCalledWith('1', '010-1234-5678', 'password123');
    });
    expect(mockToast).toHaveBeenCalledWith({ description: '예약이 취소되었습니다.' });
  });
});
