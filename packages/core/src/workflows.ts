import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  parseQualityGate,
  parseWorkflowDefinition,
  type QualityGateDefinition,
  type WorkflowDefinition,
} from '@vahu-ef/schemas';
import type { FrameworkIssue } from './issues.js';
import { loadProfileCatalog } from './profiles.js';

export interface WorkflowCatalog {
  ok: boolean;
  workflows: WorkflowDefinition[];
  gates: QualityGateDefinition[];
  issues: FrameworkIssue[];
}

export type GateOutcome = 'passed' | 'failed' | 'skipped' | 'blocked';

export interface GateResultInput {
  gateId: string;
  outcome: GateOutcome;
  evidence?: string;
  reason?: string;
}

export interface ApprovalInput {
  approvalId: string;
  approved: boolean;
  approvedBy?: string;
  evidence?: string;
}

export interface WorkflowEvaluationInput {
  workflowId: string;
  gateResults: readonly GateResultInput[];
  approvals: readonly ApprovalInput[];
  selectedProfileIds?: readonly string[];
}

export interface WorkflowEvaluation {
  workflowId: string;
  status: 'passed' | 'passed-with-warnings' | 'failed' | 'blocked';
  gates: Array<GateResultInput & { severity: 'blocking' | 'advisory' }>;
  approvals: Array<ApprovalInput & { status: 'approved' | 'rejected' | 'missing' }>;
  issues: FrameworkIssue[];
}

/** Loads workflows and gates, validating every JSON file and cross-reference. */
export async function loadWorkflowCatalog(directory: string): Promise<WorkflowCatalog> {
  const workflowsDirectory = join(directory, 'workflows');
  const gatesDirectory = join(directory, 'gates');
  const [workflows, workflowIssues] = await loadFiles(workflowsDirectory, 'workflow');
  const [gates, gateIssues] = await loadFiles(gatesDirectory, 'gate');
  const parsedWorkflows = workflows as WorkflowDefinition[];
  const parsedGates = gates as QualityGateDefinition[];
  const issues = [...workflowIssues, ...gateIssues];
  let knownProfileIds: string[] | undefined;
  try {
    await readdir(join(dirname(directory), 'technology-profiles'));
    const profileCatalog = await loadProfileCatalog(
      join(dirname(directory), 'technology-profiles'),
    );
    issues.push(...profileCatalog.issues);
    knownProfileIds = profileCatalog.profiles.map((profile) => profile.id);
  } catch {
    // Standalone workflow catalogs may omit the optional profile catalog.
  }
  issues.push(...validateWorkflowCatalog(parsedWorkflows, parsedGates, knownProfileIds));
  return { ok: issues.length === 0, workflows: parsedWorkflows, gates: parsedGates, issues };
}

