import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import ExamManager from '../pages/admin/ExamManager';
import { appStorage } from '../services/appStorage';

describe('ExamManager Date-Driven Batch & Sets Lookup', () => {
  beforeEach(() => {
    localStorage.clear();
    appStorage.init();

    // Reset exams array with predictable test data
    appStorage.db.exams = [];
    appStorage.save();

    const res1 = appStorage.createExam({
      name: 'Batch 1 - Morning',
      exam_date: '2026-09-20',
      session_time: '09:00 AM - 12:00 PM',
      grace_period_minutes: 15,
      sets: ['Set A', 'Set B', 'Set C', 'Set D']
    });

    appStorage.createExam({
      name: 'Batch 2 - Afternoon',
      exam_date: '2026-09-20',
      session_time: '01:00 PM - 04:00 PM',
      grace_period_minutes: 20,
      sets: ['Set X', 'Set Y']
    });

    appStorage.createExam({
      name: 'Batch 1 - Day 2',
      exam_date: '2026-09-25',
      session_time: '10:00 AM - 01:00 PM',
      grace_period_minutes: 10,
      sets: ['Set 1', 'Set 2', 'Set 3']
    });

    // Make Batch 1 on 2026-09-20 the active batch
    appStorage.switchActiveExam(res1.exam_id);
  });

  it('automatically selects the active exam on initial load and displays batches for its date', () => {
    render(<ExamManager onExamUpdated={() => {}} />);

    // Quick date chip for 2026-09-20 should be visible
    expect(screen.getAllByText(/2026-09-20/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/2 batches/i)).toBeInTheDocument();

    // Batch 1 and Batch 2 tabs should be visible
    expect(screen.getByRole('button', { name: /Batch 1 - Morning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batch 2 - Afternoon/i })).toBeInTheDocument();

    // The sets for Batch 1 should be rendered
    expect(screen.getAllByText('Set A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Set B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Set C').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Set D').length).toBeGreaterThan(0);
  });

  it('switches batches and updates sets when a different batch tab is clicked', async () => {
    render(<ExamManager onExamUpdated={() => {}} />);

    // Click on Batch 2 tab
    const batch2Btn = screen.getByRole('button', { name: /Batch 2 - Afternoon/i });
    fireEvent.click(batch2Btn);

    // Sets should now be Set X and Set Y
    expect(screen.getAllByText('Set X').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Set Y').length).toBeGreaterThan(0);
  });

  it('looks up batches when changing the exam date via input or date chip', async () => {
    render(<ExamManager onExamUpdated={() => {}} />);

    // Click on 2026-09-25 chip
    const chip = screen.getByRole('button', { name: /2026-09-25/i });
    fireEvent.click(chip);

    // Should now display Batch 1 - Day 2
    expect(screen.getByRole('button', { name: /Batch 1 - Day 2/i })).toBeInTheDocument();
    expect(screen.getAllByText('Set 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Set 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Set 3').length).toBeGreaterThan(0);
  });

  it('switches to new batch creation mode when entering a date with no existing batches', async () => {
    render(<ExamManager onExamUpdated={() => {}} />);

    // Find date input in the top bar
    const dateInputs = screen.getAllByDisplayValue('2026-09-20');
    fireEvent.change(dateInputs[0], { target: { value: '2026-10-15' } });

    // Should indicate no batches found and show Save & Create Batch
    expect(screen.getByText(/No batches found for 2026-10-15/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Create Batch/i })).toBeInTheDocument();
  });
});
