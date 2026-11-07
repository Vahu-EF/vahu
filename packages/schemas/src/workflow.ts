import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const WORKFLOW_SCHEMA_VERSION = '1.0.0' as const;

export const workflowApprovalKindSchema = z.enum([
  'product-scope',
  'architecture',
  'data-migration',
  'security-permission',
  'brand-design',
  'production-deployment',
  'public-release',
]);

export const qualityGateKindSchema = z.enum([
  'formatting',
  'linting',
  'type-checking',
  'unit-tests',
  'integration-tests',
  'build-validation',
  'dependency-health',
  'secret-scanning',
  'security-check',
  'documentation-consistency',
  'accessibility',
  'performance',
  'custom',
]);

export const workflowStepSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    action: requiredText,
    output: requiredText.optional(),
  })
  .strict();

export const workflowApprovalSchema = z
  .object({
    id: z.string().regex(/^APPROVAL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    kind: workflowApprovalKindSchema,
    reason: requiredText,
  })
  .strict();

/** Agent-neutral workflow contract; it describes work but never executes it. */
export const workflowDefinitionSchema = z
  .object({
    schemaVersion: z.literal(WORKFLOW_SCHEMA_VERSION),
    id: z.string().regex(/^WORKFLOW-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    name: requiredText,
    purpose: requiredText,
    version: z.string().regex(semver, 'Expected a semantic version such as 0.1.0.'),
    trigger: requiredText,
    prerequisites: z.array(requiredText).default([]),
    requiredContext: z.array(requiredText).default([]),
    inputs: z.array(requiredText).default([]),
    steps: z.array(workflowStepSchema).min(1),
    outputs: z.array(requiredText).min(1),
    approvals: z.array(workflowApprovalSchema).default([]),
    qualityGates: z.array(z.string().regex(/^GATE-[A-Z0-9]+(?:-[A-Z0-9]+)*$/)).default([]),
    recovery: z.array(requiredText).min(1),
    relatedStandards: z.array(z.string().regex(/^P[0-9]+-[0-9]+$/)).default([]),
    relatedProfiles: z.array(z.string().regex(/^PROFILE-[A-Z0-9]+(?:-[A-Z0-9]+)*$/)).default([]),
  })
  .strict();

/** A gate is descriptive and profile-aware; this contract does not run commands. */
export const qualityGateSchema = z
  .object({
    schemaVersion: z.literal(WORKFLOW_SCHEMA_VERSION),
    id: z.string().regex(/^GATE-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    name: requiredText,
    kind: qualityGateKindSchema,
    description: requiredText,
    command: requiredText.optional(),
    severity: z.enum(['blocking', 'advisory']).default('blocking'),
    applicableProfiles: z.array(z.string().regex(/^PROFILE-[A-Z0-9]+(?:-[A-Z0-9]+)*$/)).default([]),
    evidenceRequired: z.boolean().default(true),
  })
  .strict();

export type WorkflowApprovalKind = z.infer<typeof workflowApprovalKindSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type WorkflowApproval = z.infer<typeof workflowApprovalSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
export type QualityGateKind = z.infer<typeof qualityGateKindSchema>;
export type QualityGateDefinition = z.infer<typeof qualityGateSchema>;

export interface WorkflowIssue {
  path: string;
  message: string;
}

export type ParseWorkflowResult =
  { ok: true; data: WorkflowDefinition } | { ok: false; issues: WorkflowIssue[] };

export type ParseQualityGateResult =
  { ok: true; data: QualityGateDefinition } | { ok: false; issues: WorkflowIssue[] };

export function parseWorkflowDefinition(input: unknown): ParseWorkflowResult {
  const result = workflowDefinitionSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, issues: issuesFromZod(result.error) };
}

export function parseQualityGate(input: unknown): ParseQualityGateResult {
  const result = qualityGateSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, issues: issuesFromZod(result.error) };
}

function issuesFromZod(error: z.ZodError): WorkflowIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}
