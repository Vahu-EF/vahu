import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  parseQualityGate,
  parseWorkflowDefinition,
  type QualityGateDefinition,
  type WorkflowDefinition,
} from '@vahu-ef/schemas';
import { evaluateWorkflow, loadWorkflowCatalog, validateWorkflowCatalog } from './workflows.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function workflow(overrides: Record<string, unknown> = {}): WorkflowDefinition {
  const parsed = parseWorkflowDefinition({
    schemaVersion: '1.0.0',
    id: 'WORKFLOW-IMPLEMENTATION',
    name: 'Implementation',
    purpose: 'Deliver an approved change safely.',
    version: '0.1.0',
    trigger: 'A scoped change is approved.',
    steps: [{ id: 'inspect', action: 'Read the governing standard.' }],
    outputs: ['Implemented change'],
    recovery: ['Stop on failure and report.'],
    qualityGates: ['GATE-TESTS'],
    ...overrides,
  });
  if (!parsed.ok) throw new Error('Workflow fixture is invalid.');
  return parsed.data;
}

function gate(overrides: Record<string, unknown> = {}): QualityGateDefinition {
  const parsed = parseQualityGate({
    schemaVersion: '1.0.0',
    id: 'GATE-TESTS',
    name: 'Tests',
    kind: 'unit-tests',
    description: 'Run focused tests.',
    ...overrides,
  });
  if (!parsed.ok) throw new Error('Gate fixture is invalid.');
  return parsed.data;
}

const pass = {
  workflowId: 'WORKFLOW-IMPLEMENTATION',
  gateResults: [{ gateId: 'GATE-TESTS', outcome: 'passed' as const, evidence: '12 tests passed' }],
  approvals: [],
};

describe('workflow catalog', () => {
  it('validates the canonical workflows and gates committed to the framework', async () => {
    const root = new URL('../../framework/workflows', import.meta.url).pathname;
    const catalog = await loadWorkflowCatalog(root);

    expect(catalog.ok).toBe(true);
    expect(catalog.workflows.length).toBeGreaterThanOrEqual(14);
    expect(catalog.gates.length).toBeGreaterThanOrEqual(12);
  });

  it('accepts references to gates in the catalog', () => {
    expect(validateWorkflowCatalog([workflow()], [gate()])).toEqual([]);
  });

  it('reports an unknown gate reference', () => {
    const issues = validateWorkflowCatalog(
      [workflow({ qualityGates: ['GATE-MISSING'] })],
      [gate()],
    );

    expect(issues.some((issue) => issue.code === 'WORKFLOW_GATE_UNKNOWN')).toBe(true);
  });

  it('reports unknown profile references against the sibling profile catalog', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vahu-workflow-profiles-'));
    tempDirectories.push(root);
    const framework = join(root, 'framework');
    const directory = join(framework, 'workflows');
    await mkdir(join(directory, 'workflows'), { recursive: true });
    await mkdir(join(directory, 'gates'));
    await mkdir(join(framework, 'technology-profiles'));
    await writeFile(
      join(directory, 'workflows/implementation.json'),
      JSON.stringify(workflow({ relatedProfiles: ['PROFILE-MISSING'] })),
      'utf8',
    );
    await writeFile(
      join(directory, 'gates/tests.json'),
      JSON.stringify(gate({ applicableProfiles: ['PROFILE-ALSO-MISSING'] })),
      'utf8',
    );

    const catalog = await loadWorkflowCatalog(directory);

    expect(catalog.ok).toBe(false);
    expect(catalog.issues.some((issue) => issue.code === 'WORKFLOW_PROFILE_UNKNOWN')).toBe(true);
    expect(catalog.issues.some((issue) => issue.code === 'GATE_PROFILE_UNKNOWN')).toBe(true);
  });

  it('reports duplicate workflow, gate, and step identifiers', () => {
    const duplicateSteps = workflow({
      steps: [
        { id: 'inspect', action: 'Read.' },
        { id: 'inspect', action: 'Read again.' },
      ],
    });
    const issues = validateWorkflowCatalog(
      [workflow(), workflow(), duplicateSteps],
      [gate(), gate()],
    );

    expect(issues.map((issue) => issue.code)).toContain('WORKFLOW_DUPLICATE_ID');
    expect(issues.map((issue) => issue.code)).toContain('GATE_DUPLICATE_ID');
    expect(issues.map((issue) => issue.code)).toContain('WORKFLOW_DUPLICATE_STEP');
  });

  it('loads valid workflow and gate JSON from the framework catalog', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vahu-workflows-'));
    tempDirectories.push(root);
    await mkdir(join(root, 'workflows'));
    await mkdir(join(root, 'gates'));
    await writeFile(
      join(root, 'workflows/implementation.json'),
      JSON.stringify(workflow()),
      'utf8',
    );
    await writeFile(join(root, 'gates/tests.json'), JSON.stringify(gate()), 'utf8');

    const catalog = await loadWorkflowCatalog(root);

    expect(catalog.ok).toBe(true);
    expect(catalog.workflows).toHaveLength(1);
    expect(catalog.gates).toHaveLength(1);
  });
});

