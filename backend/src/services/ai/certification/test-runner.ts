// backend/src/services/ai/certification/test-runner.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from './types';

export class TestRunner {
  constructor(
    private provider: any,
    private apiKey: string
  ) {}

  async runTests(modelId: string, tests: TestSpec[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const test of tests) {
      console.log(`[TestRunner] Running ${test.id} for ${modelId}`);
      
      try {
        const result = await Promise.race([
          test.run(modelId, this.provider, this.apiKey),
          this.timeout(test.timeout, test.id)
        ]);
        
        results.push(result);
      } catch (error: any) {
        results.push({
          testId: test.id,
          testName: test.name,
          passed: false,
          error: error.message || 'Unknown error',
          latencyMs: 0
        });
      }
    }
    
    return results;
  }
  
  private timeout(ms: number, testId: string): Promise<TestResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test ${testId} timed out after ${ms}ms`));
      }, ms);
    });
  }
}
