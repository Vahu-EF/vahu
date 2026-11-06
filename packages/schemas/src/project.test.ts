import { describe, expect, it } from 'vitest';
import { parseProjectConfig } from './project.js';

function backendConfig(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0.0',
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
    },
    identity: { status: 'approved' },
    brand: { status: 'not-applicable' },
    designSystem: { status: 'not-applicable', source: 'none' },
    repositories: { strategy: 'monorepo' },
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
    ...overrides,
  };
}

describe('project configuration schema', () => {
  it('accepts a backend-only project without brand assets', () => {
    const result = parseProjectConfig(backendConfig());
    expect(result.ok).toBe(true);
  });

  it('rejects a project with an invalid slug', () => {
    const config = backendConfig();
    (config.project as { slug: string }).slug = 'Example API';
    const result = parseProjectConfig(config);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === 'project.slug')).toBe(true);
    }
  });

  it('rejects unknown fields instead of silently accepting typos', () => {
    const config = backendConfig({ surprise: true });
    const result = parseProjectConfig(config);
    expect(result.ok).toBe(false);
  });

  it('requires a supported schema version', () => {
    const result = parseProjectConfig(backendConfig({ schemaVersion: '2.0.0' }));
    expect(result.ok).toBe(false);
  });
});
