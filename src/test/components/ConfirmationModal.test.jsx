import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmationModal from '../../components/ConfirmationModal';

describe('ConfirmationModal', () => {
  it('does not render without notification', () => {
    const { container } = render(<ConfirmationModal notification={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders success message', () => {
    render(<ConfirmationModal notification={{ type: 'SUCCESS', message: 'Success!' }} onClose={() => {}} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<ConfirmationModal notification={{ type: 'ERROR', message: 'Error!' }} onClose={() => {}} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmationModal notification={{ type: 'SUCCESS', message: 'Hi' }} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close Toast'));
    expect(onClose).toHaveBeenCalled();
  });
});
