import { access, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '../../..');
const cliPath = join(repoRoot, 'apps/cli/src/index.ts');
const require = createRequire(import.meta.url);
const tsxCliPath = require.resolve('tsx/cli');
const tempDirectories: string[] = [];

function runCli(args: string[], cwd = repoRoot) {
  return spawnSync(process.execPath, [tsxCliPath, cliPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function runBuiltCli(args: string[], cwd: string) {
  return spawnSync(process.execPath, [join(repoRoot, 'apps/cli/dist/index.js'), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function validConfig(version: '1.0.0' | '1.1.0' = '1.1.0') {
  return {
    schemaVersion: version,
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
      ...(version === '1.1.0' ? { nonGoals: [] } : {}),
    },
    identity: { status: 'approved' },
    brand: { status: 'not-applicable' },
    designSystem: { status: 'not-applicable', source: 'none' },
    repositories: {
      strategy: 'monorepo',
      ...(version === '1.1.0' ? { locations: [] } : {}),
    },
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
    expect(result.stdout).toContain('project');
    expect(result.stdout).toContain('profile');
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

  it('validates every committed example project configuration', async () => {
    const examplesRoot = join(repoRoot, 'examples');
    const examples = (await readdir(examplesRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const projects = [] as string[];
    for (const example of examples) {
      try {
        await access(join(examplesRoot, example, '.vahu/project.json'));
        projects.push(example);
      } catch {
        // Documentation-only example directories aren't project fixtures.
      }
    }

    expect(projects.length).toBeGreaterThanOrEqual(5);
    for (const example of projects) {
      const result = runCli(['validate', '--path', join(examplesRoot, example)]);
      expect(result.status, `${example}: ${result.stdout}\n${result.stderr}`).toBe(0);
    }
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

  it('captures the schema 1.1.0 identity fields', async () => {
    const directory = await emptyDirectory();

    const result = runCli([
      ...initArgs(directory),
      '--long-description',
      'A longer explanation of the service.',
      '--lifecycle',
      'active',
      '--non-goals',
      'Not a marketplace',
      '--repository',
      'api=apps/api',
    ]);

    expect(result.status).toBe(0);
    const config = await readConfig(directory);
    expect(config.schemaVersion).toBe('1.1.0');
    expect(config.project.longDescription).toBe('A longer explanation of the service.');
    expect(config.project.lifecycle).toBe('active');
    expect(config.project.nonGoals).toEqual(['Not a marketplace']);
    expect(config.repositories.locations).toEqual([{ name: 'api', path: 'apps/api' }]);
  });

  it('previews a schema migration without writing until asked', async () => {
    const directory = await createProject(validConfig('1.0.0'));

    const preview = runCli(['migrate', '--path', directory]);

    expect(preview.status).toBe(0);
    expect(preview.stdout).toContain('Read-only');
    expect((await readConfig(directory)).schemaVersion).toBe('1.0.0');

    const written = runCli(['migrate', '--path', directory, '--write']);

    expect(written.status).toBe(0);
    const config = await readConfig(directory);
    expect(config.schemaVersion).toBe('1.1.0');
    expect(config.project.nonGoals).toEqual([]);
    expect(runCli(['validate', '--path', directory]).status).toBe(0);
  });

  it('reports a configuration that is already current', async () => {
    const directory = await createProject(validConfig());

    const result = runCli(['migrate', '--path', directory]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('already uses schema 1.1.0');
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

  it('requires a reason before marking branding not applicable', async () => {
    const directory = await createProject(validConfig());

    const refused = runCli(['brand', '--path', directory, '--status', 'not-applicable']);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain('recorded reason');

    const accepted = runCli([
      'brand',
      '--path',
      directory,
      '--status',
      'not-applicable',
      '--notes',
      'Internal service.',
    ]);
    expect(accepted.status).toBe(0);
    const config = await readConfig(directory);
    expect(config.brand.status).toBe('not-applicable');
    expect(config.brand.notes).toBe('Internal service.');
  });

  it('approves a design system only when it has a source and path', async () => {
    const directory = await createProject(validConfig());

    const refused = runCli(['design', 'approve', '--directory', directory]);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain('source');

    const prepared = runCli([
      'design',
      '--directory',
      directory,
      '--status',
      'pending-approval',
      '--source',
      'existing',
      '--path',
      'docs/design-system.md',
    ]);
    expect(prepared.status).toBe(0);

    const approved = runCli(['design', 'approve', '--directory', directory]);
    expect(approved.status).toBe(0);
    expect((await readConfig(directory)).designSystem.status).toBe('approved');
  });

  it('selects technologies by area', async () => {
    const directory = await createProject(validConfig());

    const result = runCli([
      'technology',
      '--path',
      directory,
      '--area',
      'backend',
      '--add',
      'node, postgresql',
    ]);

    expect(result.status).toBe(0);
    expect((await readConfig(directory)).technology.backend).toEqual(['node', 'postgresql']);
  });

  it('records the repository strategy and locations', async () => {
    const directory = await createProject(validConfig());

    const result = runCli([
      'repositories',
      '--path',
      directory,
      '--strategy',
      'hybrid',
      '--notes',
      'API and documentation live apart.',
      '--location',
      'api=.',
      '--location',
      'docs=https://example.com/docs',
      '--owner',
      'api=platform',
      '--owner',
      'docs=documentation team',
    ]);

    expect(result.status).toBe(0);
    const config = await readConfig(directory);
    expect(config.repositories.strategy).toBe('hybrid');
    expect(config.repositories.locations).toEqual([
      { name: 'api', path: '.', owner: 'platform' },
      { name: 'docs', url: 'https://example.com/docs', owner: 'documentation team' },
    ]);
  });

  it('updates repository ownership for an existing location and rejects unknown or duplicate assignments', async () => {
    const directory = await createProject({
      ...validConfig(),
      repositories: {
        strategy: 'monorepo',
        locations: [{ name: 'api', path: 'apps/api' }],
      },
    });

    const updated = runCli(['repositories', '--path', directory, '--owner', 'api=platform']);
    expect(updated.status).toBe(0);
    expect((await readConfig(directory)).repositories.locations).toEqual([
      { name: 'api', path: 'apps/api', owner: 'platform' },
    ]);

    const refused = runCli(['repositories', '--path', directory, '--owner', 'web=frontend']);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain('must refer to a configured repository location');

    const duplicate = runCli([
      'repositories',
      '--path',
      directory,
      '--owner',
      'api=platform',
      '--owner',
      'api=another-team',
    ]);
    expect(duplicate.status).toBe(1);
    expect(duplicate.stderr).toContain('provided at most once');
    expect((await readConfig(directory)).repositories.locations).toEqual([
      { name: 'api', path: 'apps/api', owner: 'platform' },
    ]);
  });

  it('reports readiness and records the status only when asked', async () => {
    const directory = await createProject({ ...validConfig(), identity: { status: 'pending' } });

    const blocked = runCli(['readiness', '--path', directory]);
    expect(blocked.status).toBe(1);
    expect(blocked.stdout).toContain('Status: blocked');
    expect((await readConfig(directory)).readiness.checkedAt).toBeUndefined();

    const recorded = runCli(['readiness', '--path', directory, '--record']);
    expect(recorded.status).toBe(1);
    const config = await readConfig(directory);
    expect(config.readiness.status).toBe('blocked');
    expect(config.readiness.checkedAt).toBeDefined();
  });

  it('inspects a project with a versioned JSON contract without writing', async () => {
    const directory = await createProject(validConfig());
    const original = await readFile(join(directory, '.vahu/project.json'), 'utf8');

    const result = runCli(['project', 'inspect', '--path', directory, '--json']);

    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout) as {
      contractVersion: string;
      reportType: string;
      view: string;
      ok: boolean;
      project: { name: string; slug: string; type: string };
      readiness: { status: string };
    };
    expect(report.contractVersion).toBe('1.0.0');
    expect(report.reportType).toBe('project-report');
    expect(report.view).toBe('inspect');
    expect(report.ok).toBe(true);
    expect(report.project.name).toBe('CLI Test');
    expect(report.project.slug).toBe('cli-test');
    expect(report.readiness.status).toBe('ready');
    expect(await readFile(join(directory, '.vahu/project.json'), 'utf8')).toBe(original);
  });

  it('shows computed status in a human-readable project status report', async () => {
    const directory = await createProject({ ...validConfig(), identity: { status: 'pending' } });

    const result = runCli(['project', 'status', '--path', directory]);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('VAHU project status');
    expect(result.stdout).toContain('Status: blocked');
    expect(result.stdout).toContain('Identity: pending');
  });

  it('returns versioned JSON and a non-zero exit for a missing project', async () => {
    const directory = await emptyDirectory();

    const result = runCli(['project', 'inspect', '--path', directory, '--json']);

    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout) as {
      contractVersion: string;
      reportType: string;
      view: string;
      ok: boolean;
    };
    expect(report.contractVersion).toBe('1.0.0');
    expect(report.reportType).toBe('project-report');
    expect(report.view).toBe('inspect');
    expect(report.ok).toBe(false);
  });

  it('lists technology profiles as versioned JSON', async () => {
    const directory = await emptyDirectory();

    const result = runCli(['profile', 'list', '--json'], directory);

    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout) as {
      contractVersion: string;
      reportType: string;
      ok: boolean;
      profiles: Array<{ id: string; technology: string }>;
    };
    expect(report.contractVersion).toBe('1.0.0');
    expect(report.reportType).toBe('profile-list');
    expect(report.ok).toBe(true);
    expect(report.profiles.map((profile) => profile.id)).toContain('PROFILE-POSTGRESQL');
  });

  it('validates a profile catalog and exits unsuccessfully for invalid data', async () => {
    const directory = await emptyDirectory();
    await writeFile(join(directory, 'broken.json'), '{', 'utf8');

    const result = runCli(['profile', 'validate', '--path', directory, '--json']);

    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout) as {
      contractVersion: string;
      reportType: string;
      ok: boolean;
      issues: Array<{ code: string }>;
    };
    expect(report.contractVersion).toBe('1.0.0');
    expect(report.reportType).toBe('profile-validation');
    expect(report.ok).toBe(false);
    expect(report.issues[0]?.code).toBe('PROFILE_INVALID_JSON');
  });

  it('lists bundled profiles from the built CLI outside the source repository', async () => {
    const directory = await emptyDirectory();

    const result = runBuiltCli(['profile', 'list', '--json'], directory);

    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(result.stdout) as {
      ok: boolean;
      profiles: Array<{ id: string }>;
    };
    expect(report.ok).toBe(true);
    expect(report.profiles).toHaveLength(3);
  });

  it('validates the framework profile catalog', async () => {
    const directory = await emptyDirectory();

    const result = runCli(['profile', 'validate', '--json'], directory);

    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout) as {
      contractVersion: string;
      reportType: string;
      ok: boolean;
      profilesChecked: number;
    };
    expect(report.contractVersion).toBe('1.0.0');
    expect(report.reportType).toBe('profile-validation');
    expect(report.ok).toBe(true);
    expect(report.profilesChecked).toBe(3);
  });

  it('previews profile changes and writes them only when explicitly requested', async () => {
    const projectConfig = validConfig();
    projectConfig.technology.backend = [];
    const directory = await createProject(projectConfig);

    const addPreview = runCli([
      'profile',
      'add',
      'PROFILE-NODE-BACKEND',
      '--area',
      'backend',
      '--path',
      directory,
      '--json',
    ]);
    expect(addPreview.status).toBe(0);
    expect(JSON.parse(addPreview.stdout)).toMatchObject({
      contractVersion: '1.0.0',
      reportType: 'profile-selection-change',
      action: 'add',
      written: false,
      changed: true,
      technology: 'node',
      area: 'backend',
    });
    expect((await readConfig(directory)).technology.backend).toEqual([]);

    const addWrite = runCli([
      'profile',
      'add',
      'PROFILE-NODE-BACKEND',
      '--area',
      'backend',
      '--path',
      directory,
      '--write',
    ]);
    expect(addWrite.status).toBe(0);
    expect(addWrite.stdout).toContain('Profile selection preview');
    expect((await readConfig(directory)).technology.backend).toEqual(['node']);

    const removePreview = runCli([
      'profile',
      'remove',
      'PROFILE-NODE-BACKEND',
      '--area',
      'backend',
      '--path',
      directory,
      '--json',
    ]);
    expect(removePreview.status).toBe(0);
    expect(JSON.parse(removePreview.stdout)).toMatchObject({ action: 'remove', written: false });
    expect((await readConfig(directory)).technology.backend).toEqual(['node']);

    const removeWrite = runCli([
      'profile',
      'remove',
      'PROFILE-NODE-BACKEND',
      '--area',
      'backend',
      '--path',
      directory,
      '--write',
    ]);
    expect(removeWrite.status).toBe(0);
    expect((await readConfig(directory)).technology.backend).toEqual([]);
  });

  it('refuses to remove an unselected profile', async () => {
    const directory = await createProject({
      ...validConfig(),
      technology: { ...validConfig().technology, backend: [] },
    });
    const result = runCli([
      'profile',
      'remove',
      'PROFILE-NODE-BACKEND',
      '--area',
      'backend',
      '--path',
      directory,
      '--write',
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not selected');
    expect((await readConfig(directory)).technology.backend).toEqual([]);
  });

  it('rejects unknown profiles and missing project configurations during profile changes', async () => {
    const directory = await createProject(validConfig());
    const unknown = runCli([
      'profile',
      'add',
      'PROFILE-MISSING',
      '--area',
      'backend',
      '--path',
      directory,
      '--write',
    ]);
    expect(unknown.status).toBe(1);
    expect(unknown.stderr).toContain('Unknown profile');
    expect((await readConfig(directory)).technology.backend).toEqual(['node']);

    const missing = await emptyDirectory();
    const noProject = runCli([
      'profile',
      'add',
      'PROFILE-NODE-BACKEND',
      '--area',
      'backend',
      '--path',
      missing,
      '--write',
    ]);
    expect(noProject.status).toBe(1);
    expect(noProject.stderr).toContain('(missing)');
  });

  it('validates documentation links with a versioned JSON report', async () => {
    const directory = await emptyDirectory();
    await mkdir(join(directory, 'docs'));
    await writeFile(join(directory, 'README.md'), '[Guide](docs/guide.md)\\n', 'utf8');
    await writeFile(join(directory, 'docs/guide.md'), '# Guide\\n', 'utf8');

    const result = runCli(['docs', 'validate', '--path', directory, '--json']);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      contractVersion: '1.0.0',
      reportType: 'documentation-validation',
      ok: true,
      filesChecked: 2,
      issues: [],
    });
  });

  it('fails documentation validation for unresolved links', async () => {
    const directory = await emptyDirectory();
    await mkdir(join(directory, 'docs'));
    await writeFile(join(directory, 'docs/guide.md'), '[Missing](missing.md)\\n', 'utf8');

    const result = runCli(['docs', 'validate', '--path', directory, '--json']);

    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout) as {
      ok: boolean;
      issues: Array<{ code: string; path: string }>;
    };
    expect(report.ok).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({ code: 'LINK_UNRESOLVED', path: 'docs/guide.md' }),
    ]);
  });

  it('inspects the engineering foundation without writing', async () => {
    const directory = await createProject(validConfig());

    const result = runCli(['foundation', '--path', directory]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('VAHU engineering foundation');
    expect(result.stdout).toContain('Detected from files');
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

interface TestConfig {
  schemaVersion: string;
  project: {
    slug: string;
    lifecycle?: string;
    longDescription?: string;
    nonGoals: string[];
  };
  identity: { status: string };
  brand: {
    status: string;
    notes?: string;
    assets?: { logo?: string; colors: string[]; typography: string[] };
  };
  designSystem: { status: string; source: string; path?: string };
  repositories: {
    strategy: string;
    notes?: string;
    locations: { name: string; path?: string; url?: string }[];
  };
  technology: Record<string, string[]>;
  readiness: { status: string; checkedAt?: string };
}

async function readConfig(directory: string): Promise<TestConfig> {
  const source = await readFile(join(directory, '.vahu/project.json'), 'utf8');
  return JSON.parse(source) as TestConfig;
}
