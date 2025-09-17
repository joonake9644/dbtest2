import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginPage from './page';
import { vi } from 'vitest';

// Mock global fetch
global.fetch = vi.fn();

// Mock window.location
const originalLocation = window.location as any;
Object.defineProperty(window, 'location', {
  configurable: true,
  value: { ...originalLocation, href: '' },
});

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.location as any).href = '';
  });

  it('redirects to /admin on successful login', async () => {
    (fetch as unknown as vi.Mock).mockResolvedValueOnce({ ok: true });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'joonake' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/auth', expect.any(Object));
    });
    await waitFor(() => {
      expect((window.location as any).href).toBe('/admin');
    });
  });

  it('shows error message on failed login', async () => {
    (fetch as unknown as vi.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }),
    });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('아이디 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument();
    });
    expect((window.location as any).href).not.toBe('/admin');
  });
});

