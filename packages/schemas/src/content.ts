import { z } from 'zod';
import { projectTypeSchema } from './project.js';

const requiredText = z.string().trim().min(1);
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** Content IDs are stable, upper-case, and hyphenated: `P1-03`, `TPL-ADR`. */
export const CONTENT_ID_PATTERN = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;

export const contentTypeSchema = z.enum([
  'standard',
  'practice',
  'guide',
  'workflow',
  'profile',
  'template',
  'adapter',
]);

export const contentStatusSchema = z.enum(['draft', 'experimental', 'stable', 'deprecated']);

export const lifecycleStageSchema = z.enum([
  'planning',
  'design',
  'implementation',
  'review',
  'release',
  'operations',
]);

export const contentOriginSchema = z.enum(['core', 'practice', 'profile', 'adapter']);

export const contentEnforcementSchema = z.enum(['mandatory', 'recommended', 'optional']);

export const contentScopeSchema = z.union([z.literal('all'), projectTypeSchema]);

export const contentItemSchema = z
  .object({
    id: z
      .string()
      .regex(CONTENT_ID_PATTERN, 'Use an upper-case hyphenated identifier such as P1-03.'),
    title: requiredText,
    description: requiredText,
    contentType: contentTypeSchema,
    origin: contentOriginSchema,
    status: contentStatusSchema,
    version: z.string().regex(semver, 'Expected a semantic version such as 0.1.0.'),
    owner: requiredText,
    path: requiredText,
    enforcement: contentEnforcementSchema,
    projectTypes: z.array(contentScopeSchema).min(1),
    lifecycleStages: z.array(lifecycleStageSchema).min(1),
    dependencies: z.array(z.string().regex(CONTENT_ID_PATTERN)).default([]),
    tags: z.array(requiredText).default([]),
    compatibility: requiredText.optional(),
  })
  .strict();

export type ContentType = z.infer<typeof contentTypeSchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type LifecycleStage = z.infer<typeof lifecycleStageSchema>;
export type ContentOrigin = z.infer<typeof contentOriginSchema>;
export type ContentEnforcement = z.infer<typeof contentEnforcementSchema>;
export type ContentScope = z.infer<typeof contentScopeSchema>;
export type ContentItem = z.infer<typeof contentItemSchema>;
export type ContentItemInput = z.input<typeof contentItemSchema>;

export interface ContentIssue {
  path: string;
  message: string;
}

export type ParseContentItemResult =
  | { ok: true; data: ContentItem }
  | { ok: false; issues: ContentIssue[] };

export function parseContentItem(input: unknown): ParseContentItemResult {
  const result = contentItemSchema.safeParse(input);
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

/** Maps the P1-14 standard-page status to the content-model status. */
export function standardStatusToContentStatus(status: string): ContentStatus | null {
  switch (status) {
    case 'Draft':
      return 'draft';
    case 'Accepted':
      return 'stable';
    case 'Superseded':
    case 'Retired':
      return 'deprecated';
    default:
      return null;
  }
}
