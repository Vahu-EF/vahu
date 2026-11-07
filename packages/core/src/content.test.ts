import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ContentItem } from '@vahu-ef/schemas';
import { composeContent, validateContentModel, PRECEDENCE } from './content.js';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'vahu-content-'));
  await mkdir(join(root, 'packages/framework/core'), { recursive: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

interface StandardOptions {
  id?: string;
  status?: string;
  dependsOn?: string;
  projectTypes?: string;
  stages?: string;
  level?: string;
  deprecation?: string;
}

function standard(options: StandardOptions = {}): string {
  const id = options.id ?? 'P1-90';
  return `# ${id} — Example standard

- **Standard ID:** ${id}
- **Status:** ${options.status ?? 'Draft'}
- **Owner:** Example maintainers
- **Approver:** Example approver
- **Approval:** Pending
- **Version:** 0.1.0
- **Applies to:** Example projects
- **Content type:** standard
- **Lifecycle stages:** ${options.stages ?? 'implementation, review'}
- **Project types:** ${options.projectTypes ?? 'all'}
- **Depends on:** ${options.dependsOn ?? 'None'}
- **Tags:** example
- **Related:** None
${options.deprecation === undefined ? '' : `- **Deprecation:** ${options.deprecation}\n`}
## Purpose

A short description of the example standard.

## Scope

Example scope.

## Non-goals

None.

## Rules

### ${id}-R1 — Example rule

- **Level:** ${options.level ?? 'MUST'}
- **Rule:** Do the example thing.
- **Rationale:** It keeps the example consistent.
- **Verification:** Review.

## Examples

An example.

## Exceptions

None.

## Verification

Review.

## Related decisions

None.

## Change history

| Version | Date       | Change         |
| ------- | ---------- | -------------- |
| 0.1.0   | 2026-11-07 | Initial draft. |
`;
}

function guide(id = 'GUIDE-EXAMPLE', status = 'draft'): string {
  return `# Example guide

- **Content ID:** ${id}
- **Status:** ${status}
- **Owner:** Example maintainers
- **Version:** 0.1.0
- **Content type:** guide
- **Lifecycle stages:** planning
- **Project types:** all
- **Depends on:** None
- **Tags:** example

## Purpose

A short description of the example guide.
`;
}

async function writePage(name: string, content: string): Promise<void> {
  await writeFile(join(root, 'packages/framework/core', name), content, 'utf8');
}

describe('content discovery', () => {
  it('derives a mandatory item from a MUST rule and maps the status', async () => {
    await writePage('example.md', standard());

    const report = await validateContentModel(root);

    expect(report.issues).toEqual([]);
    expect(report.items).toHaveLength(1);
    expect(report.items[0]).toMatchObject({
      id: 'P1-90',
      title: 'Example standard',
      description: 'A short description of the example standard.',
      status: 'draft',
      contentType: 'standard',
      origin: 'core',
      enforcement: 'mandatory',
      projectTypes: ['all'],
      lifecycleStages: ['implementation', 'review'],
    });
  });

  it('maps an accepted standard to stable and a SHOULD-only standard to recommended', async () => {
    await writePage('accepted.md', standard({ id: 'P1-90', status: 'Accepted', level: 'SHOULD' }));

    const report = await validateContentModel(root);

    expect(report.items[0]?.status).toBe('stable');
    expect(report.items[0]?.enforcement).toBe('recommended');
  });

  it('accepts a non-standard content page with its own identifier', async () => {
    await writePage('guide.md', guide());

    const report = await validateContentModel(root);

    expect(report.issues).toEqual([]);
    expect(report.items[0]).toMatchObject({
      id: 'GUIDE-EXAMPLE',
      contentType: 'guide',
      enforcement: 'optional',
    });
  });

  it('ignores index pages and templates', async () => {
    await writeFile(join(root, 'packages/framework/core/README.md'), '# Index\n', 'utf8');
    await writeFile(
      join(root, 'packages/framework/core/PROFILE_TEMPLATE.md'),
      '# Template\n',
      'utf8',
    );

    const report = await validateContentModel(root);

    expect(report.issues).toEqual([]);
    expect(report.items).toEqual([]);
  });

  it('reports a content page without metadata', async () => {
    await writeFile(join(root, 'packages/framework/core/loose.md'), '# Loose page\n', 'utf8');

    const report = await validateContentModel(root);

    expect(report.issues.map((issue) => issue.code)).toContain('CONTENT_METADATA');
  });

  it('reports a missing required content field', async () => {
    await writePage(
      'example.md',
      standard().replace('- **Lifecycle stages:** implementation, review\n', ''),
    );

    const report = await validateContentModel(root);

    expect(report.issues.map((issue) => issue.code)).toContain('CONTENT_METADATA');
    expect(report.issues.some((issue) => issue.message.includes('Lifecycle stages'))).toBe(true);
  });

  it('reports a duplicate identifier', async () => {
    await writePage('first.md', standard({ id: 'P1-90' }));
    await writePage('second.md', standard({ id: 'P1-90' }));

    const report = await validateContentModel(root);

    expect(report.issues.map((issue) => issue.code)).toContain('CONTENT_ID_DUPLICATE');
  });

  it('reports an unknown dependency', async () => {
    await writePage('example.md', standard({ dependsOn: 'P1-99' }));

    const report = await validateContentModel(root);

    expect(report.issues.map((issue) => issue.code)).toContain('CONTENT_DEPENDENCY_UNKNOWN');
  });

  it('reports a dependency cycle', async () => {
    await writePage('a.md', standard({ id: 'P1-90', dependsOn: 'P1-91' }));
    await writePage('b.md', standard({ id: 'P1-91', dependsOn: 'P1-90' }));

    const report = await validateContentModel(root);

    expect(report.issues.map((issue) => issue.code)).toContain('CONTENT_DEPENDENCY_CYCLE');
  });

  it('reports deprecated content that names no replacement', async () => {
    await writePage('example.md', standard({ status: 'Superseded' }));

    const report = await validateContentModel(root);

    expect(report.issues.map((issue) => issue.code)).toContain('CONTENT_DEPRECATION');
  });

  it('accepts deprecated content that names a replacement', async () => {
    await writePage(
      'example.md',
      standard({ status: 'Superseded', deprecation: 'Replaced by P1-91.' }),
    );

    const report = await validateContentModel(root);

    expect(report.issues).toEqual([]);
    expect(report.items[0]?.status).toBe('deprecated');
  });

  it('reports an unknown project type', async () => {
    await writePage('example.md', standard({ projectTypes: 'all, spaceship' }));

    const report = await validateContentModel(root);

    expect(report.issues.map((issue) => issue.code)).toContain('CONTENT_PROJECT_TYPE');
  });
});

function item(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: 'P1-90',
    title: 'Example',
    description: 'Example item.',
    contentType: 'standard',
    origin: 'core',
    status: 'draft',
    version: '0.1.0',
    owner: 'Example',
    path: 'packages/framework/core/example.md',
    enforcement: 'recommended',
    projectTypes: ['all'],
    lifecycleStages: ['implementation'],
    dependencies: [],
    tags: [],
    ...overrides,
  };
}

describe('content composition', () => {
  it('filters items that do not apply to the project type', () => {
    const result = composeContent({
      projectType: 'backend-service',
      items: [item({ id: 'P1-01' }), item({ id: 'WEB-01', projectTypes: ['web-application'] })],
    });

    expect(result.items.map((entry) => entry.id)).toEqual(['P1-01']);
    expect(result.issues).toEqual([]);
  });

  it('filters items that do not apply to the requested lifecycle stage', () => {
    const result = composeContent({
      projectType: 'backend-service',
      stages: ['release'],
      items: [item({ id: 'P1-01', lifecycleStages: ['implementation'] })],
    });

    expect(result.items).toEqual([]);
  });

  it('refuses to disable a mandatory item', () => {
    const result = composeContent({
      projectType: 'backend-service',
      items: [item({ id: 'P1-13', enforcement: 'mandatory' })],
      overrides: [{ id: 'P1-13', enabled: false }],
    });

    expect(result.issues.map((issue) => issue.code)).toContain('COMPOSITION_MANDATORY_OVERRIDE');
    expect(result.items.map((entry) => entry.id)).toEqual(['P1-13']);
  });

  it('excludes a disabled recommended item', () => {
    const result = composeContent({
      projectType: 'backend-service',
      items: [item({ id: 'P1-05', enforcement: 'recommended' })],
      overrides: [{ id: 'P1-05', enabled: false }],
    });

    expect(result.items).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it('reports an override for an unknown item', () => {
    const result = composeContent({
      projectType: 'backend-service',
      items: [],
      overrides: [{ id: 'P1-77', enabled: false }],
    });

    expect(result.issues.map((issue) => issue.code)).toContain('COMPOSITION_UNKNOWN_ID');
  });

  it('includes an explicitly enabled item outside its declared scope', () => {
    const result = composeContent({
      projectType: 'backend-service',
      items: [item({ id: 'WEB-01', projectTypes: ['web-application'] })],
      overrides: [{ id: 'WEB-01', enabled: true }],
    });

    expect(result.items.map((entry) => entry.id)).toEqual(['WEB-01']);
    expect(result.items[0]?.precedence).toBe(PRECEDENCE.projectOverride);
  });

  it('orders results deterministically by precedence then identifier', () => {
    const result = composeContent({
      projectType: 'backend-service',
      items: [
        item({ id: 'P1-09', enforcement: 'recommended' }),
        item({ id: 'P1-13', enforcement: 'mandatory' }),
        item({ id: 'P1-02', enforcement: 'optional' }),
      ],
    });

    expect(result.items.map((entry) => entry.id)).toEqual(['P1-13', 'P1-09', 'P1-02']);
    expect(result.items.map((entry) => entry.precedence)).toEqual([
      PRECEDENCE.mandatory,
      PRECEDENCE.recommended,
      PRECEDENCE.optional,
    ]);
  });
});
