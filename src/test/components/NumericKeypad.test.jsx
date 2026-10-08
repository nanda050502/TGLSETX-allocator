import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NumericKeypad from '../../components/NumericKeypad';

describe('NumericKeypad', () => {
  it('renders all numbers and calls onKeyPress', () => {
    const onKeyPress = vi.fn();
    render(<NumericKeypad onKeyPress={onKeyPress} onBackspace={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />);

    // Check digits 0-9
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }

    // Press '5'
    fireEvent.click(screen.getByText('5').closest('button'));
    expect(onKeyPress).toHaveBeenCalledWith('5');
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<NumericKeypad onKeyPress={vi.fn()} onBackspace={vi.fn()} onClear={onClear} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Clear', { selector: 'button' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('calls onBackspace when delete button is clicked', () => {
    const onBackspace = vi.fn();
    const { container } = render(<NumericKeypad onKeyPress={vi.fn()} onBackspace={onBackspace} onClear={vi.fn()} onClose={vi.fn()} />);

    // The delete button uses a lucide icon so find by the delete button's characteristics
    // Wait, the keypad maps `isDelete` to a button with the Delete icon.
    // Let's use the svg class. Or just select the button that does NOT have 'Clear' or a number.
    const delBtn = container.querySelector('button > svg.lucide-delete').closest('button');
    fireEvent.click(delBtn);
    expect(onBackspace).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<NumericKeypad onKeyPress={vi.fn()} onBackspace={vi.fn()} onClear={vi.fn()} onClose={onClose} />);

    const closeBtn = container.querySelector('button > svg.lucide-x').closest('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
