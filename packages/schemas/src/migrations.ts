import {
  configIssuesFromError,
  PREVIOUS_SCHEMA_VERSION,
  projectConfigSchema,
  projectConfigV1_0_0Schema,
  SCHEMA_VERSION,
  type ConfigIssue,
  type ProjectConfig,
  type ProjectConfigV1_0_0,
} from './project.js';

export const SUPPORTED_SCHEMA_VERSIONS = [PREVIOUS_SCHEMA_VERSION, SCHEMA_VERSION] as const;

export type SchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number];

export type MigrationResult =
  | { ok: true; config: ProjectConfig; from: SchemaVersion }
  | { ok: false; issues: ConfigIssue[] };

interface MigrationStep {
  from: typeof PREVIOUS_SCHEMA_VERSION;
  to: typeof SCHEMA_VERSION;
  migrate: (config: ProjectConfigV1_0_0) => unknown;
}

/**
 * Version-keyed migration steps. Each step is pure, and a step only runs after
 * its input version has been validated, so a broken file is reported rather than
 * silently repaired. A future version adds a row and a schema.
 */
const MIGRATION_STEPS: Record<typeof PREVIOUS_SCHEMA_VERSION, MigrationStep> = {
  [PREVIOUS_SCHEMA_VERSION]: {
    from: PREVIOUS_SCHEMA_VERSION,
    to: SCHEMA_VERSION,
    migrate: (config) => ({
      ...config,
      schemaVersion: SCHEMA_VERSION,
      project: { ...config.project, nonGoals: [] },
      repositories: { ...config.repositories, locations: [] },
    }),
  },
};

/**
 * Reads a configuration, migrating a supported older version to the current
 * one. Nothing is invented: fields the older file did not hold stay absent.
 */
export function migrateProjectConfig(input: unknown): MigrationResult {
  const version = readSchemaVersion(input);

  if (version === undefined) {
    return {
      ok: false,
      issues: [{ path: 'schemaVersion', message: 'The configuration has no schemaVersion.' }],
    };
  }

  if (version === SCHEMA_VERSION) {
    const parsed = projectConfigSchema.safeParse(input);
    return parsed.success
      ? { ok: true, config: parsed.data, from: SCHEMA_VERSION }
      : { ok: false, issues: configIssuesFromError(parsed.error) };
  }

  if (version === PREVIOUS_SCHEMA_VERSION) {
    const parsed = projectConfigV1_0_0Schema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, issues: configIssuesFromError(parsed.error) };
    }

    const migrated = MIGRATION_STEPS[PREVIOUS_SCHEMA_VERSION].migrate(parsed.data);
    const checked = projectConfigSchema.safeParse(migrated);
    return checked.success
      ? { ok: true, config: checked.data, from: PREVIOUS_SCHEMA_VERSION }
      : { ok: false, issues: configIssuesFromError(checked.error) };
  }

  return {
    ok: false,
    issues: [
      {
        path: 'schemaVersion',
        message: `Unsupported schema version "${version}". Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`,
      },
    ],
  };
}

function readSchemaVersion(input: unknown): string | undefined {
  if (typeof input !== 'object' || input === null) {
    return undefined;
  }

  const value = (input as Record<string, unknown>).schemaVersion;
  return typeof value === 'string' ? value : undefined;
}
