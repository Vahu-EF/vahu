import type { DoctorReport, ValidationResult } from '@vahu-ef/core';

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
