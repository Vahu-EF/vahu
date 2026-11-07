import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseAgentDefinition, type AgentDefinition } from '@vahu-ef/schemas';
import { genericAdapter, renderGeneric } from './generic.js';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const definitionsDirectory = join(repositoryRoot, 'packages/framework/agents');

function definition(overrides: Record<string, unknown> = {}): AgentDefinition {
  const parsed = parseAgentDefinition({
    schemaVersion: '1.0.0',
    id: 'AGENT-REVIEWER',
    name: 'Reviewer',
    description: 'Reviews changes against the standards.',
    version: '0.1.0',
    instructions: ['Read the standard before reviewing.'],
    ...overrides,
  });

  if (!parsed.ok) {
    throw new Error(`Fixture is invalid: ${parsed.issues.map((issue) => issue.path).join(', ')}`);
  }
  return parsed.data;
}

describe('generic adapter', () => {
  it('states its output and capabilities', () => {
    expect(genericAdapter.outputPath).toBe('AGENTS.md');
    expect(genericAdapter.supported).toContain('rules');
    expect(genericAdapter.unsupported).toEqual([]);
  });

  it('renders a definition with every section', () => {
    const output = renderGeneric([
      definition({
        rules: [{ id: 'RULES-TESTS', scope: 'path', path: 'packages/core', text: 'Test it.' }],
        skills: [{ name: 'review', description: 'Review a change.', path: 'skills/review.md' }],
        commands: [{ name: 'test', description: 'Run tests.', run: 'pnpm test' }],
        workflows: [{ name: 'Review', steps: ['Read', 'Check'] }],
        tools: [{ name: 'shell', required: true, approval: 'on-write' }],
        context: [{ path: 'VAHU.md', description: 'Foundation.' }],
        approvals: ['Ask before publishing.'],
      }),
    ]);

    expect(output).toContain('# VAHU agent instructions');
    expect(output).toContain('**RULES-TESTS** (path: packages/core): Test it.');
    expect(output).toContain('- **test**: Run tests. — `pnpm test`');
    expect(output).toContain('1. Read\n2. Check');
    expect(output).toContain('**shell** (required; approval: on-write)');
    expect(output).toContain('`VAHU.md`: Foundation.');
    expect(output).toContain('Ask before publishing.');
  });

  it('is deterministic and orders definitions by identifier', () => {
    const reviewer = definition();
    const builder = definition({ id: 'AGENT-BUILDER', name: 'Builder' });

    const first = renderGeneric([reviewer, builder]);
    const second = renderGeneric([builder, reviewer]);

    expect(first).toBe(second);
    expect(first.indexOf('AGENT-BUILDER')).toBeLessThan(first.indexOf('AGENT-REVIEWER'));
  });

  it('reports an empty selection instead of inventing instructions', () => {
    expect(renderGeneric([])).toContain('No agent definitions were selected.');
  });

  it('renders the canonical definitions committed to the framework', () => {
    const files = readdirSync(definitionsDirectory).filter((name) => name.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);

    const definitions = files.sort().map((name) => {
      const parsed = parseAgentDefinition(
        JSON.parse(readFileSync(join(definitionsDirectory, name), 'utf8')),
      );
      if (!parsed.ok) {
        throw new Error(
          `${name} is invalid: ${parsed.issues.map((issue) => `${issue.path} ${issue.message}`).join('; ')}`,
        );
      }
      return parsed.data;
    });

    const output = renderGeneric(definitions);

    expect(output).toContain('AGENT-');
    expect(output.endsWith('\n')).toBe(true);
  });
});
