import { describe, expect, it } from 'vitest';
import { parseContentItem, type ContentItemInput } from './content.js';

function item(overrides: Partial<ContentItemInput> = {}): ContentItemInput {
  return {
    id: 'P1-03',
    title: 'Code quality',
    description: 'Rules for readable, maintainable code.',
    contentType: 'standard',
    origin: 'core',
    status: 'draft',
    version: '0.1.0',
    owner: 'VAHU maintainers',
    path: 'packages/framework/core/code-quality.md',
    enforcement: 'mandatory',
    projectTypes: ['all'],
    lifecycleStages: ['implementation'],
    dependencies: ['P1-14'],
    tags: ['quality'],
    ...overrides,
  };
}

describe('content item schema', () => {
  it('accepts a complete content item', () => {
    const result = parseContentItem(item());

    expect(result.ok).toBe(true);
  });

  it('defaults optional collections', () => {
    const minimal: Record<string, unknown> = { ...item() };
    delete minimal.dependencies;
    delete minimal.tags;
    const result = parseContentItem(minimal);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dependencies).toEqual([]);
      expect(result.data.tags).toEqual([]);
    }
  });

  it('rejects an identifier that is not stable and kebab-cased', () => {
    const result = parseContentItem(item({ id: 'code quality' }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('id');
    }
  });

  it('rejects an unknown content type', () => {
    const result = parseContentItem({ ...item(), contentType: 'blog-post' });

    expect(result.ok).toBe(false);
  });

  it('rejects an unknown status', () => {
    const result = parseContentItem({ ...item(), status: 'accepted' });

    expect(result.ok).toBe(false);
  });

  it('rejects an empty applicability list', () => {
    const result = parseContentItem(item({ projectTypes: [] }));

    expect(result.ok).toBe(false);
  });

  it('rejects a malformed version', () => {
    const result = parseContentItem(item({ version: 'v1' }));

    expect(result.ok).toBe(false);
  });

  it('accepts a specific project type', () => {
    const result = parseContentItem(item({ projectTypes: ['backend-service'] }));

    expect(result.ok).toBe(true);
  });
});
