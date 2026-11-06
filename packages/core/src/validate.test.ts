import { describe, expect, it } from 'vitest';
import type { ProjectConfig } from '@vahu-ef/schemas';
import { isUiProject } from './readiness.js';
import { validateProjectConfig } from './validate.js';

function config(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
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
      config({ repositories: { strategy: 'multi-repository' } }),
    );
    expect(result.some((issue) => issue.code === 'REPOSITORY_STRATEGY_UNDOCUMENTED')).toBe(true);
  });
});
