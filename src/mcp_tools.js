/**
 * MCP tool definitions + dispatch for agent-recall (solution memory).
 *
 * Kept separate from the stdio server wiring (mcp_server.js) so the tool logic is
 * unit-testable without spawning a transport. Pure: handleTool() takes a name + args
 * and returns a plain object (or throws). No SDK imports here.
 *
 * Exposes Recall's solution memory as three tools a skill can call:
 *   - recall_store   : save how a task was solved (goal/approach/outcome)
 *   - recall_similar : find the closest prior solution for a new goal
 *   - recall_context : a ready-to-prepend "similar task found" prompt block
 *
 * State: solutions persist to <cwd>/data/solutions.json. Under an IDE-launched server,
 * cwd is the workspace, so memory is per workspace. Similarity is keyword-overlap (offline).
 */
import { Recall } from './Recall.js';

const DEFAULT_WORKSPACE = process.env.AGENT_RECALL_WORKSPACE || 'default';

const _recalls = new Map();
function recallFor(workspace) {
  const ws = workspace || DEFAULT_WORKSPACE;
  if (!_recalls.has(ws)) _recalls.set(ws, new Recall(ws));
  return _recalls.get(ws);
}

export const TOOLS = [
  {
    name: 'recall_store',
    description:
      'Save how a task was solved so it can be recalled later. Call this after completing a task ' +
      'with a reusable approach (goal = what, approach = how, outcome = result).',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'What the task was.' },
        approach: { type: 'string', description: 'How it was solved.' },
        outcome: { type: 'string', description: 'What the result was.' },
        confidence: { type: 'number', description: 'Confidence 0.0-1.0 (default 1.0).' },
        workspace: { type: 'string', description: 'Optional workspace id (defaults to env/AGENT_RECALL_WORKSPACE).' },
      },
      required: ['goal', 'approach', 'outcome'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  {
    name: 'recall_similar',
    description:
      'Find the closest prior solution for a new goal using keyword-overlap similarity. Call this ' +
      'before solving, to reuse a known approach instead of starting from scratch.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'The new goal to match against memory.' },
        threshold: { type: 'number', description: 'Minimum similarity 0.0-1.0 (default 0.3).' },
        workspace: { type: 'string', description: 'Optional workspace id.' },
      },
      required: ['goal'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'recall_context',
    description:
      'Return a ready-to-prepend "RECALL: Similar Task Found" prompt block for a new goal (empty ' +
      'string if nothing similar is in memory).',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'The new goal.' },
        workspace: { type: 'string', description: 'Optional workspace id.' },
      },
      required: ['goal'],
    },
    annotations: { readOnlyHint: true },
  },
];

export async function handleTool(name, args = {}) {
  const recall = recallFor(args.workspace);

  switch (name) {
    case 'recall_store': {
      for (const f of ['goal', 'approach', 'outcome']) {
        if (!args[f]) throw new Error(`recall_store requires "${f}"`);
      }
      const id = recall.storeSolution(args.goal, args.approach, args.outcome, args.confidence ?? 1.0);
      return { stored: true, id };
    }
    case 'recall_similar': {
      if (!args.goal) throw new Error('recall_similar requires "goal"');
      const { solution, similarity } = recall.recallSimilar(args.goal, args.threshold ?? 0.3);
      return { found: solution !== null, similarity, solution };
    }
    case 'recall_context': {
      if (!args.goal) throw new Error('recall_context requires "goal"');
      const context = recall.buildRecallContext(args.goal);
      return { found: context !== '', context };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
