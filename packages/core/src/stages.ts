import { parseProjectConfig, type ProjectConfig, type RepositoryLocation } from '@vahu-ef/schemas';
import type { FrameworkIssue } from './issues.js';
import { changedConfigPaths } from './onboarding.js';
import { assessReadiness } from './readiness.js';

export type StageResult =
  | { ok: true; config: ProjectConfig; changed: string[] }
  | { ok: false; issues: FrameworkIssue[] };

export const BRAND_STATUSES = ['pending', 'approved', 'not-applicable'] as const;
export type BrandStatus = (typeof BRAND_STATUSES)[number];

export const DESIGN_STATUSES = [
  'not-started',
  'pending-approval',
  'approved',
  'not-applicable',
] as const;
export type DesignStatus = (typeof DESIGN_STATUSES)[number];

export const DESIGN_SOURCES = ['existing', 'generated', 'none'] as const;
export type DesignSource = (typeof DESIGN_SOURCES)[number];

export const REPOSITORY_STRATEGIES = ['monorepo', 'multi-repository', 'hybrid'] as const;
export type RepositoryStrategy = (typeof REPOSITORY_STRATEGIES)[number];

export const TECHNOLOGY_AREAS = [
  'backend',
  'frontend',
  'mobile',
  'database',
  'infrastructure',
  'testing',
  'deployment',
] as const;
export type TechnologyArea = (typeof TECHNOLOGY_AREAS)[number];

export interface BrandInput {
  status?: BrandStatus;
  logo?: string;
  colors?: string[];
  typography?: string[];
  guidelines?: string;
  notes?: string;
}

/**
 * Updates brand identity. A project may mark branding `not-applicable`, but it
 * must say why, and an approved brand must point at something concrete.
 */
export function applyBrand(config: ProjectConfig, input: BrandInput): StageResult {
  const notes = input.notes !== undefined ? input.notes.trim() : (config.brand.notes ?? '');
  const logo = input.logo !== undefined ? input.logo.trim() : (config.brand.assets?.logo ?? '');
  const colors =
    input.colors !== undefined ? cleanList(input.colors) : (config.brand.assets?.colors ?? []);
  const typography =
    input.typography !== undefined
      ? cleanList(input.typography)
      : (config.brand.assets?.typography ?? []);
  const guidelines =
    input.guidelines !== undefined
      ? input.guidelines.trim()
      : (config.brand.assets?.guidelines ?? '');

  const hasAssets =
    logo.length > 0 || colors.length > 0 || typography.length > 0 || guidelines.length > 0;
  const status = input.status ?? config.brand.status;

  if (status === 'not-applicable' && notes.length === 0) {
    return {
      ok: false,
      issues: [
        {
          code: 'BRAND_REASON_REQUIRED',
          path: 'brand.notes',
          message: 'Marking branding not applicable needs a recorded reason.',
        },
      ],
    };
  }

  if (status === 'approved' && !hasAssets) {
    return {
      ok: false,
      issues: [
        {
          code: 'BRAND_ASSETS_REQUIRED',
          path: 'brand.assets',
          message: 'An approved brand needs at least one asset reference or guideline.',
        },
      ],
    };
  }

  return finish(config, {
    ...config,
    brand: {
      status,
      ...(hasAssets
        ? {
            assets: {
              ...(logo.length > 0 ? { logo } : {}),
              colors,
              typography,
              ...(guidelines.length > 0 ? { guidelines } : {}),
            },
          }
        : {}),
      ...(notes.length > 0 ? { notes } : {}),
    },
  });
}

export interface DesignInput {
  status?: DesignStatus;
  source?: DesignSource;
  path?: string;
  notes?: string;
}

/**
 * Updates the design system. Approval requires a real source and a path, so an
 * empty approval cannot make a UI project look ready.
 */
export function applyDesignSystem(config: ProjectConfig, input: DesignInput): StageResult {
  const status = input.status ?? config.designSystem.status;
  const notApplicable = status === 'not-applicable';
  const source = notApplicable ? 'none' : (input.source ?? config.designSystem.source ?? 'none');
  const path = notApplicable ? '' : (input.path ?? config.designSystem.path ?? '').trim();
  const notes = input.notes !== undefined ? input.notes.trim() : (config.designSystem.notes ?? '');

  if (status === 'approved' && source === 'none') {
    return {
      ok: false,
      issues: [
        {
          code: 'DESIGN_APPROVAL_NEEDS_SOURCE',
          path: 'designSystem.source',
          message: 'An approved design system needs an existing or generated source.',
        },
      ],
    };
  }

  if (status === 'approved' && path.length === 0) {
    return {
      ok: false,
      issues: [
        {
          code: 'DESIGN_APPROVAL_NEEDS_PATH',
          path: 'designSystem.path',
          message: 'Record the design-system location before approving it.',
        },
      ],
    };
  }

  return finish(config, {
    ...config,
    designSystem: {
      status,
      source,
      ...(path.length > 0 ? { path } : {}),
      ...(notes.length > 0 ? { notes } : {}),
    },
  });
}

export interface TechnologyChange {
  add?: string[];
  remove?: string[];
}

/**
 * Adds or removes technologies for one project area. Values are deduplicated and
 * removal wins over addition in the same call.
 */
export function updateTechnology(
  config: ProjectConfig,
  area: string,
  change: TechnologyChange,
): StageResult {
  if (!isTechnologyArea(area)) {
    return {
      ok: false,
      issues: [
        {
          code: 'TECHNOLOGY_AREA_UNKNOWN',
          path: 'technology',
          message: `Unknown technology area "${area}". Use one of: ${TECHNOLOGY_AREAS.join(', ')}.`,
        },
      ],
    };
  }

  const removed = new Set(cleanList(change.remove ?? []));
  const values = [...config.technology[area], ...cleanList(change.add ?? [])].filter(
    (value, index, list) => !removed.has(value) && list.indexOf(value) === index,
  );

  return finish(config, {
    ...config,
    technology: { ...config.technology, [area]: values },
  });
}

export interface RepositoriesInput {
  strategy?: RepositoryStrategy;
  notes?: string;
  locations?: RepositoryLocation[];
}

/** Updates the repository strategy, notes, and locations. */
export function applyRepositories(config: ProjectConfig, input: RepositoriesInput): StageResult {
  const notes = input.notes !== undefined ? input.notes.trim() : (config.repositories.notes ?? '');

  return finish(config, {
    ...config,
    repositories: {
      strategy: input.strategy ?? config.repositories.strategy,
      ...(notes.length > 0 ? { notes } : {}),
      locations: input.locations ?? config.repositories.locations,
    },
  });
}

/** Stores the current readiness assessment, with the time it was checked. */
export function recordReadiness(config: ProjectConfig, at?: string): ProjectConfig {
  const assessment = assessReadiness(config);

  return {
    ...config,
    readiness: {
      status: assessment.status,
      checkedAt: at ?? new Date().toISOString(),
      notes: config.readiness.notes,
    },
  };
}

function finish(before: ProjectConfig, next: ProjectConfig): StageResult {
  const parsed = parseProjectConfig(next);
  if (!parsed.ok) {
    return {
      ok: false,
      issues: parsed.issues.map((issue) => ({
        code: 'STAGE_INVALID',
        path: issue.path,
        message: issue.message,
      })),
    };
  }

  return { ok: true, config: parsed.data, changed: changedConfigPaths(before, parsed.data) };
}

function cleanList(values: readonly string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
}

function isTechnologyArea(value: string): value is TechnologyArea {
  return (TECHNOLOGY_AREAS as readonly string[]).includes(value);
}
