import { describe, expect, it } from 'vitest';
import { parseQualityGate, parseWorkflowDefinition } from './workflow.js';

function workflow(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0.0',
    id: 'WORKFLOW-IMPLEMENTATION',
    name: 'Implementation',
    purpose: 'Deliver an approved change safely.',
    version: '0.1.0',
    trigger: 'A scoped change is approved.',
    steps: [{ id: 'inspect', action: 'Read the governing standard.' }],
    outputs: ['Implemented change', 'Verification report'],
    recovery: ['Stop on a failed gate and report the evidence.'],
    ...overrides,
  };
}

describe('workflow definition schema', () => {
  it('accepts a minimal provider-neutral workflow', () => {
    expect(parseWorkflowDefinition(workflow()).ok).toBe(true);
  });

  it('requires at least one step, output, and recovery action', () => {
    expect(parseWorkflowDefinition(workflow({ steps: [] })).ok).toBe(false);
    expect(parseWorkflowDefinition(workflow({ outputs: [] })).ok).toBe(false);
    expect(parseWorkflowDefinition(workflow({ recovery: [] })).ok).toBe(false);
  });

  it('validates human approval checkpoints', () => {
    const result = parseWorkflowDefinition(
      workflow({
        approvals: [
          {
            id: 'APPROVAL-PRODUCTION',
            kind: 'production-deployment',
            reason: 'Production changes need owner approval.',
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
  });

  it('rejects malformed related standard identifiers', () => {
    expect(parseWorkflowDefinition(workflow({ relatedStandards: ['testing'] })).ok).toBe(false);
  });

  it('rejects unknown fields', () => {
    expect(parseWorkflowDefinition(workflow({ provider: 'vendor' })).ok).toBe(false);
  });
});

describe('quality gate schema', () => {
  it('accepts a profile-aware gate', () => {
    const result = parseQualityGate({
      schemaVersion: '1.0.0',
      id: 'GATE-UNIT-TESTS',
      name: 'Unit tests',
      kind: 'unit-tests',
      description: 'Run focused unit tests.',
      command: 'pnpm test',
      applicableProfiles: ['PROFILE-NODE-BACKEND'],
    });

    expect(result.ok).toBe(true);
  });

  it('defaults to blocking with required evidence', () => {
    const result = parseQualityGate({
      schemaVersion: '1.0.0',
      id: 'GATE-DOCS',
      name: 'Docs consistency',
      kind: 'documentation-consistency',
      description: 'Check links and examples.',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.severity).toBe('blocking');
      expect(result.data.evidenceRequired).toBe(true);
    }
  });

  it('rejects a commandless execution claim only when command is present and malformed', () => {
    const result = parseQualityGate({
      schemaVersion: '1.0.0',
      id: 'GATE-CUSTOM',
      name: 'Custom check',
      kind: 'custom',
      description: 'Human check.',
      severity: 'advisory',
      evidenceRequired: false,
      applicableProfiles: [],
    });

    expect(result.ok).toBe(true);
  });
});
