
import { useState, useEffect } from 'react';
import { RuleBasedScorer } from '@/lib/scorer';
import { ScoreResponse } from '@/types/model-interface';

export function useScoring(content: string) {
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Evaluate on initial load and content change
  useEffect(() => {
    // Only evaluate if content is present
    if (content) {
       const result = RuleBasedScorer.evaluate(content);
       setScoreResult(result);
       
       // Auto-show score details if critical errors found or score is very low
       if (result.totalScore === 0 || result.issues.some(i => i.severity === 'error')) {
           setShowScoreDetails(true);
       }
    } else {
        // Handle empty content specifically
        const result = RuleBasedScorer.evaluate('');
        setScoreResult(result);
        setShowScoreDetails(true);
    }
  }, [content]);

  return { scoreResult, showScoreDetails, setShowScoreDetails };
}
