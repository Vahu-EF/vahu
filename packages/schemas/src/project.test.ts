import { describe, expect, it } from 'vitest';
import { migrateProjectConfig } from './migrations.js';
import { parseProjectConfig } from './project.js';

function config(version: '1.0.0' | '1.1.0' = '1.1.0'): Record<string, unknown> {
  return {
    schemaVersion: version,
    vahu: { version: '0.1.0' },
    project: {
      name: 'Example API',
      slug: 'example-api',
      description: 'A small backend service.',
      purpose: 'Provide an example API.',
      targetUsers: ['developers'],
      type: 'backend-service',
      languages: ['en'],
      scope: 'Phase 0 example',
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
      database: ['postgresql'],
      infrastructure: [],
      testing: ['vitest'],
      deployment: [],
    },
    agents: { enabled: ['generic'], configuration: {} },
    readiness: { status: 'incomplete', notes: [] },
  };
}

describe('project configuration schema', () => {
  it('accepts a backend-only project without brand assets', () => {
    const result = parseProjectConfig(config());
    expect(result.ok).toBe(true);
  });

  it('rejects a project with an invalid slug', () => {
    const input = config();
    (input.project as { slug: string }).slug = 'Example API';
    const result = parseProjectConfig(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === 'project.slug')).toBe(true);
    }
  });

  it('rejects unknown fields instead of silently accepting typos', () => {
    const result = parseProjectConfig({ ...config(), surprise: true });
    expect(result.ok).toBe(false);
  });

  it('requires a supported schema version', () => {
    expect(parseProjectConfig({ ...config(), schemaVersion: '2.0.0' }).ok).toBe(false);
  });

  it('rejects the previous version instead of accepting it silently', () => {
    expect(parseProjectConfig(config('1.0.0')).ok).toBe(false);
  });

  it('accepts the new identity fields', () => {
    const input = config();
    input.project = {
      ...(input.project as Record<string, unknown>),
      longDescription: 'A longer explanation of what the project is for.',
      lifecycle: 'active',
      nonGoals: ['Not a marketplace'],
    };

    const result = parseProjectConfig(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.project.lifecycle).toBe('active');
      expect(result.data.project.nonGoals).toEqual(['Not a marketplace']);
    }
  });

  it('rejects an unknown lifecycle value', () => {
    const input = config();
    input.project = { ...(input.project as Record<string, unknown>), lifecycle: 'retired' };

    expect(parseProjectConfig(input).ok).toBe(false);
  });

  it('accepts repository locations with a path or a url', () => {
    const input = config();
    input.repositories = {
      strategy: 'hybrid',
      locations: [
        { name: 'app', path: 'apps/web', role: 'package' },
        { name: 'api', url: 'https://github.com/example/api', owner: 'platform' },
      ],
    };

    expect(parseProjectConfig(input).ok).toBe(true);
  });

  it('rejects a repository location without a path or a url', () => {
    const input = config();
    input.repositories = { strategy: 'monorepo', locations: [{ name: 'app' }] };

    const result = parseProjectConfig(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.startsWith('repositories.locations'))).toBe(
        true,
      );
    }
  });
});

describe('schema migration', () => {
  it('reads a 1.0.0 file as 1.1.0 and adds only the defaulted collections', () => {
    const result = migrateProjectConfig(config('1.0.0'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.from).toBe('1.0.0');
      expect(result.config.schemaVersion).toBe('1.1.0');
      expect(result.config.project.nonGoals).toEqual([]);
      expect(result.config.repositories.locations).toEqual([]);
      expect(result.config.project.name).toBe('Example API');
      expect('longDescription' in result.config.project).toBe(false);
      expect('lifecycle' in result.config.project).toBe(false);
    }
  });

  it('reports a broken 1.0.0 file instead of fixing it', () => {
    const broken = config('1.0.0');
    delete (broken.project as Record<string, unknown>).name;

    const result = migrateProjectConfig(broken);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === 'project.name')).toBe(true);
    }
  });

  it('passes a current file through unchanged', () => {
    const result = migrateProjectConfig(config());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.from).toBe('1.1.0');
      expect(result.config.schemaVersion).toBe('1.1.0');
    }
  });

  it('rejects an unsupported version with the supported list', () => {
    const result = migrateProjectConfig({ ...config(), schemaVersion: '2.0.0' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('schemaVersion');
      expect(result.issues[0]?.message).toContain('1.0.0, 1.1.0');
    }
  });

  it('rejects a file with no schema version', () => {
    const input: Record<string, unknown> = { ...config() };
    delete input.schemaVersion;

    const result = migrateProjectConfig(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('schemaVersion');
    }
  });
});
