import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../App';
import { appStorage } from '../services/appStorage';

describe('App Integration - End to End Flow', () => {
  beforeEach(() => {
    // Reset DB to clean state before each test
    localStorage.clear();
    appStorage.db = {
      exams: [],
      rooms: [],
      students: [],
      attendance_logs: [],
      users: [
        { id: '1', username: 'admin', role: 'ADMIN', name: 'Admin', password: 'password' }
      ]
    };
    appStorage.active_exam_id = null;
    appStorage.save();
    vi.useFakeTimers({ toFake: ['Date'] });
    // Set a consistent date to avoid test flakiness with exams "UPCOMING" vs "ACTIVE"
    vi.setSystemTime(new Date('2023-10-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows admin to login', async () => {
    const user = userEvent.setup({ delay: null, document });
    render(<App />);

    expect(screen.getByText('ExamSet Pro')).toBeInTheDocument();

    // Switch to Admin Console tab
    await user.click(screen.getByText(/Admin Account/i));

    // Fill credentials
    const usernameInput = screen.getByPlaceholderText('admin');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.click(screen.getByRole('button', { name: /Sign In as Administrator/i }));

    // Wait for Admin Dashboard to load
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    });
  });
});
