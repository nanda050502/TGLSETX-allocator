import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { appStorage } from '../../services/appStorage';

vi.mock('../../services/appStorage', () => ({
  appStorage: {
    login: vi.fn(),
    roomPinLogin: vi.fn(),
  },
}));

function TestComponent() {
  const { user, token, loading, logout, loginAdminOrFaculty, loginWithRoomPin, isAdmin, isFaculty } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.role : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="isAdmin">{isAdmin ? 'true' : 'false'}</div>
      <div data-testid="isFaculty">{isFaculty ? 'true' : 'false'}</div>
      <button onClick={() => act(() => { logout(); })}>Logout</button>
      <button onClick={() => act(() => { loginAdminOrFaculty('admin', 'admin123'); })}>Login Admin</button>
      <button onClick={() => act(() => { loginWithRoomPin('101', '1234', 'John'); })}>Login Room</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with null user if no token', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('loads user from localStorage', () => {
    localStorage.setItem('exam_auth_token', 'test_token');
    localStorage.setItem('exam_auth_user', JSON.stringify({ role: 'ADMIN' }));

    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('ADMIN');
    expect(screen.getByTestId('token').textContent).toBe('test_token');
    expect(screen.getByTestId('isAdmin').textContent).toBe('true');
  });

  it('logs out', () => {
    localStorage.setItem('exam_auth_token', 'test_token');
    localStorage.setItem('exam_auth_user', JSON.stringify({ role: 'ADMIN' }));

    render(<AuthProvider><TestComponent /></AuthProvider>);
    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem('exam_auth_token')).toBeNull();
  });
});
