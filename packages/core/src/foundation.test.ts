import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectFoundation } from './foundation.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function directory(): Promise<string> {
  const created = await mkdtemp(join(tmpdir(), 'vahu-foundation-'));
  tempDirectories.push(created);
  return created;
}

describe('engineering foundation detection', () => {
  it('reports nothing for an empty directory', async () => {
    const report = detectFoundation(await directory());

    expect(report).toEqual({ scripts: [], ciWorkflows: [], docsPaths: [] });
  });

  it('detects scripts, workflows, docs, and the package manager', async () => {
    const created = await directory();
    await writeFile(
      join(created, 'package.json'),
      JSON.stringify({ packageManager: 'pnpm@10.0.0', scripts: { test: 'vitest', build: 'tsup' } }),
      'utf8',
    );
    await writeFile(join(created, 'README.md'), '# Project\n', 'utf8');
    await mkdir(join(created, '.github/workflows'), { recursive: true });
    await writeFile(join(created, '.github/workflows/ci.yml'), 'name: CI\n', 'utf8');

    const report = detectFoundation(created);

    expect(report.packageManager).toBe('pnpm@10.0.0');
    expect(report.scripts).toEqual(['build', 'test']);
    expect(report.ciWorkflows).toEqual(['ci.yml']);
    expect(report.docsPaths).toContain('README.md');
  });

  it('falls back to a lockfile when package.json has no manager', async () => {
    const created = await directory();
    await writeFile(join(created, 'package.json'), JSON.stringify({ scripts: {} }), 'utf8');
    await writeFile(join(created, 'pnpm-lock.yaml'), '', 'utf8');
    await writeFile(join(created, '.env.example'), '', 'utf8');

    const report = detectFoundation(created);

    expect(report.packageManager).toBe('pnpm');
    expect(report.envExample).toBe('.env.example');
  });
});
