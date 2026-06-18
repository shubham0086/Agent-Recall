# Agent-Recall

> **IMPORTANT**: This repository contains real, production-ready, battle-tested code extracted directly from active commercial systems (like Agency OS or Founder Growth OS), rather than simplified mock learning artifacts.
>
> For project walkthroughs, architecture flowcharts, and system context, visit the live landing page: [my-portfolio-github-io-beta-five.vercel.app/projects/agent-recall.html](https://my-portfolio-github-io-beta-five.vercel.app/projects/agent-recall.html)

**The agent recalls how it solved a similar task last week, instead of starting from scratch.**

Most agents have no memory of what they built. They solve the same problem repeatedly, make the same choices, and repeat the same mistakes. Agent-Recall stores solutions and finds the closest match when a new task arrives, injecting that context into the prompt before the agent starts.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-brightgreen.svg)](package.json)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-blue.svg)]()

---

## Quick Start

```bash
git clone https://github.com/shubham0086/Agent-Recall
cd Agent-Recall
node demo/recall.js
```

No install needed. Zero external dependencies.

---

## What It Does

1. **Stores solutions** after a task completes: goal, approach, outcome, confidence
2. **Finds the closest match** using keyword-overlap similarity when a new task arrives
3. **Injects recall context** into the agent's prompt before it starts

### The Recall Block (what gets injected)

```
### RECALL: Similar Task Found in Memory
Similarity: 68%
Prior Goal: Write a function to parse CSV files in Node.js
How it was solved: Used fs.readFileSync, split by newlines, then by comma. Handled quoted fields with regex.
Outcome: Working CSV parser, 40 lines, handles edge cases
Confidence: 90%
Consider this approach before starting from scratch.
### END RECALL
```

The agent reads this and builds on prior knowledge instead of reinventing the wheel.

---

## API

### `new Recall(workspaceId)`

```js
import { Recall } from 'agent-recall';
const recall = new Recall('my-project');
```

### `storeSolution(goal, approach, outcome, confidence)`

```js
recall.storeSolution(
  'Write a CSV parser',
  'Used readFileSync + split by newline and comma',
  'Working parser, 40 lines',
  0.9
);
```

### `recallSimilar(newGoal, threshold)`

```js
const { solution, similarity } = recall.recallSimilar('Parse a CSV file');
// solution: the best match, or null if below threshold
// similarity: 0.0 to 1.0
```

### `buildRecallContext(newGoal)`

```js
const context = recall.buildRecallContext('Parse a CSV file');
// Returns formatted block ready to prepend to any prompt
// Returns '' if no similar solution found above threshold
```

---

## How Similarity Works

v1 uses **keyword-overlap** similarity: tokenize both goals, count shared tokens, divide by the larger set. Runs fully offline, no embedding model needed.

```
"Write a CSV parser"     -> tokens: [write, csv, parser]
"Parse a CSV file"       -> tokens: [parse, csv, file]
overlap = {csv} = 1
similarity = 1 / max(3, 3) = 0.33
```

The default threshold is `0.3`. Adjust it in `recallSimilar(goal, threshold)`.

Semantic embedding recall (for higher accuracy) is planned for v2 behind an optional flag.

---

## Storage

Solutions are stored in `./data/solutions.json`. Zero dependencies, works offline, persists across sessions.

---

## Where This Fits

```
AI-systems-evolution   ← start here (rung 02: memory across turns)
    |
    └─► agentic-patterns  ← Pattern 03 (reality-first memory)
            |
            └─► Agent-Recall  ← THIS REPO (cross-session solution memory)
```

For the full memory + failure stack: combine with [Agent-Scars](https://github.com/shubham0086/Agent-Scars) (failure memory) and [agentkernel](https://github.com/shubham0086/agentkernel) (production engine).

**Theory companion:** [Pattern 03: Reality-First Memory](https://github.com/shubham0086/agentic-patterns/blob/main/docs/03-reality-first-memory.md)

---

<div align="center">

Built by [Shubham Prajapati](https://github.com/shubham0086) ·
[Portfolio](https://my-portfolio-github-io-beta-five.vercel.app/)
· MIT

</div>
