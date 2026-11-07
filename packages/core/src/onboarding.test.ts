import { describe, expect, it } from 'vitest';
import type { ProjectConfig } from '@vahu-ef/schemas';
import {
  approveIdentity,
  buildProjectConfig,
  changedConfigPaths,
  mergeIdentity,
  suggestSlug,
  validateAnswers,
  type IdentityAnswers,
} from './onboarding.js';

function answers(overrides: Partial<IdentityAnswers> = {}): IdentityAnswers {
  return {
    name: 'Example Service',
    slug: 'example-service',
    description: 'A service that does one thing.',
    purpose: 'Serve one use case well.',
    targetUsers: ['developers'],
    type: 'backend-service',
    languages: ['en'],
    scope: 'First release',
    constraints: [],
    nonGoals: [],
    repositories: [],
    ...overrides,
  };
}

function existing(): ProjectConfig {
  return {
    schemaVersion: '1.1.0',
    vahu: { version: '0.1.0' },
    project: {
      name: 'Old Name',
      slug: 'old-name',
      description: 'Old description.',
      purpose: 'Old purpose.',
      targetUsers: ['operators'],
      type: 'backend-service',
      languages: ['en'],
      scope: 'Old scope',
      constraints: [],
      nonGoals: [],
    },
    identity: { status: 'approved', approvedAt: '2026-01-01T00:00:00.000Z', approvedBy: 'Owner' },
    brand: { status: 'not-applicable' },
    designSystem: { status: 'not-applicable', source: 'none' },
    repositories: { strategy: 'multi-repository', notes: 'Two repositories.', locations: [] },
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
    readiness: { status: 'ready', notes: [] },
  };
}

describe('slug suggestions', () => {
  it('derives a lowercase hyphenated slug from a name', () => {
    expect(suggestSlug('My Cool App')).toBe('my-cool-app');
  });

  it('removes punctuation and collapses separators', () => {
    expect(suggestSlug('  Example: API  (v2) ')).toBe('example-api-v2');
  });

  it('returns an empty slug when the name has no usable characters', () => {
    expect(suggestSlug('!!!')).toBe('');
  });
});

describe('identity answers', () => {
  it('builds a config that satisfies the schema', () => {
    const config = buildProjectConfig(answers());

    expect(config.project.slug).toBe('example-service');
    expect(config.identity.status).toBe('pending');
    expect(config.designSystem).toEqual({ status: 'not-started', source: 'none' });
    expect(config.technology.backend).toEqual([]);
    expect(config.readiness.status).toBe('incomplete');
  });

  it('captures the schema 1.1.0 identity fields', () => {
    const config = buildProjectConfig(
      answers({
        longDescription: 'A longer explanation of the service and its audience.',
        lifecycle: 'active',
        nonGoals: ['Not a billing system'],
        repositories: [{ name: 'api', path: 'apps/api', role: 'service', owner: 'platform' }],
      }),
    );

    expect(config.schemaVersion).toBe('1.1.0');
    expect(config.project.longDescription).toContain('longer explanation');
    expect(config.project.lifecycle).toBe('active');
    expect(config.project.nonGoals).toEqual(['Not a billing system']);
    expect(config.repositories.locations).toEqual([
      { name: 'api', path: 'apps/api', role: 'service', owner: 'platform' },
    ]);
  });

  it('omits optional identity fields that were not answered', () => {
    const config = buildProjectConfig(answers());

    expect('longDescription' in config.project).toBe(false);
    expect('lifecycle' in config.project).toBe(false);
    expect(config.project.nonGoals).toEqual([]);
    expect(config.repositories.locations).toEqual([]);
  });

  it('reports invalid answers', () => {
    const issues = validateAnswers(answers({ slug: 'Not A Slug' }));

    expect(issues.some((issue) => issue.code === 'IDENTITY_INVALID')).toBe(true);
  });

  it('reports a missing target user list', () => {
    const issues = validateAnswers(answers({ targetUsers: [] }));

    expect(issues.some((issue) => issue.code === 'IDENTITY_INVALID')).toBe(true);
  });

  it('accepts complete answers', () => {
    expect(validateAnswers(answers())).toEqual([]);
  });
});

describe('merging identity into an existing configuration', () => {
  it('preserves non-identity sections', () => {
    const merged = mergeIdentity(existing(), answers());

    expect(merged.repositories).toEqual({
      strategy: 'multi-repository',
      notes: 'Two repositories.',
      locations: [],
    });
    expect(merged.technology.database).toEqual(['postgresql']);
    expect(merged.project.name).toBe('Example Service');
  });

  it('returns identity to pending and drops a previous approval', () => {
    const merged = mergeIdentity(existing(), answers());

    expect(merged.identity).toEqual({ status: 'pending' });
  });

  it('replaces captured repository locations and keeps the strategy', () => {
    const merged = mergeIdentity(
      existing(),
      answers({ repositories: [{ name: 'api', path: '.' }] }),
    );

    expect(merged.repositories.strategy).toBe('multi-repository');
    expect(merged.repositories.notes).toBe('Two repositories.');
    expect(merged.repositories.locations).toEqual([{ name: 'api', path: '.' }]);
  });

  it('marks a ready project as incomplete again', () => {
    const merged = mergeIdentity(existing(), answers());

    expect(merged.readiness.status).toBe('incomplete');
  });
});

describe('identity approval', () => {
  it('records the approver and date', () => {
    const result = approveIdentity(buildProjectConfig(answers()), {
      by: 'VAHU project owner',
      at: '2026-11-07T00:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.identity).toEqual({
        status: 'approved',
        approvedBy: 'VAHU project owner',
        approvedAt: '2026-11-07T00:00:00.000Z',
      });
    }
  });

  it('refuses an empty approver', () => {
    const result = approveIdentity(buildProjectConfig(answers()), { by: '   ' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe('IDENTITY_APPROVER_REQUIRED');
    }
  });
});

describe('configuration previews', () => {
  it('reports created paths for a new configuration', () => {
    const paths = changedConfigPaths(null, buildProjectConfig(answers()));

    expect(paths).toContain('project.slug');
    expect(paths).toContain('identity.status');
  });

  it('reports only the paths that changed', () => {
    const before = existing();
    const after = mergeIdentity(before, answers());

    const paths = changedConfigPaths(before, after);

    expect(paths).toContain('project.name');
    expect(paths).toContain('identity.status');
    expect(paths).toContain('readiness.status');
    expect(paths).not.toContain('repositories.strategy');
  });

  it('reports no changes when the configuration is identical', () => {
    expect(changedConfigPaths(existing(), existing())).toEqual([]);
  });
});
