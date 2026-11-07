import type { DoctorReport, FoundationReport, ValidationResult } from '@vahu-ef/core';
import type { ProjectConfig } from '@vahu-ef/schemas';

export function formatDoctor(report: DoctorReport): string {
  const lines = ['VAHU doctor', ''];

  for (const check of report.checks) {
    lines.push(`${statusLabel(check.status)} ${check.name}: ${check.detail}`);
    if (check.recommendation) {
      lines.push(`      ${check.recommendation}`);
    }
  }

  lines.push(
    '',
    `Summary: ${report.summary.passed} passed, ${report.summary.warnings} warning(s), ${report.summary.failed} failed.`,
  );

  return lines.join('\n');
}

export function formatValidation(result: ValidationResult): string {
  return [
    'VAHU validation',
    `Configuration: ${result.configPath}`,
    '',
    ...issueLines(result, 'PASS: The project configuration is valid.'),
  ].join('\n');
}

export function formatReadiness(result: ValidationResult, status: string): string {
  return [
    'VAHU readiness',
    `Configuration: ${result.configPath}`,
    `Status: ${status}`,
    '',
    ...issueLines(result, 'PASS: No blocking issue and no recommendation.'),
  ].join('\n');
}

export function formatBrand(config: ProjectConfig): string {
  const { brand } = config;
  const lines = ['VAHU brand identity', '', `Status: ${brand.status}`];

  if (brand.assets) {
    lines.push(`Logo: ${brand.assets.logo ?? 'none'}`);
    lines.push(`Colors: ${joinOrNone(brand.assets.colors)}`);
    lines.push(`Typography: ${joinOrNone(brand.assets.typography)}`);
    lines.push(`Guidelines: ${brand.assets.guidelines ?? 'none'}`);
  } else {
    lines.push('Assets: none recorded');
  }

  if (brand.notes) {
    lines.push(`Notes: ${brand.notes}`);
  }

  return lines.join('\n');
}

export function formatDesignSystem(config: ProjectConfig): string {
  const { designSystem } = config;
  const lines = [
    'VAHU design system',
    '',
    `Status: ${designSystem.status}`,
    `Source: ${designSystem.source}`,
    `Path: ${designSystem.path ?? 'none'}`,
  ];

  if (designSystem.notes) {
    lines.push(`Notes: ${designSystem.notes}`);
  }

  return lines.join('\n');
}

export function formatTechnology(config: ProjectConfig): string {
  const lines = ['VAHU technology selection', ''];
  for (const [area, values] of Object.entries(config.technology)) {
    lines.push(`${area}: ${joinOrNone(values)}`);
  }
  return lines.join('\n');
}

export function formatRepositories(config: ProjectConfig): string {
  const { repositories } = config;
  const lines = ['VAHU repositories', '', `Strategy: ${repositories.strategy}`];

  if (repositories.notes) {
    lines.push(`Notes: ${repositories.notes}`);
  }

  if (repositories.locations.length === 0) {
    lines.push('Locations: none recorded');
  } else {
    lines.push('Locations:');
    for (const location of repositories.locations) {
      lines.push(
        `  ${location.name} → ${location.path ?? location.url ?? 'unknown'}${location.owner ? ` (owner: ${location.owner})` : ''}`,
      );
    }
  }

  return lines.join('\n');
}

export function formatFoundation(report: FoundationReport): string {
  const lines = ['VAHU engineering foundation', '', 'Detected from files; nothing is stored.'];
  lines.push('', `Package manager: ${report.packageManager ?? 'not detected'}`);
  lines.push(`Scripts: ${joinOrNone(report.scripts)}`);
  lines.push(`CI workflows: ${joinOrNone(report.ciWorkflows)}`);
  lines.push(`Documentation: ${joinOrNone(report.docsPaths)}`);
  lines.push(`Environment example: ${report.envExample ?? 'none'}`);
  return lines.join('\n');
}

function issueLines(result: ValidationResult, passMessage: string): string[] {
  const lines: string[] = [];

  if (result.issues.length === 0) {
    lines.push(passMessage);
  } else {
    for (const issue of result.issues) {
      lines.push(`${issue.severity === 'error' ? 'ERROR' : 'WARN'}: ${issue.path}`);
      lines.push(`  ${issue.message} (${issue.code})`);
    }
  }

  const blocking = result.issues.filter((issue) => issue.severity === 'error').length;
  const recommendations = result.issues.filter((issue) => issue.severity === 'warning').length;
  lines.push('', `Summary: ${blocking} blocking issue(s), ${recommendations} recommendation(s).`);

  return lines;
}

function joinOrNone(values: readonly string[]): string {
  return values.length > 0 ? values.join(', ') : 'none';
}

export function formatIdentity(config: ProjectConfig): string {
  const { project, identity } = config;
  const lines = [
    'VAHU project identity',
    '',
    `Name: ${project.name}`,
    `Slug: ${project.slug}`,
    `Type: ${project.type}`,
    `Status: ${identity.status}`,
  ];

  if (project.lifecycle) {
    lines.push(`Lifecycle: ${project.lifecycle}`);
  }
  if (config.repositories.locations.length > 0) {
    lines.push(
      `Repositories: ${config.repositories.locations.map((location) => location.name).join(', ')}`,
    );
  }

  if (identity.status === 'approved') {
    lines.push(`Approved by: ${identity.approvedBy ?? 'unknown'}`);
    lines.push(`Approved at: ${identity.approvedAt ?? 'unknown'}`);
  } else {
    lines.push('Next: run `vahu identity approve --by "Your Name"` once the identity is correct.');
  }

  return lines.join('\n');
}

export function formatChangePreview(paths: string[], exists: boolean): string {
  const heading = exists ? 'Change preview' : 'New configuration';
  if (paths.length === 0) {
    return `${heading}\n\nNo changes.`;
  }

  const shown = paths.slice(0, 12).map((path) => `  ${path}`);
  const remainder = paths.length - shown.length;
  if (remainder > 0) {
    shown.push(`  ...and ${remainder} more`);
  }

  return [`${heading} (${paths.length} field(s))`, '', ...shown].join('\n');
}

function statusLabel(status: DoctorReport['checks'][number]['status']): string {
  switch (status) {
    case 'pass':
      return 'PASS';
    case 'warning':
      return 'WARN';
    case 'fail':
      return 'FAIL';
    default:
      return 'UNKNOWN';
  }
}
