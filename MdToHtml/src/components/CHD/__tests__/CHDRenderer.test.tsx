import React from 'react';
import { render, screen } from '@testing-library/react';
import { CHDRenderer } from '../CHDRenderer';

// Mock Section to inspect props
jest.mock('../Section', () => ({
  Section: ({ title, cards }: any) => (
    <div data-testid="section">
      <h2 data-testid="section-title">{title}</h2>
      <div data-testid="cards-container">
        {cards.map((card: any, index: number) => (
          <div key={index} data-testid="card">
            <h3 data-testid="card-title">{card.title}</h3>
            <div data-testid="card-content">{card.content}</div>
            <div data-testid="card-props">{JSON.stringify(card.props)}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}));

// Mock useTheme
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('CHDRenderer', () => {
  const markdown = `
---
title: Test Page
---

## Section 1 {layout="grid"}

### Card 1 {card-color="chart-1"}
Content 1

### Card 2
Content 2
`;

  it('renders sections and cards from markdown', () => {
    render(<CHDRenderer markdown={markdown} />);

    // Check Section
    expect(screen.getByTestId('section-title')).toHaveTextContent('Section 1');

    // Check Cards
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(2);

    // Check Card 1
    expect(cards[0]).toHaveTextContent('Card 1');
    expect(cards[0]).toHaveTextContent('Content 1');
    expect(cards[0]).toHaveTextContent('"card-color":"chart-1"');

    // Check Card 2
    expect(cards[1]).toHaveTextContent('Card 2');
    expect(cards[1]).toHaveTextContent('Content 2');
  });

  it('handles empty markdown gracefully', () => {
    render(<CHDRenderer markdown="" />);
    expect(screen.queryByTestId('section')).not.toBeInTheDocument();
  });
});
