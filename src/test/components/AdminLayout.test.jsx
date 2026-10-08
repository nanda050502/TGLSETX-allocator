import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminLayout from '../../components/AdminLayout';

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { name: 'Test Admin', role: 'ADMIN' },
      logout: vi.fn(),
    })
  };
});

describe('AdminLayout', () => {
  it('renders children and navigation', () => {
    render(
      <AdminLayout activeTab="live-monitor" setActiveTab={vi.fn()} examInfo={{ name: 'Test Exam' }}>
        <div data-testid="child">Child Content</div>
      </AdminLayout>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getAllByText('ExamSet Pro')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Test Exam')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
  });

  it('handles tab changes', () => {
    const setActiveTab = vi.fn();
    render(
      <AdminLayout activeTab="live-monitor" setActiveTab={setActiveTab} examInfo={null}>
        <div>Child Content</div>
      </AdminLayout>
    );

    fireEvent.click(screen.getAllByText('Student Roster')[0]);
    expect(setActiveTab).toHaveBeenCalledWith('students');
  });
});
