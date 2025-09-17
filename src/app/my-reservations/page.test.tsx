import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyReservationsPage from './page';
import * as reservationService from '@/lib/services/reservations';
import { vi } from 'vitest';

// Mock the services
vi.mock('@/lib/services/reservations');
const mockedGetMyReservations = vi.mocked(reservationService.getMyReservations);
const mockedCancelReservation = vi.mocked(reservationService.cancelReservation);

// Mock the useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('MyReservationsPage', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
  });

  it('should display reservations when correct credentials are provided', async () => {
    // Arrange
    const mockReservations = [
      { id: '1', reservation_date: '2025-09-20', start_time: '10:00:00', end_time: '11:00:00', status: 'active' },
      { id: '2', reservation_date: '2025-09-21', start_time: '14:00:00', end_time: '15:00:00', status: 'cancelled' },
    ];
    mockedGetMyReservations.mockResolvedValue({ success: true, data: mockReservations });

    render(<MyReservationsPage />);

    // Act
    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('2025-09-20 · 10:00~11:00')).toBeInTheDocument();
    });
    expect(screen.getByText('총 2건')).toBeInTheDocument();
  });

  it('should show a toast message when no reservations are found', async () => {
    // Arrange
    mockedGetMyReservations.mockResolvedValue({ success: true, data: [] });

    render(<MyReservationsPage />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    // Assert
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({ description: '예약 내역이 없습니다.' });
    });
  });

  it('should call cancelReservation when the cancel button is clicked', async () => {
    // Arrange
    const mockReservations = [
      { id: '1', reservation_date: '2025-09-20', start_time: '10:00:00', end_time: '11:00:00', status: 'active' },
    ];
    mockedGetMyReservations.mockResolvedValue({ success: true, data: mockReservations });
    // Mock the cancel function to return success, and get to re-fetch
    mockedCancelReservation.mockResolvedValue({ success: true });

    render(<MyReservationsPage />);

    // Act: First, search for the reservation
    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    // Wait for the reservation to appear and then click cancel
    const cancelButton = await screen.findByRole('button', { name: '취소' });
    fireEvent.click(cancelButton);

    // Assert
    await waitFor(() => {
      expect(mockedCancelReservation).toHaveBeenCalledWith('1', '010-1234-5678', 'password123');
    });
    // Check if toast is shown
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({ description: '예약이 취소되었습니다.' });
    });
  });
});