import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoreIndicator from '../ScoreIndicator';

const mockScoreResult = {
  totalScore: 95,
  dimensions: {
    structure: 90,
    atomicity: 100,
    metadata: 95,
    syntax: 100,
    styling: 90
  },
  baseScore: 90,
  processBonus: 5,
  historyCount: 10,
  issues: []
};

const mockScoreResultLow = {
  totalScore: 70,
  dimensions: {
    structure: 60,
    atomicity: 70,
    metadata: 80,
    syntax: 75,
    styling: 65
  },
  baseScore: 65,
  processBonus: 5,
  historyCount: 5,
  issues: [
    {
      line: 10,
      severity: 'error',
      message: 'Missing required attribute'
    },
    {
      line: 20,
      severity: 'warning',
      message: 'Deprecated syntax'
    }
  ]
};

describe('ScoreIndicator', () => {
  test('renders score indicator with high score', () => {
    const setShowScoreDetails = jest.fn();
    
    render(
      <ScoreIndicator
        scoreResult={mockScoreResult}
        showScoreDetails={false}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    expect(screen.getByText('95分')).toBeInTheDocument();
  });
  
  test('renders score indicator with low score', () => {
    const setShowScoreDetails = jest.fn();
    
    render(
      <ScoreIndicator
        scoreResult={mockScoreResultLow}
        showScoreDetails={false}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    expect(screen.getByText('70分')).toBeInTheDocument();
  });
  
  test('shows score details when clicked', () => {
    const setShowScoreDetails = jest.fn();
    
    render(
      <ScoreIndicator
        scoreResult={mockScoreResult}
        showScoreDetails={false}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    fireEvent.click(screen.getByText('95分'));
    expect(setShowScoreDetails).toHaveBeenCalledWith(true);
  });
  
  test('renders score details when showScoreDetails is true', () => {
    const setShowScoreDetails = jest.fn();
    
    render(
      <ScoreIndicator
        scoreResult={mockScoreResult}
        showScoreDetails={true}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    expect(screen.getByText('评分详情')).toBeInTheDocument();
    expect(screen.getByText('结构规范:')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });
  
  test('renders AI optimization suggestion for low scores', () => {
    const setShowScoreDetails = jest.fn();
    
    render(
      <ScoreIndicator
        scoreResult={mockScoreResultLow}
        showScoreDetails={true}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    expect(screen.getByText('AI 优化建议')).toBeInTheDocument();
  });
  
  test('renders issues list for low scores', () => {
    const setShowScoreDetails = jest.fn();
    
    render(
      <ScoreIndicator
        scoreResult={mockScoreResultLow}
        showScoreDetails={true}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    expect(screen.getByText('Missing required attribute')).toBeInTheDocument();
  });
  
  test('renders perfect message when no issues', () => {
    const setShowScoreDetails = jest.fn();
    
    render(
      <ScoreIndicator
        scoreResult={mockScoreResult}
        showScoreDetails={true}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    expect(screen.getByText('完美！没有发现扣分项。')).toBeInTheDocument();
  });
  
  test('returns null when no scoreResult', () => {
    const setShowScoreDetails = jest.fn();
    const { container } = render(
      <ScoreIndicator
        scoreResult={null}
        showScoreDetails={false}
        setShowScoreDetails={setShowScoreDetails}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
});
