import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyReservationsClientPage from './client-page'; // Changed import
import * as reservationService from '@/lib/services/reservations';
import { vi } from 'vitest';
import type { UserSession } from '@/types';

// Mocks
vi.mock('@/lib/services/reservations');
const mockedGetMyReservations = vi.mocked(reservationService.getMyReservations);
const mockedCancelReservation = vi.mocked(reservationService.cancelReservation);

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock session data
const mockSession: UserSession = {
  userId: 'user-123',
  name: '홍길동',
};

describe('MyReservationsClientPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display reservations for the logged-in user', async () => {
    const mockReservations = [
      {
        id: '1',
        room_id: 'room-1',
        reservation_date: '2025-09-20',
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'active',
        room: { name: '대회의실', location: '본관 3층' },
      },
      {
        id: '2',
        room_id: 'room-2',
        reservation_date: '2025-09-21',
        start_time: '14:00:00',
        end_time: '15:00:00',
        status: 'cancelled',
        room: { name: '소회의실', location: '본관 2층' },
      },
    ];
    mockedGetMyReservations.mockResolvedValue({ success: true, data: mockReservations });

    render(<MyReservationsClientPage session={mockSession} />);

    // The component now fetches data on mount, so we just wait for the result
    await waitFor(() => {
      expect(screen.getByText('2025-09-20 · 10:00–11:00')).toBeInTheDocument();
      expect(screen.getByText('2025-09-21 · 14:00–15:00')).toBeInTheDocument();
    });

    expect(screen.getByText(/대회의실/)).toBeInTheDocument();
    expect(screen.getByText(/소회의실/)).toBeInTheDocument();
    expect(mockedGetMyReservations).toHaveBeenCalledTimes(1);
  });

  it('should show empty state when no reservations are found', async () => {
    mockedGetMyReservations.mockResolvedValue({ success: true, data: [] });

    render(<MyReservationsClientPage session={mockSession} />);

    await waitFor(() => {
      expect(screen.getByText('예약 내역이 없습니다.')).toBeInTheDocument();
    });
  });

  it('should call cancelReservation when the cancel button is clicked', async () => {
    const mockReservations = [
      {
        id: 'res-1',
        room_id: 'room-1',
        reservation_date: '2025-09-20',
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'active',
        room: { name: '대회의실', location: '본관 3층' },
      },
    ];
    // Mock the initial fetch and the fetch after cancellation
    mockedGetMyReservations
      .mockResolvedValueOnce({ success: true, data: mockReservations })
      .mockResolvedValueOnce({ success: true, data: [] });
      
    mockedCancelReservation.mockResolvedValue({ success: true });

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    render(<MyReservationsClientPage session={mockSession} />);

    const cancelButton = await screen.findByRole('button', { name: '취소' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockedCancelReservation).toHaveBeenCalledWith('res-1');
    });
    
    expect(mockToast).toHaveBeenCalledWith({ description: '예약이 취소되었습니다.' });
    
    // Check if the list is updated
    await waitFor(() => {
        expect(screen.getByText('예약 내역이 없습니다.')).toBeInTheDocument();
    });
  });
});