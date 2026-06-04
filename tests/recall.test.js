#!/usr/bin/env node
import { Recall } from '../src/Recall.js';

let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

console.log('Agent-Recall Test Suite\n');

const recall = new Recall('test');
recall.clear();

console.log('Test 1: Store a solution');
const id = recall.storeSolution('Write a CSV parser', 'Used split by newline and comma', 'Working parser', 0.9);
assert(id > 0, 'Solution stored with positive ID');

console.log('\nTest 2: List solutions');
const solutions = recall.listSolutions();
assert(solutions.length === 1, 'One solution listed');
assert(solutions[0].goal === 'Write a CSV parser', 'Goal matches');

console.log('\nTest 3: Recall similar goal');
const { solution, similarity } = recall.recallSimilar('Parse a CSV file');
assert(solution !== null, 'Similar solution recalled');
assert(similarity > 0.3, 'Similarity above threshold');

console.log('\nTest 4: No recall for unrelated goal');
const { solution: s2 } = recall.recallSimilar('Deploy a Kubernetes cluster with Helm charts');
assert(s2 === null, 'No recall for unrelated goal');

console.log('\nTest 5: Build recall context');
const context = recall.buildRecallContext('Parse CSV data from a file');
assert(context.includes('RECALL'), 'Context contains RECALL header');
assert(context.includes('CSV'), 'Context references the prior goal');

console.log('\nTest 6: Persistence across instances');
const recall2 = new Recall('test');
const solutions2 = recall2.listSolutions();
assert(solutions2.length === 1, 'Solutions persist across instances');

recall.clear();
console.log(`\n${'─'.repeat(40)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
