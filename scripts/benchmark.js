#!/usr/bin/env node
/**
 * @file scripts/benchmark.js
 * @description Benchmark tool untuk testing performance
 */

import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:3000/api';

async function benchmark() {
  console.log('🔥 AI Framework Benchmark Tool\n');
  console.log('Starting performance tests...\n');

  const results = {
    health: null,
    structure: null,
    singleComponent: null,
    batchComponents: null,
    analytics: null
  };

  // Test 1: Health Check
  console.log('1️⃣ Testing health endpoint...');
  results.health = await testEndpoint('GET', '/health');

  // Test 2: Structure (Cold)
  console.log('2️⃣ Testing structure endpoint (cold)...');
  results.structure = await testEndpoint('GET', '/structure');

  // Test 3: Structure (Warm - should be cached)
  console.log('3️⃣ Testing structure endpoint (warm - cached)...');
  const structureWarm = await testEndpoint('GET', '/structure');
  console.log(`   Cache improvement: ${((results.structure.duration - structureWarm.duration) / results.structure.duration * 100).toFixed(1)}%\n`);

  // Test 4: Single Component Generation
  console.log('4️⃣ Testing single component generation...');
  results.singleComponent = await testEndpoint('POST', '/generate/component', {
    name: 'BenchmarkTest',
    type: 'ui',
    content: '<div>Benchmark test component</div>',
    aiMetadata: { prompt: 'Benchmark test' }
  });

  // Test 5: Batch Component Generation (3 components)
  console.log('5️⃣ Testing batch generation (3 components)...');
  results.batchComponents = await testEndpoint('POST', '/batch/generate', {
    operations: [
      {
        type: 'component',
        data: {
          name: 'BatchTest1',
          type: 'ui',
          content: '<div>Test 1</div>'
        }
      },
      {
        type: 'component',
        data: {
          name: 'BatchTest2',
          type: 'ui',
          content: '<div>Test 2</div>'
        }
      },
      {
        type: 'component',
        data: {
          name: 'BatchTest3',
          type: 'ui',
          content: '<div>Test 3</div>'
        }
      }
    ]
  });

  const batchVsSingle = (results.singleComponent.duration * 3) / results.batchComponents.duration;
  console.log(`   Batch is ${batchVsSingle.toFixed(1)}x faster than individual requests\n`);

  // Test 6: Analytics
  console.log('6️⃣ Testing analytics endpoint...');
  results.analytics = await testEndpoint('GET', '/ai/analytics');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BENCHMARK RESULTS');
  console.log('='.repeat(60));
  console.log(`Health Check:           ${results.health.duration.toFixed(2)}ms`);
  console.log(`Structure (cold):       ${results.structure.duration.toFixed(2)}ms`);
  console.log(`Structure (cached):     ${structureWarm.duration.toFixed(2)}ms`);
  console.log(`Single Component:       ${results.singleComponent.duration.toFixed(2)}ms`);
  console.log(`Batch (3 components):   ${results.batchComponents.duration.toFixed(2)}ms`);
  console.log(`Analytics:              ${results.analytics.duration.toFixed(2)}ms`);
  console.log('='.repeat(60));
  console.log(`\n✅ Batch operations are ${batchVsSingle.toFixed(1)}x faster!`);
  console.log(`✅ Caching provides ${((results.structure.duration - structureWarm.duration) / results.structure.duration * 100).toFixed(1)}% improvement!\n`);
}

async function testEndpoint(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const start = performance.now();

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    const duration = performance.now() - start;

    const cache = response.headers.get('X-Cache');
    const status = response.status;

    console.log(`   ✓ ${method} ${path}`);
    console.log(`     Status: ${status}, Duration: ${duration.toFixed(2)}ms${cache ? `, Cache: ${cache}` : ''}`);

    return { duration, status, cache, data };
  } catch (error) {
    const duration = performance.now() - start;
    console.log(`   ✗ ${method} ${path}`);
    console.log(`     Error: ${error.message}, Duration: ${duration.toFixed(2)}ms`);
    return { duration, error: error.message };
  }
}

// Run benchmark
console.log('⚠️  Make sure server is running on http://localhost:3000\n');
setTimeout(() => {
  benchmark().catch(console.error);
}, 1000);
