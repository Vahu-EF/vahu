import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadProjectConfig } from './config.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('project configuration loading', () => {
  it('reports a missing configuration', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    const loaded = await loadProjectConfig(directory);
    expect(loaded.status).toBe('missing');
  });

  it('reports invalid JSON', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    await mkdir(join(directory, '.vahu'));
    await writeFile(join(directory, '.vahu/project.json'), '{', 'utf8');
    const loaded = await loadProjectConfig(directory);
    expect(loaded.status).toBe('invalid-json');
  });
});
