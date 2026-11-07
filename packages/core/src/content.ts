import { readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import {
  CONTENT_ID_PATTERN,
  contentStatusSchema,
  contentTypeSchema,
  lifecycleStageSchema,
  projectTypeSchema,
  standardStatusToContentStatus,
  type ContentEnforcement,
  type ContentItem,
  type ContentOrigin,
  type ContentScope,
  type ContentStatus,
  type ContentType,
  type LifecycleStage,
  type ProjectType,
} from '@vahu-ef/schemas';
import type { FrameworkIssue } from './issues.js';
import {
  firstHeading,
  firstParagraphAfterTitle,
  firstParagraphUnder,
  markdownFiles,
  readHeaderMetadata,
  ruleBlocks,
  ruleFields,
  unresolvedRelativeLinks,
} from './markdown.js';

export const REQUIRED_CONTENT_METADATA = [
  'Content type',
  'Lifecycle stages',
  'Project types',
  'Depends on',
  'Tags',
] as const;

const CONTENT_TYPES = contentTypeSchema.options as readonly string[];
const CONTENT_STATUSES = contentStatusSchema.options as readonly string[];
const LIFECYCLE_STAGES = lifecycleStageSchema.options as readonly string[];
const PROJECT_TYPES = projectTypeSchema.options as readonly string[];
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export interface ContentDiscovery {
  items: ContentItem[];
  issues: FrameworkIssue[];
}

export interface ContentReport extends ContentDiscovery {
  ok: boolean;
}

/**
 * Walks the framework content root and normalizes every content page into a
 * metadata item. `README.md` files are indexes and `*_TEMPLATE.md` files are
 * authoring templates, so neither is a content item.
 */
export async function discoverContent(root: string): Promise<ContentDiscovery> {
  const issues: FrameworkIssue[] = [];
  const items: ContentItem[] = [];
  const files = (await markdownFiles(join(root, 'packages/framework'))).sort();

  for (const file of files) {
    const name = basename(file);
    if (name === 'README.md' || name.endsWith('_TEMPLATE.md')) {
      continue;
    }

    const content = await readFile(file, 'utf8');
    const path = relative(root, file);
    const metadata = readHeaderMetadata(content);
    const add = (code: string, message: string): void => {
      issues.push({ code, path, message });
    };

    const standardId = metadata.get('Standard ID');
    const id = standardId ?? metadata.get('Content ID');

    if (!id) {
      add('CONTENT_METADATA', 'A content page declares a Standard ID or a Content ID.');
      continue;
    }

    if (!CONTENT_ID_PATTERN.test(id)) {
      add('CONTENT_ID', `Content identifier "${id}" is not an upper-case hyphenated identifier.`);
    }

    for (const field of REQUIRED_CONTENT_METADATA) {
      if (!metadata.get(field)) {
        add('CONTENT_METADATA', `Missing or empty content metadata field: ${field}.`);
      }
    }

    const heading = firstHeading(content);
    const title = heading ? stripIdPrefix(heading, id) : null;
    if (!title) {
      add('CONTENT_TITLE', 'A content page needs a level-one title.');
    }

    const description =
      firstParagraphUnder(content, 'Purpose') ?? firstParagraphAfterTitle(content) ?? '';
    if (description.length === 0) {
      add('CONTENT_DESCRIPTION', 'A content page needs a description or a Purpose paragraph.');
    }

    const contentType = readContentType(metadata.get('Content type'), add);
    const status = readStatus(standardId, metadata.get('Status'), add);

    const version = metadata.get('Version') ?? '';
    if (!SEMVER.test(version)) {
      add('CONTENT_VERSION', `Version "${version}" is not a semantic version.`);
    }

    const owner = metadata.get('Owner') ?? '';
    if (owner.length === 0) {
      add('CONTENT_METADATA', 'Missing or empty content metadata field: Owner.');
    }

    const projectTypes: ContentScope[] = [];
    for (const value of splitList(metadata.get('Project types'))) {
      if (value === 'all' || PROJECT_TYPES.includes(value)) {
        projectTypes.push(value as ContentScope);
      } else {
        add('CONTENT_PROJECT_TYPE', `Unknown project type "${value}".`);
      }
    }

    const lifecycleStages: LifecycleStage[] = [];
    for (const value of splitList(metadata.get('Lifecycle stages'))) {
      if (LIFECYCLE_STAGES.includes(value)) {
        lifecycleStages.push(value as LifecycleStage);
      } else {
        add('CONTENT_STAGE', `Unknown lifecycle stage "${value}".`);
      }
    }

    const dependencies: string[] = [];
    for (const value of splitList(metadata.get('Depends on'))) {
      if (CONTENT_ID_PATTERN.test(value)) {
        dependencies.push(value);
      } else {
        add('CONTENT_DEPENDENCY', `Dependency "${value}" is not a content identifier.`);
      }
    }

    if (status === 'deprecated' && !metadata.get('Deprecation')) {
      add(
        'CONTENT_DEPRECATION',
        'Deprecated content must name its replacement or removal date in a Deprecation field.',
      );
    }

    if (!standardId) {
      for (const target of unresolvedRelativeLinks(file, content)) {
        add('LINK_UNRESOLVED', `Relative link does not resolve: ${target}`);
      }
    }

    if (
      !contentType ||
      !status ||
      !title ||
      description.length === 0 ||
      projectTypes.length === 0
    ) {
      continue;
    }
    if (lifecycleStages.length === 0) {
      add('CONTENT_METADATA', 'Lifecycle stages must list at least one stage.');
      continue;
    }

    items.push({
      id,
      title,
      description,
      contentType,
      origin: originFor(contentType),
      status,
      version,
      owner,
      path,
      enforcement: enforcementFor(contentType, content),
      projectTypes,
      lifecycleStages,
      dependencies,
      tags: splitList(metadata.get('Tags')),
    });
  }

  issues.push(...duplicateIdIssues(items));
  issues.push(...unknownDependencyIssues(items));
  issues.push(...cycleIssues(items));

  return { items, issues };
}

export async function validateContentModel(root: string): Promise<ContentReport> {
  const { items, issues } = await discoverContent(root);
  return { ok: issues.length === 0, items, issues };
}

function readContentType(
  value: string | undefined,
  add: (code: string, message: string) => void,
): ContentType | null {
  if (!value) {
    return null;
  }
  if (CONTENT_TYPES.includes(value)) {
    return value as ContentType;
  }
  add('CONTENT_TYPE', `Unknown content type "${value}". Use one of: ${CONTENT_TYPES.join(', ')}.`);
  return null;
}

function readStatus(
  standardId: string | undefined,
  value: string | undefined,
  add: (code: string, message: string) => void,
): ContentStatus | null {
  if (!value) {
    return null;
  }
  if (standardId) {
    const mapped = standardStatusToContentStatus(value);
    if (mapped) {
      return mapped;
    }
    add('CONTENT_STATUS', `Unknown standard status "${value}".`);
    return null;
  }
  if (CONTENT_STATUSES.includes(value)) {
    return value as ContentStatus;
  }
  add(
    'CONTENT_STATUS',
    `Unknown content status "${value}". Use one of: ${CONTENT_STATUSES.join(', ')}.`,
  );
  return null;
}

function originFor(contentType: ContentType): ContentOrigin {
  switch (contentType) {
    case 'practice':
      return 'practice';
    case 'profile':
      return 'profile';
    case 'adapter':
      return 'adapter';
    default:
      return 'core';
  }
}

function enforcementFor(contentType: ContentType, content: string): ContentEnforcement {
  if (contentType !== 'standard') {
    return contentType === 'guide' || contentType === 'template' ? 'optional' : 'recommended';
  }

  const levels = ruleBlocks(content).map((rule) => ruleFields(rule).get('Level') ?? '');
  if (levels.some((level) => level === 'MUST' || level === 'MUST NOT')) {
    return 'mandatory';
  }
  if (levels.some((level) => level === 'SHOULD' || level === 'SHOULD NOT')) {
    return 'recommended';
  }
  return 'optional';
}

function stripIdPrefix(heading: string, id: string): string {
  const prefix = `${id} — `;
  return heading.startsWith(prefix) ? heading.slice(prefix.length).trim() : heading;
}

function splitList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && !/^none$/i.test(entry));
}

