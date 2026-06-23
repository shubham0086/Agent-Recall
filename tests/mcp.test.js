/**
 * Offline tests for the agent-recall MCP layer (handleTool dispatch).
 * No transport, no network. Exercises store -> similar -> context against a test workspace.
 */
import assert from 'node:assert';
import { TOOLS, handleTool } from '../src/mcp_tools.js';
import { Recall } from '../src/Recall.js';

const WS = 'test-ws';
let passed = 0;
const ok = (label) => { console.log(`  ✓ ${label}`); passed++; };

new Recall(WS).clear();

// 1. Tool surface
{
  const names = TOOLS.map((t) => t.name).sort();
  assert.deepStrictEqual(names, ['recall_context', 'recall_similar', 'recall_store']);
  for (const t of TOOLS) assert.ok(t.inputSchema && t.description, `${t.name} has schema+desc`);
  ok('exposes recall_store + recall_similar + recall_context with valid schemas');
}

// 2. Store a solution
{
  const r = await handleTool('recall_store', {
    goal: 'Fix OAuth token refresh failing after 1 hour',
    approach: 'Refresh proactively at 80% of expiry using a background timer',
    outcome: 'No more 401s; sessions stay alive',
    workspace: WS,
  });
  assert.strictEqual(r.stored, true);
  assert.ok(r.id, 'returns an id');
  ok('recall_store saves a solution and returns an id');
}

// 3. Similar goal recalls it
{
  const r = await handleTool('recall_similar', {
    goal: 'OAuth token refresh keeps failing on expiry',
    workspace: WS,
  });
  assert.strictEqual(r.found, true);
  assert.ok(r.similarity >= 0.3, 'similarity above threshold');
  assert.match(r.solution.approach, /Refresh proactively/);
  ok('recall_similar finds the prior OAuth solution');
}

// 4. Context block builds
{
  const r = await handleTool('recall_context', {
    goal: 'OAuth token refresh keeps failing on expiry',
    workspace: WS,
  });
  assert.strictEqual(r.found, true);
  assert.ok(r.context.includes('RECALL: Similar Task Found'), 'recall block present');
  ok('recall_context returns a prepend-ready RECALL block');
}

// 5. Unrelated goal -> no match
{
  const r = await handleTool('recall_similar', { goal: 'render a video with remotion', workspace: WS });
  assert.strictEqual(r.found, false);
  ok('recall_similar returns no match for an unrelated goal');
}

// 6. Missing required field + unknown tool reject
{
  await assert.rejects(() => handleTool('recall_store', { goal: 'x' }), /requires "approach"/);
  await assert.rejects(() => handleTool('nope', {}), /Unknown tool/);
  ok('rejects missing fields and unknown tools');
}

new Recall(WS).clear();
console.log(`\n${passed} checks passed`);
