import type { DoctorReport, ValidationResult } from '@vahu-ef/core';
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
  const lines = ['VAHU validation', `Configuration: ${result.configPath}`, ''];

  if (result.issues.length === 0) {
    lines.push('PASS: The project configuration is valid.');
  } else {
    for (const issue of result.issues) {
      lines.push(`${issue.severity === 'error' ? 'ERROR' : 'WARN'}: ${issue.path}`);
      lines.push(`  ${issue.message} (${issue.code})`);
    }
  }

  const blocking = result.issues.filter((issue) => issue.severity === 'error').length;
  const recommendations = result.issues.filter((issue) => issue.severity === 'warning').length;
  lines.push('', `Summary: ${blocking} blocking issue(s), ${recommendations} recommendation(s).`);

  return lines.join('\n');
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
