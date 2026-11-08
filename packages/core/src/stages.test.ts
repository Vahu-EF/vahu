import { describe, expect, it } from 'vitest';
import { buildProjectConfig } from './onboarding.js';
import {
  applyBrand,
  applyDesignSystem,
  applyRepositories,
  recordReadiness,
  updateTechnology,
} from './stages.js';

function config() {
  return buildProjectConfig({
    name: 'Stage Test',
    slug: 'stage-test',
    description: 'A project used in stage tests.',
    purpose: 'Exercise stage updates.',
    targetUsers: ['developers'],
    type: 'backend-service',
    languages: ['en'],
    scope: 'Tests',
    constraints: [],
    nonGoals: [],
    repositories: [],
  });
}

describe('brand identity', () => {
  it('requires a reason when branding is not applicable', () => {
    const result = applyBrand(config(), { status: 'not-applicable' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe('BRAND_REASON_REQUIRED');
    }
  });

  it('records a not-applicable brand with its reason', () => {
    const result = applyBrand(config(), {
      status: 'not-applicable',
      notes: 'Internal service with no public brand.',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.brand.status).toBe('not-applicable');
      expect(result.config.brand.notes).toContain('no public brand');
      expect(result.changed).toContain('brand.notes');
    }
  });

  it('refuses an approved brand without assets', () => {
    const result = applyBrand(config(), { status: 'approved' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe('BRAND_ASSETS_REQUIRED');
    }
  });

  it('records approved brand assets', () => {
    const result = applyBrand(config(), {
      status: 'approved',
      logo: 'assets/logo.svg',
      colors: ['#0b5fff', ' #0b5fff '],
      typography: ['Inter'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.brand.assets).toEqual({
        logo: 'assets/logo.svg',
        colors: ['#0b5fff'],
        typography: ['Inter'],
      });
    }
  });
});

describe('design system', () => {
  it('refuses approval without a source', () => {
    const result = applyDesignSystem(config(), { status: 'approved' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe('DESIGN_APPROVAL_NEEDS_SOURCE');
    }
  });

  it('refuses approval without a path', () => {
    const result = applyDesignSystem(config(), { status: 'approved', source: 'existing' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe('DESIGN_APPROVAL_NEEDS_PATH');
    }
  });

  it('records an approved existing design system', () => {
    const result = applyDesignSystem(config(), {
      status: 'approved',
      source: 'existing',
      path: 'docs/design-system.md',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.designSystem).toEqual({
        status: 'approved',
        source: 'existing',
        path: 'docs/design-system.md',
      });
    }
  });

  it('clears the source and path when the design system does not apply', () => {
    const result = applyDesignSystem(config(), {
      status: 'not-applicable',
      source: 'existing',
      path: 'docs/design-system.md',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.designSystem).toEqual({ status: 'not-applicable', source: 'none' });
    }
  });
});

describe('technology selection', () => {
  it('rejects an unknown area', () => {
    const result = updateTechnology(config(), 'analytics', { add: ['segment'] });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe('TECHNOLOGY_AREA_UNKNOWN');
    }
  });

  it('adds, deduplicates, and removes values', () => {
    const first = updateTechnology(config(), 'backend', { add: ['node', 'node'] });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.config.technology.backend).toEqual(['node']);

    const second = updateTechnology(first.config, 'backend', {
      add: ['postgresql', 'node'],
      remove: ['node'],
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.config.technology.backend).toEqual(['postgresql']);
    }
  });
});

describe('repositories and readiness', () => {
  it('records a strategy, notes, locations, and their owners', () => {
    const result = applyRepositories(config(), {
      strategy: 'multi-repository',
      notes: 'API and web repositories.',
      locations: [{ name: 'api', path: '.' }],
      owners: { api: 'platform' },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.repositories).toEqual({
        strategy: 'multi-repository',
        notes: 'API and web repositories.',
        locations: [{ name: 'api', path: '.', owner: 'platform' }],
      });
    }
  });

  it('rejects ownership assignments for unknown repository locations', () => {
    const result = applyRepositories(config(), { owners: { missing: 'platform' } });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe('REPOSITORY_LOCATION_UNKNOWN');
    }
  });

  it('records the readiness assessment without clearing notes', () => {
    const before = config();
    before.readiness.notes = ['Waiting for a design system.'];

    const next = recordReadiness(before, '2026-11-07T00:00:00.000Z');

    expect(next.readiness.status).toBe('blocked');
    expect(next.readiness.checkedAt).toBe('2026-11-07T00:00:00.000Z');
    expect(next.readiness.notes).toEqual(['Waiting for a design system.']);
  });
});
