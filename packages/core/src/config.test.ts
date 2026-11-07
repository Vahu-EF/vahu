import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadProjectConfig, saveProjectConfig } from './config.js';
import { buildProjectConfig } from './onboarding.js';

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

  it('reads a migrated 1.0.0 configuration', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    const legacy = {
      schemaVersion: '1.0.0',
      vahu: { version: '0.1.0' },
      project: {
        name: 'Legacy',
        slug: 'legacy',
        description: 'A file from before the migration.',
        purpose: 'Verify migration.',
        targetUsers: ['developers'],
        type: 'backend-service',
        languages: ['en'],
        scope: 'Test',
        constraints: [],
      },
      identity: { status: 'approved' },
      brand: { status: 'not-applicable' },
      designSystem: { status: 'not-started', source: 'none' },
      repositories: { strategy: 'monorepo' },
      technology: {
        backend: [],
        frontend: [],
        mobile: [],
        database: [],
        infrastructure: [],
        testing: [],
        deployment: [],
      },
      agents: { enabled: ['generic'], configuration: {} },
      readiness: { status: 'incomplete', notes: [] },
    };
    await mkdir(join(directory, '.vahu'));
    await writeFile(join(directory, '.vahu/project.json'), JSON.stringify(legacy), 'utf8');

    const loaded = await loadProjectConfig(directory);

    expect(loaded.status).toBe('valid');
    if (loaded.status === 'valid') {
      expect(loaded.migratedFrom).toBe('1.0.0');
      expect(loaded.config.schemaVersion).toBe('1.1.0');
    }
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

function sampleConfig() {
  return buildProjectConfig({
    name: 'Saved Project',
    slug: 'saved-project',
    description: 'A project written by a test.',
    purpose: 'Verify writing.',
    targetUsers: ['developers'],
    type: 'backend-service',
    languages: ['en'],
    scope: 'Test',
    constraints: [],
    nonGoals: [],
    repositories: [],
  });
}

describe('project configuration writing', () => {
  it('creates the configuration and its directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);

    const saved = await saveProjectConfig(directory, sampleConfig());

    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.created).toBe(true);
    }
    expect(await loadProjectConfig(directory)).toMatchObject({ status: 'valid' });
  });

  it('refuses to replace an existing configuration without permission', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    await saveProjectConfig(directory, sampleConfig());

    const saved = await saveProjectConfig(directory, sampleConfig());

    expect(saved.ok).toBe(false);
    if (!saved.ok) {
      expect(saved.reason).toBe('exists');
    }
  });

  it('replaces an existing configuration when overwrite is explicit', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    await saveProjectConfig(directory, sampleConfig());

    const saved = await saveProjectConfig(directory, sampleConfig(), { overwrite: true });

    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.created).toBe(false);
    }
  });
});
