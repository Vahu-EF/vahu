import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '../../..');
const cliPath = join(repoRoot, 'apps/cli/src/index.ts');
const tsxPath = join(repoRoot, 'node_modules/.bin/tsx');
const tempDirectories: string[] = [];

function runCli(args: string[], cwd = repoRoot) {
  return spawnSync(tsxPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function validConfig() {
  return {
    schemaVersion: '1.0.0',
    vahu: { version: '0.1.0' },
    project: {
      name: 'CLI Test',
      slug: 'cli-test',
      description: 'A test project.',
      purpose: 'Exercise the CLI.',
      targetUsers: ['developers'],
      type: 'backend-service',
      languages: ['en'],
      scope: 'Test fixture',
      constraints: [],
    },
    identity: { status: 'approved' },
    brand: { status: 'not-applicable' },
    designSystem: { status: 'not-applicable', source: 'none' },
    repositories: { strategy: 'monorepo' },
    technology: {
      backend: ['node'],
      frontend: [],
      mobile: [],
      database: [],
      infrastructure: [],
      testing: ['vitest'],
      deployment: [],
    },
    agents: { enabled: ['generic'], configuration: {} },
    readiness: { status: 'incomplete', notes: [] },
  };
}

async function createProject(config: unknown): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'vahu-cli-'));
  tempDirectories.push(directory);
  await mkdir(join(directory, '.vahu'));
  await writeFile(join(directory, '.vahu/project.json'), JSON.stringify(config), 'utf8');
  return directory;
}

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('vahu CLI', () => {
  it('prints the package version', () => {
    const result = runCli(['--version']);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('0.1.0');
  });

  it('prints help with the implemented commands', () => {
    const result = runCli(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('doctor');
    expect(result.stdout).toContain('validate');
  });

  it('runs doctor in a valid project', async () => {
    const directory = await createProject(validConfig());
    const result = runCli(['doctor'], directory);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('VAHU doctor');
    expect(result.stdout).toContain('Project configuration');
  });

  it('validates a valid configuration', async () => {
    const directory = await createProject(validConfig());
    const result = runCli(['validate', '--path', directory]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PASS: The project configuration is valid.');
  });

  it('returns a non-zero status for an invalid configuration', async () => {
    const directory = await createProject({ schemaVersion: '1.0.0' });
    const result = runCli(['validate', '--path', directory]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('ERROR');
  });
});
