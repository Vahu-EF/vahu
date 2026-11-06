import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { loadProjectConfig } from './config.js';
import { validateProject } from './validate.js';

export type DoctorStatus = 'pass' | 'warning' | 'fail';

export interface DoctorCheck {
  name: string;
  status: DoctorStatus;
  detail: string;
  recommendation?: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

export async function runDoctor(cwd: string): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  const majorVersion = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  checks.push({
    name: 'Node.js',
    status: majorVersion >= 22 ? 'pass' : 'fail',
    detail: `Detected Node.js ${process.versions.node}.`,
    ...(majorVersion < 22 ? { recommendation: 'Upgrade to Node.js 22 or newer.' } : {}),
  });

  const pnpm = commandVersion('pnpm');
  checks.push({
    name: 'pnpm',
    status: pnpm ? 'pass' : 'warning',
    detail: pnpm ?? 'pnpm was not found on PATH.',
    ...(pnpm ? {} : { recommendation: 'Install pnpm 10 or newer from https://pnpm.io/.' }),
  });

  const git = commandVersion('git');
  checks.push({
    name: 'Git',
    status: git ? 'pass' : 'warning',
    detail: git ?? 'Git was not found on PATH.',
    ...(git ? {} : { recommendation: 'Install Git before initializing a repository.' }),
  });

  checks.push({
    name: 'Git repository',
    status: existsSync(join(cwd, '.git')) ? 'pass' : 'warning',
    detail: existsSync(join(cwd, '.git'))
      ? 'The current directory is a Git repository.'
      : 'The current directory is not a Git repository.',
    ...(existsSync(join(cwd, '.git'))
      ? {}
      : { recommendation: 'Run git init when this project should be versioned.' }),
  });

  const loaded = await loadProjectConfig(cwd);
  if (loaded.status === 'missing') {
    checks.push({
      name: 'Project configuration',
      status: 'warning',
      detail: 'No .vahu/project.json file was found.',
      recommendation: 'Create .vahu/project.json before using VAHU project workflows.',
    });
  } else if (loaded.status !== 'valid') {
    checks.push({
      name: 'Project configuration',
      status: 'fail',
      detail: 'The project configuration could not be validated.',
      recommendation: 'Run vahu validate for the exact error.',
    });
  } else {
    const result = await validateProject(cwd);
    const errors = result.issues.filter((issue) => issue.severity === 'error').length;
    const warnings = result.issues.filter((issue) => issue.severity === 'warning').length;
    checks.push({
      name: 'Project configuration',
      status: errors > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass',
      detail: `${errors} blocking issue(s), ${warnings} recommendation(s).`,
      ...(errors > 0 ? { recommendation: 'Run vahu validate to resolve blocking issues.' } : {}),
    });
  }

  checks.push({
    name: 'Foundation document',
    status: existsSync(join(cwd, 'VAHU.md')) ? 'pass' : 'warning',
    detail: existsSync(join(cwd, 'VAHU.md'))
      ? 'VAHU.md is present.'
      : 'VAHU.md is not present in this project.',
    ...(existsSync(join(cwd, 'VAHU.md'))
      ? {}
      : { recommendation: 'Keep the foundation document with the project.' }),
  });

  const summary = {
    passed: checks.filter((check) => check.status === 'pass').length,
    warnings: checks.filter((check) => check.status === 'warning').length,
    failed: checks.filter((check) => check.status === 'fail').length,
  };

  return {
    ok: summary.failed === 0,
    checks,
    summary,
  };
}

function commandVersion(command: string): string | null {
  const result = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    return null;
  }

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return output.length > 0 ? (output.split(/\r?\n/)[0] ?? null) : null;
}
