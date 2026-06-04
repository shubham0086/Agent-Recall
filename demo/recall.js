#!/usr/bin/env node
/**
 * Demo: Recall similar prior solutions before starting from scratch.
 * Shows the recall context block that gets injected into the agent prompt.
 */

import { Recall } from '../src/Recall.js';

const recall = new Recall('demo');
recall.clear();

console.log('\nAgent-Recall: Solution Memory Demo\n');

// Store some prior solutions
console.log('Storing 3 prior solutions in memory...\n');

recall.storeSolution(
  'Write a function to parse CSV files in Node.js',
  'Used built-in fs.readFileSync, split by newlines, then split each line by comma. Handled quoted fields with a regex.',
  'Working CSV parser, 40 lines, handles edge cases',
  0.9
);

recall.storeSolution(
  'Build a REST API endpoint for user authentication with JWT',
  'Used jsonwebtoken library, created /login endpoint that validates credentials and returns signed JWT. Added middleware to verify token on protected routes.',
  'Working auth system, deployed to production',
  0.95
);

recall.storeSolution(
  'Parse JSON output from an LLM that sometimes includes markdown fences',
  'Used regex to strip ```json ... ``` fences before JSON.parse(). Added try/catch with fallback to extracting first { } block.',
  'Robust JSON extractor, handles all common LLM output formats',
  0.85
);

console.log(`Stored ${recall.listSolutions().length} solutions.\n`);
console.log('─'.repeat(60));

// Now simulate a new goal and recall
const newGoal = 'Parse a CSV file and extract specific columns';
console.log(`\nNew task: "${newGoal}"\n`);

const { solution, similarity } = recall.recallSimilar(newGoal);

if (solution) {
  console.log(`Found similar prior solution! (${(similarity * 100).toFixed(0)}% match)\n`);
  const context = recall.buildRecallContext(newGoal);
  console.log('Recall context injected into agent prompt:');
  console.log('─'.repeat(60));
  console.log(context);
  console.log('─'.repeat(60));
  console.log('\nAgent can now build on prior knowledge instead of starting from zero.\n');
} else {
  console.log('No similar prior solution found. Agent starts fresh.\n');
}

// Show a low-similarity case
const unrelatedGoal = 'Set up a Redis pub/sub message queue';
console.log(`\nUnrelated task: "${unrelatedGoal}"`);
const { solution: s2, similarity: sim2 } = recall.recallSimilar(unrelatedGoal);
console.log(`Similarity to best match: ${(sim2 * 100).toFixed(0)}% (below 30% threshold -> no recall injected)\n`);

recall.clear();
console.log('Demo complete.\n');
