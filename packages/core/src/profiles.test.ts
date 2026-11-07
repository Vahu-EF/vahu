import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseTechnologyProfile, type TechnologyProfile } from '@vahu-ef/schemas';
import { buildProjectConfig } from './onboarding.js';
import {
  evaluateProfileSelection,
  loadProfileCatalog,
  selectProfiles,
  validateProfileCatalog,
} from './profiles.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function profile(overrides: Record<string, unknown> = {}): TechnologyProfile {
  const parsed = parseTechnologyProfile({
    schemaVersion: '1.0.0',
    id: 'PROFILE-NODE-BACKEND',
    name: 'Node.js backend',
    description: 'Server-side TypeScript.',
    version: '0.1.0',
    category: 'backend',
    technology: 'node',
    supportedVersions: ['>=22'],
    projectTypes: ['all'],
    ...overrides,
  });

  if (!parsed.ok) {
    throw new Error(`Fixture invalid: ${parsed.issues.map((issue) => issue.path).join(', ')}`);
  }
  return parsed.data;
}

function project(technology: Record<string, string[]>) {
  const config = buildProjectConfig({
    name: 'Profile Test',
    slug: 'profile-test',
    description: 'A project used in profile tests.',
    purpose: 'Exercise profiles.',
    targetUsers: ['developers'],
    type: 'backend-service',
    languages: ['en'],
    scope: 'Tests',
    constraints: [],
    nonGoals: [],
    repositories: [],
  });

  return { ...config, technology: { ...config.technology, ...technology } };
}

describe('profile catalog validation', () => {
  it('accepts independent profiles', () => {
    expect(validateProfileCatalog([profile()])).toEqual([]);
  });

  it('reports a duplicate identifier', () => {
    const issues = validateProfileCatalog([profile(), profile()]);

    expect(issues.some((issue) => issue.code === 'PROFILE_DUPLICATE_ID')).toBe(true);
  });

  it('reports an unknown prerequisite', () => {
    const issues = validateProfileCatalog([profile({ prerequisites: ['PROFILE-MISSING'] })]);

    expect(issues.some((issue) => issue.code === 'PROFILE_UNKNOWN_PREREQUISITE')).toBe(true);
  });

  it('reports a prerequisite cycle', () => {
    const issues = validateProfileCatalog([
      profile({ id: 'PROFILE-A', prerequisites: ['PROFILE-B'] }),
      profile({ id: 'PROFILE-B', prerequisites: ['PROFILE-A'] }),
    ]);

    expect(issues.some((issue) => issue.code === 'PROFILE_PREREQUISITE_CYCLE')).toBe(true);
  });

  it('loads a directory and reports a malformed file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vahu-profiles-'));
    tempDirectories.push(directory);
    await writeFile(join(directory, 'node.json'), JSON.stringify(profile()), 'utf8');
    await writeFile(join(directory, 'broken.json'), '{', 'utf8');

    const catalog = await loadProfileCatalog(directory);

    expect(catalog.profiles).toHaveLength(1);
    expect(catalog.ok).toBe(false);
    expect(catalog.issues[0]?.code).toBe('PROFILE_INVALID_JSON');
  });
});

describe('profile selection', () => {
  it('selects only profiles matching the project technology and type', () => {
    const node = profile();
    const react = profile({
      id: 'PROFILE-REACT',
      technology: 'react',
      category: 'frontend',
      projectTypes: ['web-application'],
    });

    const selected = selectProfiles([node, react], project({ backend: ['node'] }));

    expect(selected.map((item) => item.id)).toEqual(['PROFILE-NODE-BACKEND']);
  });

  it('reports a conflict between selected profiles', () => {
    const node = profile({ id: 'PROFILE-NODE', technology: 'node' });
    const deno = profile({
      id: 'PROFILE-DENO',
      technology: 'deno',
      compatibility: { conflictsWith: ['PROFILE-NODE'] },
    });

    const result = evaluateProfileSelection([node, deno], project({ backend: ['node', 'deno'] }));

    expect(result.issues.some((issue) => issue.code === 'PROFILE_CONFLICT')).toBe(true);
  });

  it('reports a prerequisite that the project does not select', () => {
    const node = profile({ prerequisites: ['PROFILE-TYPESCRIPT'] });
    const typescript = profile({ id: 'PROFILE-TYPESCRIPT', technology: 'typescript' });

    const result = evaluateProfileSelection([node, typescript], project({ backend: ['node'] }));

    expect(result.issues.some((issue) => issue.code === 'PROFILE_PREREQUISITE_NOT_SELECTED')).toBe(
      true,
    );
  });

  it('reports technology without a covering profile', () => {
    const result = evaluateProfileSelection([], project({ backend: ['node'] }));

    expect(result.issues[0]?.code).toBe('TECHNOLOGY_PROFILE_UNKNOWN');
  });
});
