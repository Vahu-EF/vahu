import type { ProjectConfig } from '@vahu-ef/schemas';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
  severity: IssueSeverity;
}

export interface ReadinessAssessment {
  status: 'ready' | 'incomplete' | 'blocked';
  blocking: ValidationIssue[];
  recommendations: ValidationIssue[];
}

export function isUiProject(config: ProjectConfig): boolean {
  return (
    config.project.type === 'web-application' ||
    config.project.type === 'mobile-application' ||
    config.project.type === 'desktop-application' ||
    config.technology.frontend.length > 0 ||
    config.technology.mobile.length > 0
  );
}

export function assessReadiness(config: ProjectConfig): ReadinessAssessment {
  const issues: ValidationIssue[] = [];

  if (config.identity.status !== 'approved') {
    issues.push({
      code: 'IDENTITY_NOT_APPROVED',
      path: 'identity.status',
      message: 'Project Identity must be approved before normal development begins.',
      severity: 'error',
    });
  }

  const uiProject = isUiProject(config);
  if (uiProject && config.designSystem.status !== 'approved') {
    issues.push({
      code: 'DESIGN_SYSTEM_NOT_APPROVED',
      path: 'designSystem.status',
      message: 'A UI project needs an approved, usable design system.',
      severity: 'error',
    });
  }

  if (
    uiProject &&
    config.designSystem.status === 'approved' &&
    config.designSystem.source === 'none'
  ) {
    issues.push({
      code: 'DESIGN_SYSTEM_SOURCE_MISSING',
      path: 'designSystem.source',
      message: 'An approved design system needs an existing or generated source.',
      severity: 'error',
    });
  }

  if (uiProject && config.designSystem.status === 'approved' && !config.designSystem.path) {
    issues.push({
      code: 'DESIGN_SYSTEM_PATH_MISSING',
      path: 'designSystem.path',
      message:
        'Record the design-system location so implementations can reference one source of truth.',
      severity: 'warning',
    });
  }

  if (config.brand.status === 'pending') {
    issues.push({
      code: 'BRAND_PENDING',
      path: 'brand.status',
      message:
        'Brand assets are pending; this is allowed when the project has no public-facing brand.',
      severity: 'warning',
    });
  }

  const selectedTechnologies = Object.values(config.technology).flat();
  if (selectedTechnologies.length === 0) {
    issues.push({
      code: 'TECHNOLOGY_NOT_SELECTED',
      path: 'technology',
      message: 'No technology profile has been selected yet.',
      severity: 'warning',
    });
  }

  if (
    (config.repositories.strategy === 'multi-repository' ||
      config.repositories.strategy === 'hybrid') &&
    !config.repositories.notes
  ) {
    issues.push({
      code: 'REPOSITORY_STRATEGY_UNDOCUMENTED',
      path: 'repositories.notes',
      message:
        'Multi-repository and hybrid strategies should document their repository boundaries.',
      severity: 'warning',
    });
  }

  if (config.readiness.status === 'ready' && issues.some((issue) => issue.severity === 'error')) {
    issues.push({
      code: 'READINESS_STALE',
      path: 'readiness.status',
      message: 'Readiness is marked ready, but blocking configuration issues remain.',
      severity: 'warning',
    });
  }

  if (
    config.readiness.status === 'blocked' &&
    !issues.some((issue) => issue.severity === 'error')
  ) {
    issues.push({
      code: 'READINESS_BLOCKED_WITHOUT_ERROR',
      path: 'readiness.status',
      message: 'Readiness is marked blocked, but no blocking configuration issue was found.',
      severity: 'warning',
    });
  }

  const blocking = issues.filter((issue) => issue.severity === 'error');
  const recommendations = issues.filter((issue) => issue.severity === 'warning');

  return {
    status: blocking.length > 0 ? 'blocked' : recommendations.length > 0 ? 'incomplete' : 'ready',
    blocking,
    recommendations,
  };
}