function duplicateIdIssues(items: ContentItem[]): FrameworkIssue[] {
  const seen = new Map<string, string>();
  const issues: FrameworkIssue[] = [];
  for (const item of items) {
    const first = seen.get(item.id);
    if (first) {
      issues.push({
        code: 'CONTENT_ID_DUPLICATE',
        path: item.path,
        message: `Content identifier ${item.id} is already used by ${first}.`,
      });
      continue;
    }
    seen.set(item.id, item.path);
  }
  return issues;
}

function unknownDependencyIssues(items: ContentItem[]): FrameworkIssue[] {
  const ids = new Set(items.map((item) => item.id));
  const issues: FrameworkIssue[] = [];
  for (const item of items) {
    for (const dependency of item.dependencies) {
      if (!ids.has(dependency)) {
        issues.push({
          code: 'CONTENT_DEPENDENCY_UNKNOWN',
          path: item.path,
          message: `${item.id} depends on ${dependency}, which is not a discovered content item.`,
        });
      }
    }
  }
  return issues;
}

function cycleIssues(items: ContentItem[]): FrameworkIssue[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const issues: FrameworkIssue[] = [];

  const visit = (id: string): void => {
    const current = state.get(id);
    if (current === 'done') {
      return;
    }
    if (current === 'visiting') {
      const start = stack.indexOf(id);
      const chain = [...stack.slice(start === -1 ? 0 : start), id];
      const owner = byId.get(id);
      issues.push({
        code: 'CONTENT_DEPENDENCY_CYCLE',
        path: owner?.path ?? id,
        message: `Content dependency cycle: ${chain.join(' -> ')}.`,
      });
      return;
    }

    state.set(id, 'visiting');
    stack.push(id);
    for (const dependency of byId.get(id)?.dependencies ?? []) {
      if (byId.has(dependency)) {
        visit(dependency);
      }
    }
    stack.pop();
    state.set(id, 'done');
  };

  for (const item of items) {
    visit(item.id);
  }

  return issues;
}

