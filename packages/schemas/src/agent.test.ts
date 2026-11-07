import { describe, expect, it } from 'vitest';
import { parseAgentDefinition } from './agent.js';

function definition(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0.0',
    id: 'AGENT-REVIEWER',
    name: 'Reviewer',
    description: 'Reviews changes against the standards.',
    version: '0.1.0',
    instructions: ['Read the standard before reviewing.'],
    rules: [{ id: 'RULES-TESTS', scope: 'project', text: 'Every change has a test.' }],
    ...overrides,
  };
}

describe('canonical agent definition', () => {
  it('accepts a minimal definition', () => {
    expect(parseAgentDefinition(definition()).ok).toBe(true);
  });

  it('defaults optional collections', () => {
    const result = parseAgentDefinition(definition());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.skills).toEqual([]);
      expect(result.data.tools).toEqual([]);
      expect(result.data.compatibility.adapters).toEqual([]);
    }
  });

  it('rejects an identifier that is not an agent id', () => {
    const result = parseAgentDefinition(definition({ id: 'reviewer' }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('id');
    }
  });

  it('requires a path for a path-scoped rule', () => {
    const result = parseAgentDefinition(
      definition({ rules: [{ id: 'RULES-PATHS', scope: 'path', text: 'Use the shared parser.' }] }),
    );

    expect(result.ok).toBe(false);
  });

  it('rejects a path on a project-scoped rule', () => {
    const result = parseAgentDefinition(
      definition({
        rules: [{ id: 'RULES-PROJECT', scope: 'project', path: 'docs', text: 'Rule.' }],
      }),
    );

    expect(result.ok).toBe(false);
  });

  it('accepts a path-scoped rule with a path', () => {
    const result = parseAgentDefinition(
      definition({
        rules: [{ id: 'RULES-PATHS', scope: 'path', path: 'packages/core', text: 'Rule.' }],
      }),
    );

    expect(result.ok).toBe(true);
  });

  it('defaults tool approval to always', () => {
    const result = parseAgentDefinition(definition({ tools: [{ name: 'shell' }] }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tools[0]).toEqual({ name: 'shell', required: false, approval: 'always' });
    }
  });

  it('rejects an unknown adapter compatibility target', () => {
    const result = parseAgentDefinition(definition({ compatibility: { adapters: ['cursor'] } }));

    expect(result.ok).toBe(false);
  });

  it('rejects unknown fields', () => {
    expect(parseAgentDefinition(definition({ prompt: 'not a field' })).ok).toBe(false);
  });
});
