import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { FrameworkIssue } from './issues.js';

export const REQUIRED_WORKSPACE_PATHS = [
  'VAHU.md',
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'tsconfig.base.json',
  'apps/cli',
  'apps/website',
  'packages/core',
  'packages/schemas',
  'packages/framework/technology-profiles',
  'docs',
  'templates',
  'architecture',
  'scripts',
  'tests',
] as const;

const FORBIDDEN_DEPENDENCIES = new Map<string, ReadonlySet<string>>([
  ['@vahu-ef/schemas', new Set(['@vahu-ef/core', 'vahu'])],
  ['@vahu-ef/core', new Set(['vahu'])],
  ['@vahu-ef/website', new Set(['@vahu-ef/core', 'vahu'])],
]);

const PACKAGE_PARENTS = ['apps', 'packages'] as const;

export interface WorkspaceReport {
  ok: boolean;
  packages: number;
  issues: FrameworkIssue[];
}

interface Manifest {
  name: string;
  dependencies: Record<string, string>;
}

/**
 * Verifies the required repository structure, the single technology-profile
 * location, package name uniqueness, forbidden dependency edges, and an
 * acyclic workspace dependency graph.
 */
export async function validateWorkspace(root: string): Promise<WorkspaceReport> {
  const issues: FrameworkIssue[] = [];

  for (const requiredPath of REQUIRED_WORKSPACE_PATHS) {
    if (!(await pathExists(join(root, requiredPath)))) {
      issues.push({
        code: 'WORKSPACE_MISSING_PATH',
        path: requiredPath,
        message: `Missing required path: ${requiredPath}.`,
      });
    }
  }

  if (await pathExists(join(root, 'profiles'))) {
    issues.push({
      code: 'WORKSPACE_DUPLICATE_PROFILES',
      path: 'profiles',
      message:
        'Root profiles/ must not exist; technology profiles belong in packages/framework/technology-profiles/.',
    });
  }

  const manifests = new Map<string, Manifest>();
  const manifestPaths = new Map<string, string>();

  for (const file of await packageManifests(root)) {
    const path = relative(root, file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      issues.push({
        code: 'WORKSPACE_INVALID_MANIFEST',
        path,
        message: 'The package manifest is not valid JSON.',
      });
      continue;
    }

    const name = (parsed as { name?: unknown }).name;
    if (typeof name !== 'string' || name.length === 0) {
      issues.push({
        code: 'WORKSPACE_MISSING_NAME',
        path,
        message: 'The package manifest has no name.',
      });
      continue;
    }

    if (manifests.has(name)) {
      issues.push({
        code: 'WORKSPACE_DUPLICATE_NAME',
        path,
        message: `Duplicate package name ${name}; already used by ${manifestPaths.get(name) ?? 'another package'}.`,
      });
      continue;
    }

    const dependencies = {
      ...readDependencyMap(parsed, 'dependencies'),
      ...readDependencyMap(parsed, 'devDependencies'),
    };
    manifests.set(name, { name, dependencies });
    manifestPaths.set(name, path);

    for (const dependency of Object.keys(dependencies)) {
      if (FORBIDDEN_DEPENDENCIES.get(name)?.has(dependency)) {
        issues.push({
          code: 'WORKSPACE_FORBIDDEN_DEPENDENCY',
          path,
          message: `Forbidden dependency: ${name} -> ${dependency}.`,
        });
      }
    }
  }

  issues.push(...cycleIssues(manifests));

  return { ok: issues.length === 0, packages: manifests.size, issues };
}

function readDependencyMap(manifest: unknown, key: string): Record<string, string> {
  const value = (manifest as Record<string, unknown>)[key];
  if (!value || typeof value !== 'object') {
    return {};
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return Object.fromEntries(entries);
}

async function packageManifests(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const parent of PACKAGE_PARENTS) {
    let entries;
    try {
      entries = await readdir(join(root, parent), { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifest = join(root, parent, entry.name, 'package.json');
      if (await pathExists(manifest)) {
        files.push(manifest);
      }
    }
  }
  return files.sort();
}

function cycleIssues(manifests: Map<string, Manifest>): FrameworkIssue[] {
  const issues: FrameworkIssue[] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const graph = new Map<string, string[]>();

  for (const [name, manifest] of manifests) {
    graph.set(
      name,
      Object.keys(manifest.dependencies).filter((dependency) => manifests.has(dependency)),
    );
  }

  const visit = (name: string): void => {
    const current = state.get(name);
    if (current === 'done') {
      return;
    }
    if (current === 'visiting') {
      const start = stack.indexOf(name);
      const chain = [...stack.slice(start === -1 ? 0 : start), name];
      issues.push({
        code: 'WORKSPACE_DEPENDENCY_CYCLE',
        path: name,
        message: `Workspace dependency cycle: ${chain.join(' -> ')}.`,
      });
      return;
    }

    state.set(name, 'visiting');
    stack.push(name);
    for (const dependency of graph.get(name) ?? []) {
      visit(dependency);
    }
    stack.pop();
    state.set(name, 'done');
  };

  for (const name of graph.keys()) {
    visit(name);
  }

  return issues;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
