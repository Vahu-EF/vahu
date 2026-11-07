import type { ProjectConfig } from '@vahu-ef/schemas';
import { loadProjectConfig } from './config.js';
import { assessReadiness, type ValidationIssue } from './readiness.js';

export interface ValidationResult {
  ok: boolean;
  configPath: string;
  config?: ProjectConfig;
  issues: ValidationIssue[];
}

export function validateProjectConfig(config: ProjectConfig): ValidationIssue[] {
  const assessment = assessReadiness(config);
  return [...assessment.blocking, ...assessment.recommendations];
}

export async function validateProject(cwd: string): Promise<ValidationResult> {
  const loaded = await loadProjectConfig(cwd);

  if (loaded.status === 'missing') {
    return {
      ok: false,
      configPath: loaded.configPath,
      issues: [
        {
          code: 'CONFIG_MISSING',
          path: '.vahu/project.json',
          message: 'No VAHU project configuration was found.',
          severity: 'error',
        },
      ],
    };
  }

  if (loaded.status === 'unreadable') {
    return {
      ok: false,
      configPath: loaded.configPath,
      issues: [
        {
          code: 'CONFIG_UNREADABLE',
          path: '.vahu/project.json',
          message: `The configuration could not be read: ${loaded.message}`,
          severity: 'error',
        },
      ],
    };
  }

  if (loaded.status === 'invalid-json') {
    return {
      ok: false,
      configPath: loaded.configPath,
      issues: [
        {
          code: 'CONFIG_INVALID_JSON',
          path: '.vahu/project.json',
          message: `The configuration is not valid JSON: ${loaded.message}`,
          severity: 'error',
        },
      ],
    };
  }

  if (loaded.status === 'invalid-schema') {
    return {
      ok: false,
      configPath: loaded.configPath,
      issues: loaded.issues.map((issue) => ({
        code: 'CONFIG_SCHEMA',
        path: issue.path,
        message: issue.message,
        severity: 'error' as const,
      })),
    };
  }

  const issues = validateProjectConfig(loaded.config);
  if (loaded.migratedFrom) {
    issues.push({
      code: 'SCHEMA_1_0_0_NOT_MIGRATED',
      path: '.vahu/project.json',
      message: `This file uses schema ${loaded.migratedFrom} and was read as 1.1.0. Run \`vahu migrate --write\` to update the file.`,
      severity: 'warning',
    });
  }
  return {
    ok: !issues.some((issue) => issue.severity === 'error'),
    configPath: loaded.configPath,
    config: loaded.config,
    issues,
  };
}