export const PRECEDENCE = {
  mandatory: 0,
  projectOverride: 1,
  profile: 2,
  practice: 3,
  recommended: 4,
  optional: 5,
} as const;

export interface ContentOverride {
  id: string;
  enabled: boolean;
}

export interface CompositionInput {
  projectType: ProjectType;
  items: ContentItem[];
  stages?: LifecycleStage[];
  overrides?: ContentOverride[];
}

export interface ComposedItem extends ContentItem {
  precedence: number;
}

export interface CompositionResult {
  items: ComposedItem[];
  issues: FrameworkIssue[];
}

/**
 * Resolves the effective content set for a project.
 *
 * Precedence, strongest first: mandatory items (which cannot be disabled), an
 * explicit project override, a selected profile, a practice, then core defaults
 * by enforcement level. The result is deterministic: precedence, then ID.
 */
export function composeContent(input: CompositionInput): CompositionResult {
  const issues: FrameworkIssue[] = [];
  const overrides = new Map((input.overrides ?? []).map((override) => [override.id, override]));
  const known = new Set(input.items.map((item) => item.id));

  for (const id of overrides.keys()) {
    if (!known.has(id)) {
      issues.push({
        code: 'COMPOSITION_UNKNOWN_ID',
        path: id,
        message: `No content item matches the override for ${id}.`,
      });
    }
  }

  const composed: ComposedItem[] = [];
  for (const item of input.items) {
    const override = overrides.get(item.id);

    if (override && !override.enabled) {
      if (item.enforcement === 'mandatory') {
        issues.push({
          code: 'COMPOSITION_MANDATORY_OVERRIDE',
          path: item.path,
          message: `${item.id} is mandatory and cannot be disabled by a project override.`,
        });
        composed.push({ ...item, precedence: PRECEDENCE.mandatory });
      }
      continue;
    }

    if (override && override.enabled) {
      composed.push({ ...item, precedence: PRECEDENCE.projectOverride });
      continue;
    }

    if (appliesTo(item, input.projectType, input.stages)) {
      composed.push({ ...item, precedence: precedenceFor(item) });
    }
  }

  composed.sort(
    (left, right) => left.precedence - right.precedence || left.id.localeCompare(right.id),
  );
  return { items: composed, issues };
}

function appliesTo(
  item: ContentItem,
  projectType: ProjectType,
  stages: readonly LifecycleStage[] | undefined,
): boolean {
  const typeMatches = item.projectTypes.includes('all') || item.projectTypes.includes(projectType);
  if (!typeMatches) {
    return false;
  }
  if (!stages || stages.length === 0) {
    return true;
  }
  return item.lifecycleStages.some((stage) => stages.includes(stage));
}

function precedenceFor(item: ContentItem): number {
  if (item.enforcement === 'mandatory') {
    return PRECEDENCE.mandatory;
  }
  if (item.origin === 'profile') {
    return PRECEDENCE.profile;
  }
  if (item.origin === 'practice') {
    return PRECEDENCE.practice;
  }
  return item.enforcement === 'recommended' ? PRECEDENCE.recommended : PRECEDENCE.optional;
}
