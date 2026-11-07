import type { Command } from 'commander';
import { assessReadiness, validateProject } from '@vahu-ef/core';
import type { ProjectConfig } from '@vahu-ef/schemas';

const REPORT_VERSION = '1.0.0';

interface ProjectSummary {
  name: string;
  slug: string;
  type: string;
  lifecycle: string | null;
  description: string;
  purpose: string;
  languages: string[];
  identityStatus: string;
  brandStatus: string;
  designSystemStatus: string;
  technology: ProjectConfig['technology'];
}

interface ProjectReport {
  contractVersion: string;
  reportType: 'project-report';
  view: 'inspect' | 'status';
  ok: boolean;
  configPath: string;
  project: ProjectSummary | null;
  readiness: { status: string; blockingIssues: number; recommendations: number } | null;
  issues: Array<{ code: string; path: string; severity: string; message: string }>;
}

interface ProjectOptions {
  path: string;
  json?: boolean;
}

export function registerProjectInfoCommands(program: Command): void {
  const project = program
    .command('project')
    .description('Inspect project configuration and status.');

  project
    .command('inspect')
    .description('Inspect project identity, selected technologies, and readiness. Read-only.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a versioned machine-readable report.')
    .action((options: ProjectOptions) => runProjectReport(options, 'inspect'));

  project
    .command('status')
    .description('Show computed project readiness and validation issues. Read-only.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a versioned machine-readable report.')
    .action((options: ProjectOptions) => runProjectReport(options, 'status'));
}

async function runProjectReport(
  options: ProjectOptions,
  view: 'inspect' | 'status',
): Promise<void> {
  const validation = await validateProject(options.path);
  const config = validation.config;
  const readiness = config ? assessReadiness(config) : null;
  const report: ProjectReport = {
    contractVersion: REPORT_VERSION,
    reportType: 'project-report',
    view,
    ok: validation.ok,
    configPath: validation.configPath,
    project: config ? projectSummary(config) : null,
    readiness: readiness
      ? {
          status: readiness.status,
          blockingIssues: readiness.blocking.length,
          recommendations: readiness.recommendations.length,
        }
      : null,
    issues: validation.issues.map(({ code, path, severity, message }) => ({
      code,
      path,
      severity,
      message,
    })),
  };

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatProjectReport(report, view)}\n`);
  }

  if (!validation.ok) {
    process.exitCode = 1;
  }
}

function projectSummary(config: ProjectConfig) {
  return {
    name: config.project.name,
    slug: config.project.slug,
    type: config.project.type,
    lifecycle: config.project.lifecycle ?? null,
    description: config.project.description,
    purpose: config.project.purpose,
    languages: config.project.languages,
    identityStatus: config.identity.status,
    brandStatus: config.brand.status,
    designSystemStatus: config.designSystem.status,
    technology: config.technology,
  };
}

function formatProjectReport(report: ProjectReport, view: 'inspect' | 'status'): string {
  const lines = [
    view === 'inspect' ? 'VAHU project inspection' : 'VAHU project status',
    `Configuration: ${report.configPath}`,
  ];

  if (!report.project) {
    lines.push('Status: unavailable');
  } else {
    lines.push(`Project: ${report.project.name} (${report.project.slug})`);
    if (view === 'inspect') {
      lines.push(`Type: ${report.project.type}`);
      lines.push(`Lifecycle: ${report.project.lifecycle ?? 'not recorded'}`);
      lines.push(`Description: ${report.project.description}`);
      lines.push(`Purpose: ${report.project.purpose}`);
      lines.push(`Languages: ${report.project.languages.join(', ')}`);
      lines.push(
        `Technologies: ${Object.values(report.project.technology).flat().join(', ') || 'none'}`,
      );
    }
    lines.push(`Status: ${report.readiness?.status ?? 'unavailable'}`);
    lines.push(`Identity: ${report.project.identityStatus}`);
    if (view === 'inspect') {
      lines.push(`Brand: ${report.project.brandStatus}`);
      lines.push(`Design system: ${report.project.designSystemStatus}`);
    }
    lines.push(`Blocking issues: ${report.readiness?.blockingIssues ?? 0}`);
    lines.push(`Recommendations: ${report.readiness?.recommendations ?? 0}`);
  }

  if (report.issues.length > 0) {
    lines.push('', 'Issues:');
    for (const issue of report.issues) {
      lines.push(
        `  ${issue.severity.toUpperCase()}: ${issue.path} — ${issue.message} (${issue.code})`,
      );
    }
  } else if (report.ok) {
    lines.push('', 'No validation issues.');
  }
  return lines.join('\n');
}
