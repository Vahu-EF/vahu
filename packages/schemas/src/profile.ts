import { z } from 'zod';
import { contentScopeSchema } from './content.js';

const requiredText = z.string().trim().min(1);
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const PROFILE_SCHEMA_VERSION = '1.0.0' as const;

export const profileCategorySchema = z.enum([
  'backend',
  'frontend',
  'mobile',
  'database',
  'infrastructure',
  'api',
  'testing',
]);

const profileId = z
  .string()
  .regex(/^PROFILE-[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'Use an identifier such as PROFILE-NODE-BACKEND.');

/**
 * A technology profile is optional and composable. It applies only when a
 * project selects its technology, and it never becomes an implicit default.
 */
export const technologyProfileSchema = z
  .object({
    schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
    id: profileId,
    name: requiredText,
    description: requiredText,
    version: z.string().regex(semver, 'Expected a semantic version such as 0.1.0.'),
    category: profileCategorySchema,
    technology: requiredText,
    supportedVersions: z.array(requiredText).min(1),
    projectTypes: z.array(contentScopeSchema).min(1),
    prerequisites: z.array(profileId).default([]),
    related: z.array(profileId).default([]),
    architecture: z.array(requiredText).default([]),
    structure: z.array(requiredText).default([]),
    conventions: z.array(requiredText).default([]),
    testing: z.array(requiredText).default([]),
    security: z.array(requiredText).default([]),
    documentation: z.array(requiredText).default([]),
    tooling: z.array(requiredText).default([]),
    checks: z.array(requiredText).default([]),
    compatibility: z
      .object({
        conflictsWith: z.array(profileId).default([]),
        notes: requiredText.optional(),
      })
      .strict()
      .default({ conflictsWith: [] }),
  })
  .strict();

export type ProfileCategory = z.infer<typeof profileCategorySchema>;
export type TechnologyProfile = z.infer<typeof technologyProfileSchema>;

export interface ProfileIssue {
  path: string;
  message: string;
}

export type ParseProfileResult =
  | { ok: true; data: TechnologyProfile }
  | { ok: false; issues: ProfileIssue[] };

export function parseTechnologyProfile(input: unknown): ParseProfileResult {
  const result = technologyProfileSchema.safeParse(input);
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
