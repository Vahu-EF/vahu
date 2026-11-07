import { existsSync } from 'node:fs';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
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

  it('replaces the file atomically instead of rewriting it in place', async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    await saveProjectConfig(directory, sampleConfig());
    const configPath = join(directory, '.vahu/project.json');
    const before = await stat(configPath);
    if (before.ino === 0) {
      // Filesystems without stable inode numbers cannot express this check.
      context.skip();
      return;
    }

    await saveProjectConfig(directory, sampleConfig(), { overwrite: true });

    const after = await stat(configPath);
    expect(after.ino).not.toBe(before.ino);
  });

  it('replaces a symlink at the configuration path instead of writing through it', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    const outsideDirectory = await mkdtemp(join(tmpdir(), 'vahu-outside-'));
    tempDirectories.push(directory, outsideDirectory);
    const outsideFile = join(outsideDirectory, 'planted.json');
    await writeFile(outsideFile, '{"keep":true}\n', 'utf8');
    await mkdir(join(directory, '.vahu'));
    try {
      await symlink(outsideFile, join(directory, '.vahu/project.json'));
    } catch {
      // Symlink creation may be unavailable or unprivileged on this platform.
      return;
    }

    const saved = await saveProjectConfig(directory, sampleConfig(), { overwrite: true });

    expect(saved.ok).toBe(true);
    expect(await readFile(outsideFile, 'utf8')).toBe('{"keep":true}\n');
    const written = await lstat(join(directory, '.vahu/project.json'));
    expect(written.isSymbolicLink()).toBe(false);
  });

  it('leaves no temporary files behind when the write fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    // A directory at the target path makes the final replace fail.
    await mkdir(join(directory, '.vahu/project.json'), { recursive: true });

    await expect(
      saveProjectConfig(directory, sampleConfig(), { overwrite: true }),
    ).rejects.toThrow();

    expect(await readdir(join(directory, '.vahu'))).toEqual(['project.json']);
  });

  it('keeps the configuration inside the resolved project directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-config-'));
    tempDirectories.push(directory);
    await mkdir(join(directory, 'nested'));

    const saved = await saveProjectConfig(join(directory, 'nested', '..'), sampleConfig());

    expect(saved.ok).toBe(true);
    expect(existsSync(join(directory, '.vahu/project.json'))).toBe(true);
    expect(existsSync(join(directory, 'nested', '.vahu'))).toBe(false);
  });
});