describe('workflow evaluation', () => {
  it('passes when required gates have evidence and approvals are recorded', () => {
    const definition = workflow({
      approvals: [
        {
          id: 'APPROVAL-SCOPE',
          kind: 'product-scope',
          reason: 'Owner accepts the scope.',
        },
      ],
    });

    const result = evaluateWorkflow(definition, [gate()], {
      ...pass,
      approvals: [
        {
          approvalId: 'APPROVAL-SCOPE',
          approved: true,
          approvedBy: 'Project Owner',
          evidence: 'Approved in issue #42.',
        },
      ],
    });

    expect(result.status).toBe('passed');
  });

  it('blocks when a required gate result is missing', () => {
    const result = evaluateWorkflow(workflow(), [gate()], {
      workflowId: 'WORKFLOW-IMPLEMENTATION',
      gateResults: [],
      approvals: [],
    });

    expect(result.status).toBe('blocked');
    expect(result.issues.some((issue) => issue.code === 'GATE_RESULT_MISSING')).toBe(true);
  });

  it('blocks when gate evidence is required but missing', () => {
    const result = evaluateWorkflow(workflow(), [gate()], {
      ...pass,
      gateResults: [{ gateId: 'GATE-TESTS', outcome: 'passed' }],
    });

    expect(result.status).toBe('blocked');
    expect(result.issues.some((issue) => issue.code === 'GATE_EVIDENCE_MISSING')).toBe(true);
  });

  it('fails a blocking gate that failed', () => {
    const result = evaluateWorkflow(workflow(), [gate()], {
      ...pass,
      gateResults: [
        {
          gateId: 'GATE-TESTS',
          outcome: 'failed',
          evidence: '1 test failed',
          reason: 'Assertion.',
        },
      ],
    });

    expect(result.status).toBe('failed');
  });

  it('blocks a skipped blocking gate', () => {
    const result = evaluateWorkflow(workflow(), [gate()], {
      ...pass,
      gateResults: [
        { gateId: 'GATE-TESTS', outcome: 'skipped', evidence: 'Not run', reason: 'N/A' },
      ],
    });

    expect(result.status).toBe('blocked');
    expect(result.issues.some((issue) => issue.code === 'GATE_SKIPPED')).toBe(true);
  });

  it('blocks missing or anonymous approval evidence', () => {
    const definition = workflow({
      approvals: [
        { id: 'APPROVAL-ARCH', kind: 'architecture', reason: 'Owner accepts architecture.' },
      ],
    });
    const result = evaluateWorkflow(definition, [gate()], {
      ...pass,
      approvals: [{ approvalId: 'APPROVAL-ARCH', approved: true, evidence: 'OK' }],
    });

    expect(result.status).toBe('blocked');
    expect(result.issues.some((issue) => issue.code === 'APPROVAL_EVIDENCE_MISSING')).toBe(true);
  });

  it('fails when a required approval is rejected', () => {
    const definition = workflow({
      approvals: [{ id: 'APPROVAL-SCOPE', kind: 'product-scope', reason: 'Owner accepts scope.' }],
    });
    const result = evaluateWorkflow(definition, [gate()], {
      ...pass,
      approvals: [
        { approvalId: 'APPROVAL-SCOPE', approved: false, evidence: 'Scope not accepted.' },
      ],
    });

    expect(result.status).toBe('failed');
  });

  it('rejects a result supplied for a gate scoped to an unselected profile', () => {
    const scoped = gate({ id: 'GATE-POSTGRES', applicableProfiles: ['PROFILE-POSTGRESQL'] });
    const definition = workflow({ qualityGates: ['GATE-POSTGRES'] });
    const result = evaluateWorkflow(definition, [scoped], {
      workflowId: definition.id,
      gateResults: [{ gateId: 'GATE-POSTGRES', outcome: 'passed', evidence: 'Passed.' }],
      approvals: [],
      selectedProfileIds: ['PROFILE-NODE-BACKEND'],
    });

    expect(result.status).toBe('blocked');
    expect(result.issues.some((issue) => issue.code === 'GATE_RESULT_NOT_APPLICABLE')).toBe(true);
  });

  it('does not require a gate scoped to an unselected profile', () => {
    const scoped = gate({
      id: 'GATE-POSTGRES',
      applicableProfiles: ['PROFILE-POSTGRESQL'],
    });
    const definition = workflow({ qualityGates: ['GATE-POSTGRES'] });

    const result = evaluateWorkflow(definition, [scoped], {
      workflowId: definition.id,
      gateResults: [],
      approvals: [],
      selectedProfileIds: ['PROFILE-NODE-BACKEND'],
    });

    expect(result.status).toBe('passed');
    expect(result.gates).toEqual([]);
  });

  it('reports a missing advisory gate as a warning, not a block', () => {
    const advisory = gate({ severity: 'advisory' });
    const result = evaluateWorkflow(workflow(), [advisory], {
      workflowId: 'WORKFLOW-IMPLEMENTATION',
      gateResults: [],
      approvals: [],
    });

    expect(result.status).toBe('passed-with-warnings');
    expect(result.issues.some((issue) => issue.code === 'GATE_ADVISORY_RESULT_MISSING')).toBe(true);
  });

  it('blocks a result for the wrong workflow or an unreferenced gate', () => {
    const result = evaluateWorkflow(workflow(), [gate()], {
      ...pass,
      workflowId: 'WORKFLOW-OTHER',
      gateResults: [
        ...pass.gateResults,
        { gateId: 'GATE-OTHER', outcome: 'passed', evidence: 'Passed.' },
      ],
    });

    expect(result.status).toBe('blocked');
    expect(result.issues.some((issue) => issue.code === 'WORKFLOW_ID_MISMATCH')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'GATE_RESULT_UNEXPECTED')).toBe(true);
  });
});
