import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateStandards } from './standards.js';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'vahu-standards-'));
  await mkdir(join(root, 'packages/framework/core'), { recursive: true });
  await mkdir(join(root, 'architecture/decisions'), { recursive: true });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function standard(options: { id?: string; extraRule?: string; omit?: string } = {}): string {
  const id = options.id ?? 'P1-99';
  const sections = options.omit ? '' : '';
  return `# ${id} — Example standard

- **Standard ID:** ${id}
- **Status:** Draft
- **Owner:** Example maintainers
- **Approver:** Example approver
- **Approval:** Pending
- **Version:** 0.1.0
- **Applies to:** Example projects
- **Related:** [Phase 1 specification](../../../architecture/specifications/phase-1.md)

## Purpose

Explain the reason for the standard.

## Scope

Explain what the standard covers.

## Non-goals

Explain what it does not cover.

## Rules

### ${id}-R1 — First rule

- **Level:** MUST
- **Rule:** State one testable rule.
- **Rationale:** Explain why the rule exists.
- **Verification:** Review.

### ${id}-R2 — Second rule

- **Level:** SHOULD
- **Rule:** State another rule.
- **Rationale:** Explain why the rule exists.
- **Verification:** Review.

## Examples

A compliant example.

## Exceptions

None.

## Verification

Run the repository gate.

## Related decisions

None.

## Change history

| Version | Date       | Change         |
| ------- | ---------- | -------------- |
| 0.1.0   | 2026-11-07 | Initial draft. |
${options.extraRule ?? ''}${sections}`;
}

async function writeStandard(name: string, content: string): Promise<void> {
  await writeFile(join(root, 'packages/framework/core', name), content, 'utf8');
}

async function writeSupportingFiles(): Promise<void> {
  await mkdir(join(root, 'architecture/specifications'), { recursive: true });
  await writeFile(
    join(root, 'architecture/specifications/phase-1.md'),
    '# Phase 1 specification\n',
    'utf8',
  );
}

async function writeAdr(number: string, title: string): Promise<void> {
  await writeFile(
    join(root, `architecture/decisions/ADR-${number}.md`),
    `# ADR-${number}: ${title}\n\n- **Status:** Accepted\n`,
    'utf8',
  );
}

async function writeAdrIndex(links: readonly string[]): Promise<void> {
  const rows = links.map((link) => `| [${link}](${link}) | Example | Accepted |`).join('\n');
  await writeFile(
    join(root, 'architecture/decisions/README.md'),
    `# Architecture decisions\n\n| ID | Decision | Status |\n| -- | -------- | ------ |\n${rows}\n`,
    'utf8',
  );
}

