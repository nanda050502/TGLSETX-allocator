import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

const renderLogin = () => {
  return render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
};

describe('Login Page URL Routing & Split Links', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = new URL('http://localhost:5173/');
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('renders Room PIN login by default at opening (/ or /room) with bottom admin link', () => {
    window.location = new URL('http://localhost:5173/');
    renderLogin();

    expect(screen.getByText(/Invigilator Room PIN Sign In/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Examination Room \/ Hall Number/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Room Access PIN/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Access Room Attendance/i })).toBeInTheDocument();
    expect(screen.getByText(/Are you an Examination Controller\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Admin Login/i })).toBeInTheDocument();
  });

  it('renders Admin login directly when visiting /admin link', () => {
    window.location = new URL('http://localhost:5173/admin');
    renderLogin();

    expect(screen.getByText(/Administrator Sign In/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Username/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In as Administrator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Room PIN Sign In/i })).toBeInTheDocument();
  });

  it('switches between /room and /admin links smoothly when clicking navigation links', async () => {
    window.location = new URL('http://localhost:5173/');
    const user = userEvent.setup();
    renderLogin();

    // Starts in Room PIN mode
    expect(screen.getByText(/Invigilator Room PIN Sign In/i)).toBeInTheDocument();

    // Click "Go to Admin Login (/admin) →" link in bottom
    const adminLinkBtn = screen.getByRole('button', { name: /Go to Admin Login/i });
    await user.click(adminLinkBtn);

    // Now in Admin mode
    expect(screen.getByText(/Administrator Sign In/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In as Administrator/i })).toBeInTheDocument();

    // Click "Go to Room PIN Sign In (/room) →" link in bottom
    const roomLinkBtn = screen.getByRole('button', { name: /Go to Room PIN Sign In/i });
    await user.click(roomLinkBtn);

    // Back in Room PIN mode
    expect(screen.getByText(/Invigilator Room PIN Sign In/i)).toBeInTheDocument();
  });
});
