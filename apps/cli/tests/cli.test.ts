import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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

  it('initializes a configuration with a pending identity', async () => {
    const directory = await emptyDirectory();

    const result = runCli(initArgs(directory));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Created');
    const config = await readConfig(directory);
    expect(config.project.slug).toBe('example-service');
    expect(config.identity.status).toBe('pending');
  });

  it('blocks validation until the identity is approved', async () => {
    const directory = await emptyDirectory();
    runCli(initArgs(directory));

    const before = runCli(['validate', '--path', directory]);
    expect(before.status).toBe(1);
    expect(before.stdout).toContain('identity');

    const approval = runCli(['identity', 'approve', '--path', directory, '--by', 'Test Owner']);
    expect(approval.status).toBe(0);
    expect(approval.stdout).toContain('Identity approved by Test Owner.');

    const after = runCli(['validate', '--path', directory]);
    expect(after.status).toBe(0);
    expect(after.stdout).toContain('0 blocking issue(s)');
  });

  it('shows the identity status', async () => {
    const directory = await emptyDirectory();
    runCli(initArgs(directory));

    const result = runCli(['identity', '--path', directory]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Status: pending');
  });

  it('refuses to replace an existing configuration without --force', async () => {
    const directory = await emptyDirectory();
    runCli(initArgs(directory));
    const original = await readFile(join(directory, '.vahu/project.json'), 'utf8');

    const result = runCli(initArgs(directory));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--force');
    expect(await readFile(join(directory, '.vahu/project.json'), 'utf8')).toBe(original);
  });

  it('requires explicit answers when no interactive terminal exists', async () => {
    const directory = await emptyDirectory();

    const result = runCli(['init', '--path', directory, '--yes']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Missing required answers');
  });

  it('reports a missing configuration for identity approval', async () => {
    const directory = await emptyDirectory();

    const result = runCli(['identity', 'approve', '--path', directory, '--by', 'Test Owner']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Run `vahu init` first.');
  });
});

function initArgs(directory: string): string[] {
  return [
    'init',
    '--path',
    directory,
    '--name',
    'Example Service',
    '--description',
    'A service that does one thing.',
    '--purpose',
    'Serve one use case well.',
    '--users',
    'developers',
    '--type',
    'backend-service',
    '--scope',
    'First release',
    '--yes',
  ];
}

async function emptyDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'vahu-cli-'));
  tempDirectories.push(directory);
  return directory;
}

async function readConfig(directory: string): Promise<{
  project: { slug: string };
  identity: { status: string };
}> {
  const source = await readFile(join(directory, '.vahu/project.json'), 'utf8');
  return JSON.parse(source) as { project: { slug: string }; identity: { status: string } };
}
