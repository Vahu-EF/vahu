import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REQUIRED_WORKSPACE_PATHS, validateWorkspace } from './workspace.js';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'vahu-workspace-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function createRequiredPaths(): Promise<void> {
  for (const requiredPath of REQUIRED_WORKSPACE_PATHS) {
    if (requiredPath.includes('.')) {
      await writeFile(join(root, requiredPath), '\n', 'utf8').catch(async () => {
        await mkdir(join(root, requiredPath), { recursive: true });
      });
    } else {
      await mkdir(join(root, requiredPath), { recursive: true });
    }
  }
}

async function writePackage(parent: string, name: string, manifest: object): Promise<void> {
  const directory = join(root, parent);
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify({ name, version: '0.1.0', ...manifest }),
    'utf8',
  );
}

describe('workspace validation', () => {
  it('accepts a workspace with the required structure', async () => {
    await createRequiredPaths();
    await writePackage('packages/core', '@vahu-ef/core', {});

    const report = await validateWorkspace(root);

    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.packages).toBe(1);
  });

  it('reports a missing required path', async () => {
    await createRequiredPaths();
    await rm(join(root, 'SECURITY.md'));

    const report = await validateWorkspace(root);

    expect(report.issues.map((issue) => issue.code)).toContain('WORKSPACE_MISSING_PATH');
  });

  it('reports a second technology-profile location', async () => {
    await createRequiredPaths();
    await mkdir(join(root, 'profiles'), { recursive: true });

    const report = await validateWorkspace(root);

    expect(report.issues.map((issue) => issue.code)).toContain('WORKSPACE_DUPLICATE_PROFILES');
  });

  it('reports a duplicate package name', async () => {
    await createRequiredPaths();
    await writePackage('packages/core', '@vahu-ef/core', {});
    await writePackage('packages/other', '@vahu-ef/core', {});

    const report = await validateWorkspace(root);

    expect(report.issues.map((issue) => issue.code)).toContain('WORKSPACE_DUPLICATE_NAME');
  });

  it('reports a forbidden package dependency', async () => {
    await createRequiredPaths();
    await writePackage('packages/core', '@vahu-ef/core', {});
    await writePackage('packages/schemas', '@vahu-ef/schemas', {
      dependencies: { '@vahu-ef/core': 'workspace:*' },
    });

    const report = await validateWorkspace(root);

    expect(report.issues.map((issue) => issue.code)).toContain('WORKSPACE_FORBIDDEN_DEPENDENCY');
  });

  it('reports a workspace dependency cycle', async () => {
    await createRequiredPaths();
    await writePackage('packages/core', '@vahu-ef/core', {
      dependencies: { '@vahu-ef/schemas': 'workspace:*' },
    });
    await writePackage('packages/schemas', '@vahu-ef/schemas', {
      dependencies: { vahu: 'workspace:*' },
    });
    await writePackage('apps/cli', 'vahu', {
      dependencies: { '@vahu-ef/core': 'workspace:*' },
    });

    const report = await validateWorkspace(root);

    expect(report.issues.map((issue) => issue.code)).toContain('WORKSPACE_DEPENDENCY_CYCLE');
  });

  it('accepts an allowed dependency direction', async () => {
    await createRequiredPaths();
    await writePackage('packages/schemas', '@vahu-ef/schemas', {});
    await writePackage('packages/core', '@vahu-ef/core', {
      dependencies: { '@vahu-ef/schemas': 'workspace:*' },
    });
    await writePackage('apps/cli', 'vahu', {
      dependencies: { '@vahu-ef/core': 'workspace:*', '@vahu-ef/schemas': 'workspace:*' },
    });

    const report = await validateWorkspace(root);

    expect(report.issues).toEqual([]);
    expect(report.packages).toBe(3);
  });
});
