"use client";

import React, { useEffect, useState } from 'react';
import { validateContent, ValidationResult } from '@/lib/validator';

interface TestCase {
  name: string;
  input: string;
  expectedErrorCount: number;
  expectedFirstError?: string;
}

export default function TestPage() {
  const [results, setResults] = useState<{name: string, passed: boolean, message: string}[]>([]);

  useEffect(() => {
    const runTests = () => {
      const testCases: TestCase[] = [
        {
          name: 'Empty Content',
          input: '',
          expectedErrorCount: 0
        },
        {
          name: 'Valid Structure',
          input: '# Title\n## Section 1\n### Card 1\nContent here',
          expectedErrorCount: 0
        },
        {
          name: 'Orphan Card (H3 without H2)',
          input: '# Title\n### Orphan Card',
          expectedErrorCount: 1,
          expectedFirstError: 'Card (###) defined outside of any Section (##)'
        },
        {
          name: 'Invalid Header Level (H4)',
          input: '#### Too deep',
          expectedErrorCount: 1,
          expectedFirstError: 'CHD only supports H1 (Title), H2 (Section), and H3 (Card)'
        },
        {
          name: 'Unclosed Attribute',
          input: '## Section {key="val"',
          expectedErrorCount: 1,
          expectedFirstError: 'Unclosed attribute bracket'
        }
      ];

      const newResults = testCases.map(tc => {
        const errors = validateContent(tc.input);
        const countMatch = errors.length === tc.expectedErrorCount;
        let msgMatch = true;
        if (tc.expectedFirstError && errors.length > 0) {
          msgMatch = errors[0].message.includes(tc.expectedFirstError) || 
                     (errors[0].message === tc.expectedFirstError);
        }

        const passed = countMatch && msgMatch;
        return {
          name: tc.name,
          passed,
          message: passed ? 'OK' : `Failed. Expected ${tc.expectedErrorCount} errors, got ${errors.length}. ${errors[0]?.message || ''}`
        };
      });

      setResults(newResults);
    };

    runTests();
  }, []);

  const allPassed = results.every(r => r.passed);
  
  // Performance Test State
  const [perfCount, setPerfCount] = useState(0);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  const runPerfTest = () => {
    const start = performance.now();
    setPerfCount(500); // Render 500 items
    // We need to wait for render. In React, this is tricky without layout effect.
    // For simplicity, we just set state and let user see if it lags.
    // A true measurement would use a layout effect.
    requestAnimationFrame(() => {
        const end = performance.now();
        setRenderTime(end - start); // This is just JS time, not paint time.
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-mono">
      <h1 className="text-2xl font-bold mb-6">System Verification Dashboard</h1>
      
      {/* Unit Tests Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">1. Unit Tests (Validator Logic)</h2>
        <div className={`p-4 rounded-lg mb-6 ${allPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Status: <strong>{allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}</strong>
        </div>

        <div className="space-y-2">
            {results.map((res, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded bg-white shadow-sm">
                <span>{res.name}</span>
                <span className={res.passed ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {res.passed ? 'PASS' : 'FAIL'}
                </span>
                {!res.passed && <div className="text-xs text-red-500 w-full block mt-1">{res.message}</div>}
            </div>
            ))}
        </div>
      </section>

      {/* Performance Test Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">2. Performance Stress Test</h2>
        <p className="mb-4 text-gray-600">Click below to render 500 mock card components to verify rendering stability.</p>
        
        <button 
            onClick={runPerfTest}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
            Run Stress Test (500 items)
        </button>

        {perfCount > 0 && (
            <div className="mt-4">
                <div className="p-2 bg-blue-50 text-blue-800 rounded mb-4">
                    Rendered {perfCount} components. {renderTime && `JS Execution: ~${renderTime.toFixed(2)}ms`}
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto border p-2 bg-gray-50">
                    {Array.from({ length: perfCount }).map((_, i) => (
                        <div key={i} className="bg-white p-2 border rounded text-xs text-center shadow-sm">
                            Card #{i + 1}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </section>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Tests running in browser environment via Next.js Client Component.</p>
        <p>Testing module: <code>src/lib/validator.ts</code></p>
      </div>
    </div>
  );
}
