// 43. Unit/integration test untuk ECS, serializer, network
export interface TestCase {
  name: string;
  fn: () => Promise<void> | void;
  timeout?: number;
}

export class IntegrationTests {
  private tests: TestCase[] = [];
  private results = new Map<string, { passed: boolean; error?: Error }>();

  addTest(name: string, fn: () => Promise<void> | void, timeout = 5000): void {
    this.tests.push({ name, fn, timeout });
  }

  async runTests(): Promise<void> {
    console.log(`Running ${this.tests.length} tests...`);

    for (const test of this.tests) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Test timeout')), test.timeout);
        });

        await Promise.race([test.fn(), timeoutPromise]);
        this.results.set(test.name, { passed: true });
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.results.set(test.name, { passed: false, error: error as Error });
        console.error(`✗ ${test.name}:`, error);
      }
    }

    this.printSummary();
  }

  private printSummary(): void {
    const passed = Array.from(this.results.values()).filter(r => r.passed).length;
    const failed = this.results.size - passed;

    console.log('\n' + '='.repeat(50));
    console.log(`Tests: ${passed} passed, ${failed} failed, ${this.results.size} total`);
    console.log('='.repeat(50));
  }

  getResults(): Map<string, { passed: boolean; error?: Error }> {
    return new Map(this.results);
  }
}

// Example test suite
export function createECSTestSuite(): IntegrationTests {
  const suite = new IntegrationTests();

  suite.addTest('Entity creation', () => {
    // Test entity creation
  });

  suite.addTest('Component attachment', () => {
    // Test component attachment
  });

  suite.addTest('System update', () => {
    // Test system update
  });

  return suite;
}
