import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ProjectConfig } from '@vahu-ef/schemas';
import { isUiProject } from './readiness.js';
import { validateProject, validateProjectConfig } from './validate.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function config(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    schemaVersion: '1.1.0',
    vahu: { version: '0.1.0' },
    project: {
      name: 'Example API',
      slug: 'example-api',
      description: 'A backend service.',
      purpose: 'Provide an API.',
      targetUsers: ['developers'],
      type: 'backend-service',
      languages: ['en'],
      scope: 'Example',
      constraints: [],
      nonGoals: [],
    },
    identity: { status: 'approved' },
    brand: { status: 'not-applicable' },
    designSystem: { status: 'not-applicable', source: 'none' },
    repositories: { strategy: 'monorepo', locations: [] },
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
    ...overrides,
  };
}

describe('readiness and validation', () => {
  it('accepts a backend-only project without brand assets', () => {
    expect(validateProjectConfig(config())).toEqual([]);
  });

  it('detects UI projects by type or technology selection', () => {
    expect(isUiProject(config())).toBe(false);
    expect(
      isUiProject(
        config({
          technology: {
            backend: [],
            frontend: ['react'],
            mobile: [],
            database: [],
            infrastructure: [],
            testing: [],
            deployment: [],
          },
        }),
      ),
    ).toBe(true);
  });

  it('blocks a UI project until its design system is approved', () => {
    const result = validateProjectConfig(
      config({
        project: {
          ...config().project,
          type: 'web-application',
        },
      }),
    );
    expect(result.some((issue) => issue.code === 'DESIGN_SYSTEM_NOT_APPROVED')).toBe(true);
  });

  it('accepts an approved UI design system with a source and path', () => {
    const result = validateProjectConfig(
      config({
        project: {
          ...config().project,
          type: 'web-application',
        },
        designSystem: {
          status: 'approved',
          source: 'existing',
          path: 'docs/design-system.md',
        },
      }),
    );
    expect(result.some((issue) => issue.severity === 'error')).toBe(false);
  });

  it('blocks a pending project identity', () => {
    const result = validateProjectConfig(config({ identity: { status: 'pending' } }));
    expect(result.some((issue) => issue.code === 'IDENTITY_NOT_APPROVED')).toBe(true);
  });

  it('warns about an undocumented multi-repository strategy', () => {
    const result = validateProjectConfig(
      config({ repositories: { strategy: 'multi-repository', locations: [] } }),
    );
    expect(result.some((issue) => issue.code === 'REPOSITORY_STRATEGY_UNDOCUMENTED')).toBe(true);
  });
});

function legacyConfig() {
  return {
    schemaVersion: '1.0.0',
    vahu: { version: '0.1.0' },
    project: {
      name: 'Example API',
      slug: 'example-api',
      description: 'A backend service.',
      purpose: 'Provide an API.',
      targetUsers: ['developers'],
      type: 'backend-service',
      languages: ['en'],
      scope: 'Example',
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

async function writeProject(input: unknown): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'vahu-validate-'));
  tempDirectories.push(directory);
  await mkdir(join(directory, '.vahu'));
  await writeFile(join(directory, '.vahu/project.json'), JSON.stringify(input), 'utf8');
  return directory;
}

describe('project validation and schema migration', () => {
  it('recommends migrating a 1.0.0 file without blocking it', async () => {
    const directory = await writeProject(legacyConfig());

    const result = await validateProject(directory);

    expect(result.ok).toBe(true);
    const issue = result.issues.find((entry) => entry.code === 'SCHEMA_1_0_0_NOT_MIGRATED');
    expect(issue?.severity).toBe('warning');
  });

  it('does not recommend a migration for a 1.1.0 file', async () => {
    const directory = await writeProject(config());

    const result = await validateProject(directory);

    expect(result.ok).toBe(true);
    expect(result.issues.some((entry) => entry.code === 'SCHEMA_1_0_0_NOT_MIGRATED')).toBe(false);
  });
});
