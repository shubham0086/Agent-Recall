/**
 * Agent-Recall: Reality-first persistent solution memory.
 * Stores how tasks were solved and recalls the closest match
 * before the agent starts from scratch.
 *
 * v1 uses keyword-overlap similarity (runs fully offline, no embeddings).
 * Semantic recall is behind --semantic flag (requires an embedding provider).
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SOLUTIONS_FILE = path.join(DATA_DIR, 'solutions.json');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSolutions() {
  ensureDataDir();
  if (!fs.existsSync(SOLUTIONS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SOLUTIONS_FILE, 'utf8'));
  } catch (_) {
    return [];
  }
}

function saveSolutions(solutions) {
  ensureDataDir();
  fs.writeFileSync(SOLUTIONS_FILE, JSON.stringify(solutions, null, 2), 'utf8');
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function keywordSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  for (const token of setA) {
    if (setB.has(token)) overlap++;
  }
  return overlap / Math.max(setA.size, setB.size);
}

export class Recall {
  constructor(workspaceId = 'default') {
    this.workspaceId = workspaceId;
  }

  /**
   * Store a solution after a task is completed.
   * @param {string} goal - What was the task
   * @param {string} approach - How it was solved
   * @param {string} outcome - What the result was
   * @param {number} confidence - 0.0 to 1.0
   */
  storeSolution(goal, approach, outcome, confidence = 1.0) {
    const solutions = loadSolutions();
    const solution = {
      id: Date.now(),
      workspaceId: this.workspaceId,
      goal,
      approach,
      outcome,
      confidence,
      timestamp: new Date().toISOString()
    };
    solutions.push(solution);
    saveSolutions(solutions);
    return solution.id;
  }

  /**
   * Recall the closest prior solution for a new goal.
   * Uses keyword-overlap similarity by default.
   * @param {string} newGoal
   * @param {number} threshold - Minimum similarity score (0.0 to 1.0)
   * @returns {{ solution: Object|null, similarity: number }}
   */
  recallSimilar(newGoal, threshold = 0.3) {
    const solutions = loadSolutions().filter(s => s.workspaceId === this.workspaceId);
    if (solutions.length === 0) return { solution: null, similarity: 0 };

    let best = null;
    let bestScore = 0;

    for (const solution of solutions) {
      const score = keywordSimilarity(newGoal, solution.goal);
      if (score > bestScore) {
        bestScore = score;
        best = solution;
      }
    }

    if (bestScore < threshold) return { solution: null, similarity: bestScore };
    return { solution: best, similarity: bestScore };
  }

  /**
   * Format a recalled solution as a prompt injection block.
   * Prepend this to the agent's prompt so it knows how similar tasks were solved.
   * @param {string} newGoal
   * @returns {string}
   */
  buildRecallContext(newGoal) {
    const { solution, similarity } = this.recallSimilar(newGoal);
    if (!solution) return '';

    return [
      '',
      '### RECALL: Similar Task Found in Memory',
      `Similarity: ${(similarity * 100).toFixed(0)}%`,
      `Prior Goal: ${solution.goal}`,
      `How it was solved: ${solution.approach}`,
      `Outcome: ${solution.outcome}`,
      `Confidence: ${(solution.confidence * 100).toFixed(0)}%`,
      'Consider this approach before starting from scratch.',
      '### END RECALL',
      ''
    ].join('\n');
  }

  /**
   * List all stored solutions for this workspace.
   * @returns {Array}
   */
  listSolutions() {
    return loadSolutions().filter(s => s.workspaceId === this.workspaceId);
  }

  /**
   * Clear all solutions (for testing).
   */
  clear() {
    if (fs.existsSync(SOLUTIONS_FILE)) {
      fs.unlinkSync(SOLUTIONS_FILE);
    }
  }
}
