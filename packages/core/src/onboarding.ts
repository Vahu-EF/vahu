import {
  parseProjectConfig,
  projectLifecycleSchema,
  projectTypeSchema,
  SCHEMA_VERSION,
  type ProjectConfig,
  type ProjectLifecycle,
  type ProjectType,
  type RepositoryLocation,
} from '@vahu-ef/schemas';
import type { FrameworkIssue } from './issues.js';

export const DEFAULT_VAHU_VERSION = '0.1.0';

/** Project types accepted by the configuration schema. */
export const PROJECT_TYPES = projectTypeSchema.options;

/** Project lifecycle values accepted by the configuration schema. */
export const PROJECT_LIFECYCLES = projectLifecycleSchema.options;

/** The Project Identity fields captured by onboarding stage 1. */
export interface IdentityAnswers {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  purpose: string;
  targetUsers: string[];
  type: ProjectType;
  lifecycle?: ProjectLifecycle;
  languages: string[];
  scope: string;
  constraints: string[];
  nonGoals: string[];
  repositories: RepositoryLocation[];
}

export type ApprovalResult =
  { ok: true; config: ProjectConfig } | { ok: false; issues: FrameworkIssue[] };

/**
 * Derives a valid project slug from a display name: lower case, ASCII letters,
 * digits, and single hyphens.
 */
export function suggestSlug(name: string): string {
  const words = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);

  return words.join('-');
}

/** Validates answers by building a configuration and applying the schema. */
export function validateAnswers(answers: IdentityAnswers): FrameworkIssue[] {
  const parsed = parseProjectConfig(candidateConfig(answers));
  if (parsed.ok) {
    return [];
  }

  return parsed.issues.map((issue) => ({
    code: 'IDENTITY_INVALID',
    path: `project.${issue.path}`,
    message: issue.message,
  }));
}

/**
 * Builds a new configuration from identity answers. Everything outside Project
 * Identity starts empty or not applicable; identity begins `pending`, so the
 * configuration never records an approval the user did not give.
 */
export function buildProjectConfig(
  answers: IdentityAnswers,
  options: { vahuVersion?: string } = {},
): ProjectConfig {
  const parsed = parseProjectConfig(candidateConfig(answers, options.vahuVersion));
  if (!parsed.ok) {
    const detail = parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    throw new Error(`Identity answers do not produce a valid configuration: ${detail}`);
  }
  return parsed.data;
}

/**
 * Applies identity answers to an existing configuration. Identity returns to
 * `pending` and readiness to `incomplete`, because a changed identity invalidates
 * the earlier approval.
 */
export function mergeIdentity(current: ProjectConfig, answers: IdentityAnswers): ProjectConfig {
  return {
    ...current,
    project: projectFrom(answers),
    identity: { status: 'pending' },
    repositories: { ...current.repositories, locations: answers.repositories },
    readiness: { status: 'incomplete', notes: current.readiness.notes },
  };
}

/** Records an explicit identity approval. An approver name is required. */
export function approveIdentity(
  config: ProjectConfig,
  approval: { by: string; at?: string },
): ApprovalResult {
  const approver = approval.by.trim();
  if (approver.length === 0) {
    return {
      ok: false,
      issues: [
        {
          code: 'IDENTITY_APPROVER_REQUIRED',
          path: 'identity.approvedBy',
          message: 'An approval needs a named approver.',
        },
      ],
    };
  }

  return {
    ok: true,
    config: {
      ...config,
      identity: {
        status: 'approved',
        approvedBy: approver,
        approvedAt: approval.at ?? new Date().toISOString(),
      },
    },
  };
}

/** Returns the dot paths whose values differ between two configurations. */
export function changedConfigPaths(before: ProjectConfig | null, after: ProjectConfig): string[] {
  const changed = new Set<string>();
  collectChanges('', after, before ?? {}, changed);
  return [...changed].sort();
}

function candidateConfig(answers: IdentityAnswers, vahuVersion?: string) {
  return {
    schemaVersion: SCHEMA_VERSION,
    vahu: { version: vahuVersion ?? DEFAULT_VAHU_VERSION },
    project: projectFrom(answers),
    identity: { status: 'pending' as const },
    brand: { status: 'not-applicable' as const },
    designSystem: { status: 'not-started' as const, source: 'none' as const },
    repositories: { strategy: 'monorepo' as const, locations: answers.repositories },
    technology: {
      backend: [],
      frontend: [],
      mobile: [],
      database: [],
      infrastructure: [],
      testing: [],
      deployment: [],
    },
    agents: { enabled: ['generic' as const], configuration: {} },
    readiness: { status: 'incomplete' as const, notes: [] },
  };
}

function projectFrom(answers: IdentityAnswers) {
  const longDescription = answers.longDescription?.trim() ?? '';

  return {
    name: answers.name.trim(),
    slug: answers.slug.trim(),
    description: answers.description.trim(),
    ...(longDescription.length > 0 ? { longDescription } : {}),
    purpose: answers.purpose.trim(),
    targetUsers: answers.targetUsers.map((user) => user.trim()).filter((user) => user.length > 0),
    type: answers.type,
    ...(answers.lifecycle ? { lifecycle: answers.lifecycle } : {}),
    languages: answers.languages.map((language) => language.trim()).filter(Boolean),
    scope: answers.scope.trim(),
    constraints: cleanList(answers.constraints),
    nonGoals: cleanList(answers.nonGoals),
  };
}

function cleanList(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function collectChanges(
  prefix: string,
  next: unknown,
  previous: unknown,
  changed: Set<string>,
): void {
  if (isRecord(next) && (isRecord(previous) || previous === undefined)) {
    const baseline = isRecord(previous) ? previous : {};
    const keys = new Set([...Object.keys(next), ...Object.keys(baseline)]);
    for (const key of keys) {
      collectChanges(
        prefix.length > 0 ? `${prefix}.${key}` : key,
        next[key],
        baseline[key],
        changed,
      );
    }
    return;
  }

  if (JSON.stringify(next) !== JSON.stringify(previous)) {
    changed.add(prefix);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
