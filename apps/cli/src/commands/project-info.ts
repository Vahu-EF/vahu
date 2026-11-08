import type { Command } from 'commander';
import {
  assessReadiness,
  changedConfigPaths,
  loadProjectConfig,
  mergeIdentity,
  PROJECT_LIFECYCLES,
  PROJECT_TYPES,
  saveProjectConfig,
  validateAnswers,
  validateProject,
  type IdentityAnswers,
} from '@vahu-ef/core';
import type { ProjectConfig, ProjectLifecycle, ProjectType } from '@vahu-ef/schemas';
import { splitList } from '../core/inputs.js';

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

interface ConfigureOptions extends ProjectOptions {
  name?: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  clearLongDescription?: boolean;
  purpose?: string;
  users?: string;
  type?: string;
  lifecycle?: string;
  clearLifecycle?: boolean;
  languages?: string;
  scope?: string;
  constraints?: string;
  nonGoals?: string;
  write?: boolean;
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

  project
    .command('configure')
    .description('Preview or update project identity fields.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--name <name>', 'Formal project name.')
    .option('--slug <slug>', 'Project slug.')
    .option('--description <text>', 'Short project description.')
    .option('--long-description <text>', 'Longer project description.')
    .option('--clear-long-description', 'Remove the optional long description.')
    .option('--purpose <text>', 'What the project exists to do.')
    .option('--users <list>', 'Comma-separated target users.')
    .option('--type <type>', `Project type: ${PROJECT_TYPES.join(', ')}.`)
    .option('--lifecycle <lifecycle>', `Project lifecycle: ${PROJECT_LIFECYCLES.join(', ')}.`)
    .option('--clear-lifecycle', 'Remove the optional lifecycle value.')
    .option('--languages <list>', 'Comma-separated documentation languages.')
    .option('--scope <text>', 'Scope of the first release.')
    .option('--constraints <list>', 'Comma-separated constraints; an empty value clears them.')
    .option('--non-goals <list>', 'Comma-separated non-goals; an empty value clears them.')
    .option('--write', 'Write the change; without this flag, only show the preview.')
    .option('--json', 'Print a versioned machine-readable report.')
    .action((options: ConfigureOptions) => runProjectConfigure(options));
}

async function runProjectConfigure(options: ConfigureOptions): Promise<void> {
  const target = options.path;
  const loaded = await loadProjectConfig(target);
  if (loaded.status !== 'valid') {
    fail(`No valid project configuration at ${loaded.configPath} (${loaded.status}).`);
    if (loaded.status === 'invalid-schema') {
      for (const issue of loaded.issues) {
        process.stderr.write(`- ${issue.path}: ${issue.message}\n`);
      }
    }
    return;
  }

  if (options.clearLongDescription && options.longDescription !== undefined) {
    fail('Use either --long-description or --clear-long-description, not both.');
    return;
  }
  if (options.clearLifecycle && options.lifecycle !== undefined) {
    fail('Use either --lifecycle or --clear-lifecycle, not both.');
    return;
  }

  const lifecycle = options.lifecycle;
  if (lifecycle !== undefined && !(PROJECT_LIFECYCLES as readonly string[]).includes(lifecycle)) {
    fail(`Unknown lifecycle "${lifecycle}". Use: ${PROJECT_LIFECYCLES.join(', ')}.`);
    return;
  }
  const type = options.type;
  if (type !== undefined && !(PROJECT_TYPES as readonly string[]).includes(type)) {
    fail(`Unknown project type "${type}". Use: ${PROJECT_TYPES.join(', ')}.`);
    return;
  }

  const current = loaded.config;
  const answers: IdentityAnswers = {
    name: options.name ?? current.project.name,
    slug: options.slug ?? current.project.slug,
    description: options.description ?? current.project.description,
    ...(options.clearLongDescription
      ? {}
      : options.longDescription !== undefined
        ? { longDescription: options.longDescription }
        : current.project.longDescription !== undefined
          ? { longDescription: current.project.longDescription }
          : {}),
    purpose: options.purpose ?? current.project.purpose,
    targetUsers:
      options.users === undefined ? current.project.targetUsers : splitList(options.users),
    type: (type ?? current.project.type) as ProjectType,
    ...(options.clearLifecycle
      ? {}
      : lifecycle !== undefined
        ? { lifecycle: lifecycle as ProjectLifecycle }
        : current.project.lifecycle !== undefined
          ? { lifecycle: current.project.lifecycle }
          : {}),
    languages:
      options.languages === undefined ? current.project.languages : splitList(options.languages),
    scope: options.scope ?? current.project.scope,
    constraints:
      options.constraints === undefined
        ? current.project.constraints
        : splitList(options.constraints),
    nonGoals:
      options.nonGoals === undefined ? current.project.nonGoals : splitList(options.nonGoals),
    repositories: current.repositories.locations,
  };
  const issues = validateAnswers(answers);
  if (issues.length > 0) {
    fail('The project configuration is not valid.');
    for (const issue of issues) {
      process.stderr.write(`- ${issue.path}: ${issue.message}\n`);
    }
    return;
  }

  const candidate = mergeIdentity(current, answers);
  const identityChanged = changedConfigPaths(current, candidate).some((path) =>
    path.startsWith('project.'),
  );
  const next = identityChanged ? candidate : current;
  const changed = changedConfigPaths(current, next);
  const changes = changed.map((path) => ({
    path,
    before: valueAtPath(current, path) ?? null,
    after: valueAtPath(next, path) ?? null,
  }));
  let written = false;

  if (options.write === true && changed.length > 0) {
    const saved = await saveProjectConfig(target, next, { overwrite: true });
    if (!saved.ok) {
      fail(`The configuration was not written (${saved.reason}).`);
      return;
    }
    written = true;
  }

  const report = {
    contractVersion: REPORT_VERSION,
    reportType: 'project-configuration-change',
    ok: true,
    path: loaded.configPath,
    changed: changed.length > 0,
    changedPaths: changed,
    changes,
    written,
    identityApprovalRequired: identityChanged,
  };
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  const changeLines = changes.map(
    ({ path, before, after }) => `  ${path}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`,
  );
  process.stdout.write(
    `Project configuration preview\nChanged: ${report.changed ? 'yes' : 'no'}\n${changeLines.length > 0 ? `Changes:\n${changeLines.join('\n')}\n` : ''}Written: ${written ? 'yes' : 'no'}\n${identityChanged ? 'Identity approval: required after writing\n' : ''}${written || changed.length === 0 ? '' : 'Re-run with --write to save this change.\n'}`,
  );
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

function valueAtPath(config: ProjectConfig, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    return (value as Record<string, unknown>)[segment];
  }, config);
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

function fail(message: string): void {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
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
