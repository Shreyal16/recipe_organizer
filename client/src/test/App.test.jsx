import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

describe('Frontend Foundation Test', () => {
  it('renders application brand and navigation', () => {
    render(<App />);
    const brandElements = screen.getAllByText(/Recipe Organizer/i);
    expect(brandElements.length).toBeGreaterThan(0);
  });
});
