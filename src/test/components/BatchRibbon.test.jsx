import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BatchRibbon from '../../components/BatchRibbon';

describe('BatchRibbon', () => {
  const batches = [
    { id: '1', name: 'Batch 1', status: 'ACTIVE', subject_code: 'CS101' },
    { id: '2', name: 'Batch 2', status: 'UPCOMING', subject_code: 'CS102' }
  ];

  it('renders nothing if batches array is empty', () => {
    const { container } = render(<BatchRibbon batches={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders batches correctly', () => {
    render(<BatchRibbon batches={batches} selectedBatchId="1" />);
    expect(screen.getByText('Batch 1')).toBeInTheDocument();
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();

    expect(screen.getByText('Batch 2')).toBeInTheDocument();
    expect(screen.getByText('CS102')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('handles batch selection', () => {
    const onSelectBatch = vi.fn();
    render(<BatchRibbon batches={batches} selectedBatchId="1" onSelectBatch={onSelectBatch} />);

    fireEvent.click(screen.getByText('Batch 2').closest('button'));
    expect(onSelectBatch).toHaveBeenCalledWith('2');
  });
});
