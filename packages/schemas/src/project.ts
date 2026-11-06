import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const projectTypeSchema = z.enum([
  'web-application',
  'mobile-application',
  'desktop-application',
  'backend-service',
  'library',
  'cli',
  'other',
]);

export const agentNameSchema = z.enum(['generic', 'codex', 'claude-code', 'gemini']);

export const projectConfigSchema = z
  .object({
    $schema: z.url().optional(),
    schemaVersion: z.literal('1.0.0'),
    vahu: z
      .object({
        version: z.string().regex(semver, 'Expected a semantic version such as 0.1.0.'),
      })
      .strict(),
    project: z
      .object({
        name: requiredText,
        slug: z
          .string()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Use lowercase letters, numbers and single hyphens.',
          ),
        description: requiredText,
        purpose: requiredText,
        targetUsers: z.array(requiredText).min(1),
        type: projectTypeSchema,
        languages: z.array(requiredText).min(1),
        scope: requiredText,
        constraints: z.array(requiredText).default([]),
      })
      .strict(),
    identity: z
      .object({
        status: z.enum(['pending', 'approved']),
        approvedAt: z.iso.datetime().optional(),
        approvedBy: requiredText.optional(),
      })
      .strict(),
    brand: z
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
      .strict(),
    designSystem: z
      .object({
        status: z.enum(['not-started', 'pending-approval', 'approved', 'not-applicable']),
        source: z.enum(['existing', 'generated', 'none']),
        path: requiredText.optional(),
        notes: requiredText.optional(),
      })
      .strict(),
    repositories: z
      .object({
        strategy: z.enum(['monorepo', 'multi-repository', 'hybrid']),
        notes: requiredText.optional(),
      })
      .strict(),
    technology: z
      .object({
        backend: z.array(requiredText).default([]),
        frontend: z.array(requiredText).default([]),
        mobile: z.array(requiredText).default([]),
        database: z.array(requiredText).default([]),
        infrastructure: z.array(requiredText).default([]),
        testing: z.array(requiredText).default([]),
        deployment: z.array(requiredText).default([]),
      })
      .strict(),
    agents: z
      .object({
        enabled: z.array(agentNameSchema).min(1).default(['generic']),
        configuration: z.record(z.string(), z.unknown()).default({}),
      })
      .strict(),
    readiness: z
      .object({
        status: z.enum(['incomplete', 'ready', 'blocked']),
        checkedAt: z.iso.datetime().optional(),
        notes: z.array(requiredText).default([]),
      })
      .strict(),
  })
  .strict();

export type ProjectConfig = z.infer<typeof projectConfigSchema>;
export type ProjectType = z.infer<typeof projectTypeSchema>;
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

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
      message: issue.message,
    })),
  };
}