describe('standards validation', () => {
  it('accepts a well-formed standard page', async () => {
    await writeSupportingFiles();
    await writeStandard('example.md', standard());

    const report = await validateStandards(root);

    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.standardsChecked).toBe(1);
  });

  it('reports a missing required metadata field', async () => {
    await writeSupportingFiles();
    await writeStandard('example.md', standard().replace('- **Owner:** Example maintainers\n', ''));

    const report = await validateStandards(root);

    expect(report.ok).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain('STANDARD_METADATA');
    expect(report.issues[0]?.message).toContain('Owner');
  });

  it('reports an unknown standard status', async () => {
    await writeSupportingFiles();
    await writeStandard('example.md', standard().replace('**Status:** Draft', '**Status:** Live'));

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('STANDARD_STATUS');
  });

  it('reports a missing required section', async () => {
    await writeSupportingFiles();
    await writeStandard('example.md', standard().replace('## Exceptions\n\nNone.\n\n', ''));

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('STANDARD_SECTION');
  });

  it('reports required sections that are out of order', async () => {
    await writeSupportingFiles();
    const reordered = standard()
      .replace('## Scope\n\nExplain what the standard covers.\n\n', '')
      .replace(
        '## Exceptions\n\nNone.\n\n',
        '## Exceptions\n\nNone.\n\n## Scope\n\nExplain what the standard covers.\n\n',
      );
    await writeStandard('example.md', reordered);

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('STANDARD_SECTION_ORDER');
  });

  it('reports a rule ID that does not match the standard ID', async () => {
    await writeSupportingFiles();
    await writeStandard('example.md', standard().replace('### P1-99-R2', '### P1-98-R2'));

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('RULE_ID');
  });

  it('reports a duplicate rule ID', async () => {
    await writeSupportingFiles();
    await writeStandard(
      'example.md',
      standard().replace('### P1-99-R2 — Second rule', '### P1-99-R1 — Second rule'),
    );

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('RULE_DUPLICATE');
  });

  it('reports an invalid rule level', async () => {
    await writeSupportingFiles();
    await writeStandard(
      'example.md',
      standard().replace('**Level:** SHOULD', '**Level:** SHOULD MAYBE'),
    );

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('RULE_LEVEL');
  });

  it('reports a rule without a verification statement', async () => {
    await writeSupportingFiles();
    await writeStandard(
      'example.md',
      standard().replace(
        '### P1-99-R2 — Second rule\n\n- **Level:** SHOULD\n- **Rule:** State another rule.\n- **Rationale:** Explain why the rule exists.\n- **Verification:** Review.',
        '### P1-99-R2 — Second rule\n\n- **Level:** SHOULD\n- **Rule:** State another rule.\n- **Rationale:** Explain why the rule exists.',
      ),
    );

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('RULE_FIELD');
  });

  it('reports a standard page with no rules', async () => {
    await writeSupportingFiles();
    await writeStandard(
      'example.md',
      standard().replace(/### P1-99-R[12][\s\S]*?(?=## Examples)/, ''),
    );

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('RULE_MISSING');
  });

  it('reports a relative link that does not resolve', async () => {
    await writeSupportingFiles();
    await writeStandard(
      'example.md',
      standard().replace(
        '](../../../architecture/specifications/phase-1.md)',
        '](../../../architecture/specifications/missing.md)',
      ),
    );

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('LINK_UNRESOLVED');
  });

  it('ignores external links and same-page anchors', async () => {
    await writeSupportingFiles();
    await writeStandard(
      'example.md',
      standard().replace(
        '## Related decisions\n\nNone.',
        '## Related decisions\n\n- https://example.com\n- [Rules](#rules)',
      ),
    );

    const report = await validateStandards(root);

    expect(report.issues).toEqual([]);
  });

  it('reports an ADR that is missing from the decision index', async () => {
    await writeAdr('0001', 'First decision');
    await writeAdr('0002', 'Second decision');
    await writeAdrIndex(['ADR-0001.md']);

    const report = await validateStandards(root);

    expect(report.ok).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain('ADR_INDEX_MISSING');
    expect(report.adrsChecked).toBe(2);
  });

  it('accepts a complete ADR index', async () => {
    await writeAdr('0001', 'First decision');
    await writeAdr('0002', 'Second decision');
    await writeAdrIndex(['ADR-0001.md', 'ADR-0002.md']);

    const report = await validateStandards(root);

    expect(report.issues).toEqual([]);
    expect(report.adrsChecked).toBe(2);
  });

  it('reports an ADR index link that does not resolve', async () => {
    await writeAdr('0001', 'First decision');
    await writeAdrIndex(['ADR-0001.md', 'ADR-0009.md']);

    const report = await validateStandards(root);

    expect(report.issues.map((issue) => issue.code)).toContain('LINK_UNRESOLVED');
  });

  it('ignores framework pages that are not standard pages', async () => {
    await writeFile(join(root, 'packages/framework/core/README.md'), '# Notes\n', 'utf8');

    const report = await validateStandards(root);

    expect(report.issues).toEqual([]);
    expect(report.standardsChecked).toBe(0);
  });
});
