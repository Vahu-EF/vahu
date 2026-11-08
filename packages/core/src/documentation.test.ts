import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateDocumentation } from './documentation.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'vahu-docs-'));
  tempDirectories.push(root);
  return root;
}

describe('documentation validation', () => {
  it('accepts local links across docs, examples, templates, framework, and website Markdown', async () => {
    const root = await createRoot();
    await mkdir(join(root, 'docs/guides'), { recursive: true });
    await mkdir(join(root, 'examples/demo'), { recursive: true });
    await mkdir(join(root, 'templates/project'), { recursive: true });
    await mkdir(join(root, 'packages/framework/core'), { recursive: true });
    await mkdir(join(root, 'apps/website/content'), { recursive: true });
    await writeFile(join(root, 'docs/guides/start.md'), '[Demo](../../examples/demo/README.md)');
    await writeFile(
      join(root, 'examples/demo/README.md'),
      '[Template](../../templates/project/README.md)',
    );
    await writeFile(
      join(root, 'templates/project/README.md'),
      '[Standard](../../packages/framework/core/standard.md)',
    );
    await writeFile(
      join(root, 'packages/framework/core/standard.md'),
      '[Site](../../../apps/website/content/page.md)',
    );
    await writeFile(
      join(root, 'apps/website/content/page.md'),
      '[Getting started](../../../docs/guides/start.md)',
    );

    const report = await validateDocumentation(root);

    expect(report.ok).toBe(true);
    expect(report.filesChecked).toBe(5);
    expect(report.issues).toEqual([]);
  });

  it('reports each unresolved local link with its source file', async () => {
    const root = await createRoot();
    await mkdir(join(root, 'docs'), { recursive: true });
    await writeFile(join(root, 'README.md'), '[Missing](docs/missing.md)');
    await writeFile(join(root, 'docs/guide.md'), '[Also missing](../missing.md)');

    const report = await validateDocumentation(root);

    expect(report.ok).toBe(false);
    expect(report.filesChecked).toBe(2);
    expect(report.issues).toEqual([
      {
        code: 'LINK_UNRESOLVED',
        path: 'README.md',
        message: 'Relative link does not resolve: docs/missing.md',
      },
      {
        code: 'LINK_UNRESOLVED',
        path: 'docs/guide.md',
        message: 'Relative link does not resolve: ../missing.md',
      },
    ]);
  });

  it('rejects links that escape the repository root', async () => {
    const root = await createRoot();
    await writeFile(join(root, 'README.md'), '[Outside](../secret.txt)');

    const report = await validateDocumentation(root);

    expect(report.ok).toBe(false);
    expect(report.issues[0]).toEqual({
      code: 'LINK_OUTSIDE_ROOT',
      path: 'README.md',
      message: 'Local link resolves outside the repository: ../secret.txt',
    });
  });

  it('does not follow a symlinked documentation directory outside the repository', async (context) => {
    const root = await createRoot();
    const outside = await mkdtemp(join(tmpdir(), 'vahu-docs-tree-'));
    tempDirectories.push(outside);
    await writeFile(join(outside, 'leak.md'), '[Missing](missing.md)');
    try {
      await symlink(outside, join(root, 'docs'), 'dir');
    } catch {
      context.skip();
      return;
    }

    const report = await validateDocumentation(root);

    expect(report.filesChecked).toBe(0);
    expect(report.issues).toEqual([]);
  });

  it('rejects a link that resolves through a symlink outside the repository', async (context) => {
    const root = await createRoot();
    const outside = await mkdtemp(join(tmpdir(), 'vahu-docs-outside-'));
    tempDirectories.push(outside);
    await writeFile(join(outside, 'secret.md'), '# Private\\n');
    try {
      await symlink(outside, join(root, 'external'));
    } catch {
      context.skip();
      return;
    }
    await writeFile(join(root, 'README.md'), '[Outside](external/secret.md)');

    const report = await validateDocumentation(root);

    expect(report.ok).toBe(false);
    expect(report.issues[0]?.code).toBe('LINK_OUTSIDE_ROOT');
  });

  it('ignores missing optional content directories', async () => {
    const root = await createRoot();

    const report = await validateDocumentation(root);

    expect(report.ok).toBe(true);
    expect(report.filesChecked).toBe(0);
    expect(report.issues).toEqual([]);
  });
});