export function validateWorkflowCatalog(
  workflows: readonly WorkflowDefinition[],
  gates: readonly QualityGateDefinition[],
  knownProfileIds?: readonly string[],
): FrameworkIssue[] {
  const issues: FrameworkIssue[] = [];
  const workflowIds = new Set<string>();
  const gateIds = new Set<string>();

  for (const workflow of workflows) {
    if (workflowIds.has(workflow.id)) {
      issues.push({
        code: 'WORKFLOW_DUPLICATE_ID',
        path: workflow.id,
        message: `Duplicate workflow identifier ${workflow.id}.`,
      });
    }
    workflowIds.add(workflow.id);

    const stepIds = new Set<string>();
    for (const step of workflow.steps) {
      if (stepIds.has(step.id)) {
        issues.push({
          code: 'WORKFLOW_DUPLICATE_STEP',
          path: `${workflow.id}.${step.id}`,
          message: `Duplicate step identifier ${step.id}.`,
        });
      }
      stepIds.add(step.id);
    }
  }

  const knownProfiles = knownProfileIds ? new Set(knownProfileIds) : undefined;

  for (const gate of gates) {
    if (gateIds.has(gate.id)) {
      issues.push({
        code: 'GATE_DUPLICATE_ID',
        path: gate.id,
        message: `Duplicate quality-gate identifier ${gate.id}.`,
      });
    }
    gateIds.add(gate.id);
    for (const profileId of gate.applicableProfiles) {
      if (knownProfiles && !knownProfiles.has(profileId)) {
        issues.push({
          code: 'GATE_PROFILE_UNKNOWN',
          path: gate.id,
          message: `${gate.id} references unknown profile ${profileId}.`,
        });
      }
    }
  }

  for (const workflow of workflows) {
    for (const profileId of workflow.relatedProfiles) {
      if (knownProfiles && !knownProfiles.has(profileId)) {
        issues.push({
          code: 'WORKFLOW_PROFILE_UNKNOWN',
          path: workflow.id,
          message: `${workflow.id} references unknown profile ${profileId}.`,
        });
      }
    }
    for (const gateId of workflow.qualityGates) {
      if (!gateIds.has(gateId)) {
        issues.push({
          code: 'WORKFLOW_GATE_UNKNOWN',
          path: workflow.id,
          message: `${workflow.id} references unknown gate ${gateId}.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Evaluates supplied evidence only; it never executes a command or gate.
 * A missing result or approval is blocked, never interpreted as a pass.
 */
export function evaluateWorkflow(
  workflow: WorkflowDefinition,
  gates: readonly QualityGateDefinition[],
  input: WorkflowEvaluationInput,
): WorkflowEvaluation {
  const issues: FrameworkIssue[] = [];
  const selectedProfiles = new Set(input.selectedProfileIds ?? []);
  if (input.workflowId !== workflow.id) {
    issues.push({
      code: 'WORKFLOW_ID_MISMATCH',
      path: workflow.id,
      message: `Evaluation is for ${input.workflowId}, but the supplied definition is ${workflow.id}.`,
    });
  }
  const applicableGates = gates.filter(
    (gate) =>
      workflow.qualityGates.includes(gate.id) &&
      (gate.applicableProfiles.length === 0 ||
        gate.applicableProfiles.some((profileId) => selectedProfiles.has(profileId))),
  );
  const results = new Map<string, GateResultInput>();

  const applicableGateIds = new Set(applicableGates.map((gate) => gate.id));
  for (const result of input.gateResults) {
    if (!workflow.qualityGates.includes(result.gateId)) {
      issues.push({
        code: 'GATE_RESULT_UNEXPECTED',
        path: result.gateId,
        message: `${result.gateId} is not required by ${workflow.id}.`,
      });
    } else if (!applicableGateIds.has(result.gateId)) {
      issues.push({
        code: 'GATE_RESULT_NOT_APPLICABLE',
        path: result.gateId,
        message: `${result.gateId} is not applicable to the selected profiles.`,
      });
    }
    if (results.has(result.gateId)) {
      issues.push({
        code: 'GATE_RESULT_DUPLICATE',
        path: result.gateId,
        message: `More than one result was supplied for ${result.gateId}.`,
      });
    }
    results.set(result.gateId, result);
  }

  const evaluatedGates = applicableGates.map((gate) => {
    const result = results.get(gate.id);
    if (!result) {
      issues.push({
        code: gate.severity === 'blocking' ? 'GATE_RESULT_MISSING' : 'GATE_ADVISORY_RESULT_MISSING',
        path: gate.id,
        message: `No result was supplied for ${gate.severity} gate ${gate.id}.`,
      });
      return {
        gateId: gate.id,
        outcome: gate.severity === 'blocking' ? ('blocked' as const) : ('skipped' as const),
        reason: 'No gate result was supplied.',
        severity: gate.severity,
      };
    }

    if (gate.evidenceRequired && !nonEmpty(result.evidence)) {
      issues.push({
        code:
          gate.severity === 'blocking' ? 'GATE_EVIDENCE_MISSING' : 'GATE_ADVISORY_EVIDENCE_MISSING',
        path: gate.id,
        message: `${gate.id} requires evidence for its ${result.outcome} result.`,
      });
    }

    if (result.outcome === 'failed' || result.outcome === 'blocked') {
      issues.push({
        code:
          gate.severity === 'blocking'
            ? result.outcome === 'failed'
              ? 'GATE_FAILED'
              : 'GATE_BLOCKED'
            : 'GATE_ADVISORY_NOT_PASSED',
        path: gate.id,
        message: `${gate.id} was ${result.outcome}${result.reason ? `: ${result.reason}` : '.'}`,
      });
    } else if (result.outcome === 'skipped') {
      issues.push({
        code: gate.severity === 'blocking' ? 'GATE_SKIPPED' : 'GATE_ADVISORY_NOT_PASSED',
        path: gate.id,
        message: `${gate.id} was skipped${result.reason ? `: ${result.reason}` : '.'}`,
      });
    }

    return { ...result, severity: gate.severity };
  });

  const approvalResults = new Map<string, ApprovalInput>();
  const requiredApprovalIds = new Set(workflow.approvals.map((approval) => approval.id));
  for (const approval of input.approvals) {
    if (!requiredApprovalIds.has(approval.approvalId)) {
      issues.push({
        code: 'APPROVAL_UNEXPECTED',
        path: approval.approvalId,
        message: `${approval.approvalId} is not required by ${workflow.id}.`,
      });
    }
    if (approvalResults.has(approval.approvalId)) {
      issues.push({
        code: 'APPROVAL_DUPLICATE',
        path: approval.approvalId,
        message: `More than one result was supplied for ${approval.approvalId}.`,
      });
    }
    approvalResults.set(approval.approvalId, approval);
  }

  const evaluatedApprovals = workflow.approvals.map((required) => {
    const result = approvalResults.get(required.id);
    if (!result) {
      issues.push({
        code: 'APPROVAL_MISSING',
        path: required.id,
        message: `Required approval ${required.id} (${required.kind}) has not been recorded.`,
      });
      return { approvalId: required.id, approved: false, status: 'missing' as const };
    }

    if (!result.approved) {
      issues.push({
        code: 'APPROVAL_REJECTED',
        path: required.id,
        message: `Required approval ${required.id} was rejected${result.evidence ? `: ${result.evidence}` : '.'}`,
      });
      return { ...result, status: 'rejected' as const };
    }

    if (!nonEmpty(result.approvedBy) || !nonEmpty(result.evidence)) {
      issues.push({
        code: 'APPROVAL_EVIDENCE_MISSING',
        path: required.id,
        message: `Approval ${required.id} needs a named approver and evidence.`,
      });
      return { ...result, status: 'missing' as const };
    }

    return { ...result, status: 'approved' as const };
  });

  const hasRejectedApproval = evaluatedApprovals.some((approval) => approval.status === 'rejected');
  const hasFailedBlockingGate = evaluatedGates.some(
    (gate) => gate.severity === 'blocking' && gate.outcome === 'failed',
  );
  const hasBlockedCondition =
    issues.some((issue) =>
      [
        'WORKFLOW_ID_MISMATCH',
        'GATE_RESULT_DUPLICATE',
        'GATE_RESULT_MISSING',
        'GATE_RESULT_UNEXPECTED',
        'GATE_RESULT_NOT_APPLICABLE',
        'GATE_EVIDENCE_MISSING',
        'GATE_BLOCKED',
        'GATE_SKIPPED',
        'APPROVAL_MISSING',
        'APPROVAL_EVIDENCE_MISSING',
        'APPROVAL_DUPLICATE',
        'APPROVAL_UNEXPECTED',
      ].includes(issue.code),
    ) || evaluatedGates.some((gate) => gate.severity === 'blocking' && gate.outcome === 'blocked');
  const hasWarnings = issues.length > 0;
  const status =
    hasRejectedApproval || hasFailedBlockingGate
      ? 'failed'
      : hasBlockedCondition
        ? 'blocked'
        : hasWarnings
          ? 'passed-with-warnings'
          : 'passed';

  return {
    workflowId: input.workflowId,
    status,
    gates: evaluatedGates,
    approvals: evaluatedApprovals,
    issues,
  };
}

async function loadFiles(
  directory: string,
  kind: 'workflow' | 'gate',
): Promise<[unknown[], FrameworkIssue[]]> {
  let files: string[];
  try {
    files = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  } catch {
    return [
      [],
      [
        {
          code: 'WORKFLOW_DIRECTORY_MISSING',
          path: directory,
          message: `The ${kind} directory does not exist.`,
        },
      ],
    ];
  }

  const definitions: unknown[] = [];
  const issues: FrameworkIssue[] = [];
  for (const name of files) {
    let input: unknown;
    try {
      input = JSON.parse(await readFile(join(directory, name), 'utf8'));
    } catch {
      issues.push({
        code: 'WORKFLOW_INVALID_JSON',
        path: `${kind}/${name}`,
        message: 'The definition is not valid JSON.',
      });
      continue;
    }

    const parsed = kind === 'workflow' ? parseWorkflowDefinition(input) : parseQualityGate(input);
    if (!parsed.ok) {
      issues.push(
        ...parsed.issues.map((issue) => ({
          code: 'WORKFLOW_INVALID',
          path: `${kind}/${name}#${issue.path}`,
          message: issue.message,
        })),
      );
      continue;
    }
    definitions.push(parsed.data);
  }

  return [definitions, issues];
}

function nonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
