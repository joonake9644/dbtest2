import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from './page';
import { vi } from 'vitest';

// Mock global fetch
global.fetch = vi.fn();

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display unauthorized message if fetch returns 401', async () => {
    // Arrange
    (fetch as vi.Mock).mockResolvedValueOnce({ 
      ok: false, 
      status: 401, 
      json: () => Promise.resolve({ error: 'Unauthorized' })
    });
    render(<AdminPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('관리자 권한이 필요합니다.')).toBeInTheDocument();
      expect(screen.getByText('로그인 페이지로 이동')).toHaveAttribute('href', '/admin/login');
    });
  });

  it('should display a list of rooms on successful fetch', async () => {
    // Arrange
    const mockRooms = [
      { id: '1', name: 'Room 1', location: '1F', capacity: 10 },
      { id: '2', name: 'Room 2', location: '2F', capacity: 5 },
    ];
    (fetch as vi.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ data: mockRooms })
    });
    render(<AdminPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Room 1')).toBeInTheDocument();
      expect(screen.getByText('1F · 10인')).toBeInTheDocument();
      expect(screen.getByText('Room 2')).toBeInTheDocument();
      expect(screen.getByText('2F · 5인')).toBeInTheDocument();
    });
  });

  it('should allow creating a new room', async () => {
    // Arrange
    // 1. Initial load is empty
    (fetch as vi.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ data: [] })
    });
    // 2. Mock the POST request for creation
    (fetch as vi.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ data: { id: '3', name: 'New Room', location: '3F', capacity: 8 } })
    });
    // 3. Mock the reload after creation
    const newMockRooms = [{ id: '3', name: 'New Room', location: '3F', capacity: 8 }];
    (fetch as vi.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ data: newMockRooms })
    });

    render(<AdminPage />);

    // Act
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: 'New Room' } });
    fireEvent.change(screen.getByLabelText('위치'), { target: { value: '3F' } });
    fireEvent.change(screen.getByLabelText('수용 인원'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: '생성' }));

    // Assert
    await waitFor(() => {
      // Check if the POST request was made
      expect(fetch).toHaveBeenCalledWith('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Room', location: '3F', capacity: 8 }),
      });
    });

    // Check if the new room is displayed
    await waitFor(() => {
      expect(screen.getByText('New Room')).toBeInTheDocument();
      expect(screen.getByText('3F · 8인')).toBeInTheDocument();
    });
  });
});