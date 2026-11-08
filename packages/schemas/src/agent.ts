import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const AGENT_SCHEMA_VERSION = '1.0.0' as const;

export const agentAdapterIdSchema = z.enum(['generic', 'codex', 'claude-code', 'gemini']);

export const agentRuleScopeSchema = z.enum(['project', 'repository', 'path', 'package']);

export const agentRuleSchema = z
  .object({
    id: z.string().regex(/^[A-Z][A-Z0-9-]*$/, 'Use an upper-case identifier such as RULE-TESTS.'),
    scope: agentRuleScopeSchema,
    path: requiredText.optional(),
    text: requiredText,
  })
  .strict()
  .refine(
    (rule) => (rule.scope === 'path' || rule.scope === 'package' ? rule.path !== undefined : true),
    { message: 'A path or package rule needs a path.', path: ['path'] },
  )
  .refine(
    (rule) =>
      rule.scope === 'project' || rule.scope === 'repository' ? rule.path === undefined : true,
    { message: 'Project and repository rules must not carry a path.', path: ['path'] },
  );

export const agentSkillSchema = z
  .object({
    name: requiredText,
    description: requiredText,
    path: requiredText.optional(),
  })
  .strict();

export const agentCommandSchema = z
  .object({
    name: requiredText,
    description: requiredText,
    run: requiredText.optional(),
  })
  .strict();

export const agentWorkflowSchema = z
  .object({
    name: requiredText,
    steps: z.array(requiredText).min(1),
  })
  .strict();

export const agentToolSchema = z
  .object({
    name: requiredText,
    required: z.boolean().default(false),
    approval: z.enum(['always', 'on-write', 'never']).default('always'),
  })
  .strict();

export const agentContextSchema = z
  .object({
    path: requiredText,
    description: requiredText.optional(),
  })
  .strict();

/**
 * Canonical agent definition: provider-neutral instructions, rules, skills,
 * commands, workflows, tools, context, and compatibility metadata. No field is
 * shaped around one provider's file format.
 */
export const agentDefinitionSchema = z
  .object({
    schemaVersion: z.literal(AGENT_SCHEMA_VERSION),
    id: z
      .string()
      .regex(/^AGENT-[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'Use an identifier such as AGENT-REVIEWER.'),
    name: requiredText,
    description: requiredText,
    version: z.string().regex(semver, 'Expected a semantic version such as 0.1.0.'),
    instructions: z.array(requiredText).default([]),
    rules: z.array(agentRuleSchema).default([]),
    skills: z.array(agentSkillSchema).default([]),
    commands: z.array(agentCommandSchema).default([]),
    workflows: z.array(agentWorkflowSchema).default([]),
    tools: z.array(agentToolSchema).default([]),
    context: z.array(agentContextSchema).default([]),
    approvals: z.array(requiredText).default([]),
    compatibility: z
      .object({
        adapters: z.array(agentAdapterIdSchema).default([]),
      })
      .strict()
      .default({ adapters: [] }),
  })
  .strict();

export type AgentAdapterId = z.infer<typeof agentAdapterIdSchema>;
export type AgentRuleScope = z.infer<typeof agentRuleScopeSchema>;
export type AgentRule = z.infer<typeof agentRuleSchema>;
export type AgentSkill = z.infer<typeof agentSkillSchema>;
export type AgentCommand = z.infer<typeof agentCommandSchema>;
export type AgentWorkflow = z.infer<typeof agentWorkflowSchema>;
export type AgentTool = z.infer<typeof agentToolSchema>;
export type AgentContext = z.infer<typeof agentContextSchema>;
export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;

export interface AgentIssue {
  path: string;
  message: string;
}

export type ParseAgentResult =
  | { ok: true; data: AgentDefinition }
  | { ok: false; issues: AgentIssue[] };

export function parseAgentDefinition(input: unknown): ParseAgentResult {
  const result = agentDefinitionSchema.safeParse(input);
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
