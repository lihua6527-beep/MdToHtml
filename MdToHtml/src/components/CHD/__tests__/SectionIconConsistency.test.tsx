import React from 'react';
import { render, screen } from '@testing-library/react';
import { Section } from '../Section';

describe('Section Icon Consistency', () => {
  test('does not show warning when no cards have icons', () => {
    render(
      <Section
        title="Test Section"
        cards={[
          { title: 'Card 1', content: 'Content 1', props: {} },
          { title: 'Card 2', content: 'Content 2', props: {} },
        ]}
        layoutProps={{}}
      />
    );
    
    // Should not show consistency warning
    expect(screen.queryByText('同一 section 下的卡片要么都使用图标，要么都不使用图标')).not.toBeInTheDocument();
  });

  test('does not show warning when all cards have icons', () => {
    render(
      <Section
        title="Test Section"
        cards={[
          { title: 'Card 1', content: 'Content 1', props: { icon: 'zap' } },
          { title: 'Card 2', content: 'Content 2', props: { icon: 'cpu' } },
        ]}
        layoutProps={{}}
      />
    );
    
    // Should not show consistency warning
    expect(screen.queryByText('同一 section 下的卡片要么都使用图标，要么都不使用图标')).not.toBeInTheDocument();
  });

  test('shows warning when some cards have icons and some don\'t', () => {
    render(
      <Section
        title="Test Section"
        cards={[
          { title: 'Card 1', content: 'Content 1', props: { icon: 'zap' } },
          { title: 'Card 2', content: 'Content 2', props: {} },
        ]}
        layoutProps={{}}
      />
    );
    
    // Should show consistency warning
    expect(screen.getByText('同一 section 下的卡片要么都使用图标，要么都不使用图标')).toBeInTheDocument();
  });

  test('does not show warning when section has no cards', () => {
    render(
      <Section
        title="Test Section"
        cards={[]}
        layoutProps={{}}
      />
    );
    
    // Should not show consistency warning
    expect(screen.queryByText('同一 section 下的卡片要么都使用图标，要么都不使用图标')).not.toBeInTheDocument();
  });

  test('does not show warning when section has only one card with icon', () => {
    render(
      <Section
        title="Test Section"
        cards={[
          { title: 'Card 1', content: 'Content 1', props: { icon: 'zap' } },
        ]}
        layoutProps={{}}
      />
    );
    
    // Should not show consistency warning
    expect(screen.queryByText('同一 section 下的卡片要么都使用图标，要么都不使用图标')).not.toBeInTheDocument();
  });

  test('does not show warning when section has only one card without icon', () => {
    render(
      <Section
        title="Test Section"
        cards={[
          { title: 'Card 1', content: 'Content 1', props: {} },
        ]}
        layoutProps={{}}
      />
    );
    
    // Should not show consistency warning
    expect(screen.queryByText('同一 section 下的卡片要么都使用图标，要么都不使用图标')).not.toBeInTheDocument();
  });
});
