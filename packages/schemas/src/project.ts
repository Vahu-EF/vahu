import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** The configuration version this package writes. */
export const SCHEMA_VERSION = '1.1.0' as const;

/** The previous configuration version, still readable through migration. */
export const PREVIOUS_SCHEMA_VERSION = '1.0.0' as const;

export const projectTypeSchema = z.enum([
  'web-application',
  'mobile-application',
  'desktop-application',
  'backend-service',
  'library',
  'cli',
  'other',
]);

export const projectLifecycleSchema = z.enum(['planned', 'active', 'maintenance', 'archived']);

export const agentNameSchema = z.enum(['generic', 'codex', 'claude-code', 'gemini']);

export const repositoryLocationSchema = z
  .object({
    name: requiredText,
    role: z.enum(['primary', 'package', 'service', 'documentation', 'other']).optional(),
    path: requiredText.optional(),
    url: z.url().optional(),
    owner: requiredText.optional(),
  })
  .strict()
  .refine((location) => location.path !== undefined || location.url !== undefined, {
    message: 'A repository location needs a path or a url.',
    path: ['path'],
  });

const projectV1_0_0 = z
  .object({
    name: requiredText,
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
    description: requiredText,
    purpose: requiredText,
    targetUsers: z.array(requiredText).min(1),
    type: projectTypeSchema,
    languages: z.array(requiredText).min(1),
    scope: requiredText,
    constraints: z.array(requiredText).default([]),
  })
  .strict();

const projectV1_1_0 = projectV1_0_0
  .extend({
    longDescription: requiredText.optional(),
    lifecycle: projectLifecycleSchema.optional(),
    nonGoals: z.array(requiredText).default([]),
  })
  .strict();

const repositoriesV1_0_0 = z
  .object({
    strategy: z.enum(['monorepo', 'multi-repository', 'hybrid']),
    notes: requiredText.optional(),
  })
  .strict();

const repositoriesV1_1_0 = repositoriesV1_0_0
  .extend({
    locations: z.array(repositoryLocationSchema).default([]),
  })
  .strict();

const vahuSchema = z
  .object({
    version: z.string().regex(semver, 'Expected a semantic version such as 0.1.0.'),
  })
  .strict();

const identitySchema = z
  .object({
    status: z.enum(['pending', 'approved']),
    approvedAt: z.iso.datetime().optional(),
    approvedBy: requiredText.optional(),
  })
  .strict();

const brandSchema = z
  .object({
    status: z.enum(['pending', 'approved', 'not-applicable']),
    assets: z
      .object({
        logo: requiredText.optional(),
        colors: z.array(requiredText).default([]),
        typography: z.array(requiredText).default([]),
        guidelines: requiredText.optional(),
      })
      .strict()
      .optional(),
    notes: requiredText.optional(),
  })
  .strict();

const designSystemSchema = z
  .object({
    status: z.enum(['not-started', 'pending-approval', 'approved', 'not-applicable']),
    source: z.enum(['existing', 'generated', 'none']),
    path: requiredText.optional(),
    notes: requiredText.optional(),
  })
  .strict();

const technologySchema = z
  .object({
    backend: z.array(requiredText).default([]),
    frontend: z.array(requiredText).default([]),
    mobile: z.array(requiredText).default([]),
    database: z.array(requiredText).default([]),
    infrastructure: z.array(requiredText).default([]),
    testing: z.array(requiredText).default([]),
    deployment: z.array(requiredText).default([]),
  })
  .strict();

const agentsSchema = z
  .object({
    enabled: z.array(agentNameSchema).min(1).default(['generic']),
    configuration: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

const readinessSchema = z
  .object({
    status: z.enum(['incomplete', 'ready', 'blocked']),
    checkedAt: z.iso.datetime().optional(),
    notes: z.array(requiredText).default([]),
  })
  .strict();

/** Schema 1.0.0, kept so a migration can validate a file before changing it. */
export const projectConfigV1_0_0Schema = z
  .object({
    $schema: z.url().optional(),
    schemaVersion: z.literal(PREVIOUS_SCHEMA_VERSION),
    vahu: vahuSchema,
    project: projectV1_0_0,
    identity: identitySchema,
    brand: brandSchema,
    designSystem: designSystemSchema,
    repositories: repositoriesV1_0_0,
    technology: technologySchema,
    agents: agentsSchema,
    readiness: readinessSchema,
  })
  .strict();

export const projectConfigSchema = z
  .object({
    $schema: z.url().optional(),
    schemaVersion: z.literal(SCHEMA_VERSION),
    vahu: vahuSchema,
    project: projectV1_1_0,
    identity: identitySchema,
    brand: brandSchema,
    designSystem: designSystemSchema,
    repositories: repositoriesV1_1_0,
    technology: technologySchema,
    agents: agentsSchema,
    readiness: readinessSchema,
  })
  .strict();

export type ProjectConfig = z.infer<typeof projectConfigSchema>;
export type ProjectConfigV1_0_0 = z.infer<typeof projectConfigV1_0_0Schema>;
export type ProjectType = z.infer<typeof projectTypeSchema>;
export type ProjectLifecycle = z.infer<typeof projectLifecycleSchema>;
export type RepositoryLocation = z.infer<typeof repositoryLocationSchema>;
export type AgentName = z.infer<typeof agentNameSchema>;

export interface ConfigIssue {
  path: string;
  message: string;
}

export type ParseProjectConfigResult =
  { ok: true; data: ProjectConfig } | { ok: false; issues: ConfigIssue[] };

export function parseProjectConfig(input: unknown): ParseProjectConfigResult {
  const result = projectConfigSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  return { ok: false, issues: configIssuesFromError(result.error) };
}

export function configIssuesFromError(error: z.ZodError): ConfigIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}
