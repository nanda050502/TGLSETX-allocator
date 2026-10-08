import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentSwipeCard from '../../components/StudentSwipeCard';

describe('StudentSwipeCard', () => {
  const student = {
    id: '1',
    name: 'John Doe',
    roll_number: 'R123',
    status: 'ABSENT',
    assigned_set: null,
    marked_at: null,
  };

  it('renders student information', () => {
    render(<StudentSwipeCard student={student} onMarkPresent={vi.fn()} onUndoAttendance={vi.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('R123')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
  });

  it('shows present state', () => {
    const presentStudent = { ...student, status: 'PRESENT', assigned_set: 'Set A', marked_at: '10:00 AM' };
    render(<StudentSwipeCard student={presentStudent} onMarkPresent={vi.fn()} onUndoAttendance={vi.fn()} hideSetInfo={false} />);
    expect(screen.getByText('Set A')).toBeInTheDocument();
    expect(screen.getByText('Present')).toBeInTheDocument();
  });

  it('calls onMarkPresent when clicked (desktop)', () => {
    const onMarkPresent = vi.fn();
    render(<StudentSwipeCard student={student} onMarkPresent={onMarkPresent} onUndoAttendance={vi.fn()} />);

    // There's a 'Mark' button when not swiping
    fireEvent.click(screen.getByText('Mark', { selector: 'button' }));
    expect(onMarkPresent).toHaveBeenCalledWith(student);
  });
});
