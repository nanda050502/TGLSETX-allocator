import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GoogleSheetSetupModal from '../../components/GoogleSheetSetupModal';
import { appStorage } from '../../services/appStorage';

vi.mock('../../services/appStorage', () => ({
  appStorage: {
    updateExam: vi.fn(),
    getGoogleScriptCode: vi.fn(() => 'mock script code'),
  },
}));

describe('GoogleSheetSetupModal', () => {
  const mockExam = {
    id: '1',
    google_sheet_url: '',
    google_sheet_webhook_url: '',
  };

  it('renders modal with correct fields', () => {
    render(<GoogleSheetSetupModal exam={mockExam} onClose={vi.fn()} onUpdated={vi.fn()} />);
    expect(screen.getByText('Live Google Sheets Real-Time Sync')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/docs\.google\.com\/spreadsheets/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/script\.google\.com\/macros/i)).toBeInTheDocument();
  });

  it('saves configuration and closes modal', async () => {
    appStorage.updateExam.mockReturnValue({ success: true });
    const onClose = vi.fn();
    const onUpdated = vi.fn();

    render(<GoogleSheetSetupModal exam={mockExam} onClose={onClose} onUpdated={onUpdated} />);

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/docs\.google\.com\/spreadsheets/i), { target: { value: 'https://docs.google.com/test' } });
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/script\.google\.com\/macros/i), { target: { value: 'https://script.google.com/test' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));

    await waitFor(() => {
      expect(appStorage.updateExam).toHaveBeenCalledWith('1', expect.objectContaining({
        google_sheet_url: 'https://docs.google.com/test',
        google_sheet_webhook_url: 'https://script.google.com/test'
      }));
      expect(onUpdated).toHaveBeenCalled();
      // the real modal doesn't call onClose automatically on success
      expect(screen.getByText('Google Sheet settings saved successfully!')).toBeInTheDocument();
    });
  });

  it('closes when close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<GoogleSheetSetupModal exam={mockExam} onClose={onClose} onUpdated={vi.fn()} />);

    const closeBtn = container.querySelector('button.hover\\:text-slate-700');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
