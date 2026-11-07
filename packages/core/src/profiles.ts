import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  parseTechnologyProfile,
  type ProjectConfig,
  type TechnologyProfile,
} from '@vahu-ef/schemas';
import type { FrameworkIssue } from './issues.js';

export interface ProfileCatalog {
  ok: boolean;
  profiles: TechnologyProfile[];
  issues: FrameworkIssue[];
}

/** Loads and validates every profile in a directory. */
export async function loadProfileCatalog(directory: string): Promise<ProfileCatalog> {
  let files: string[];
  try {
    files = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  } catch {
    return {
      ok: false,
      profiles: [],
      issues: [
        {
          code: 'PROFILE_DIRECTORY_MISSING',
          path: directory,
          message: 'The technology-profile directory does not exist.',
        },
      ],
    };
  }

  const profiles: TechnologyProfile[] = [];
  const issues: FrameworkIssue[] = [];

  for (const name of files) {
    let input: unknown;
    try {
      input = JSON.parse(await readFile(join(directory, name), 'utf8'));
    } catch {
      issues.push({
        code: 'PROFILE_INVALID_JSON',
        path: name,
        message: 'The profile is not valid JSON.',
      });
      continue;
    }

    const parsed = parseTechnologyProfile(input);
    if (!parsed.ok) {
      issues.push(
        ...parsed.issues.map((issue) => ({
          code: 'PROFILE_INVALID',
          path: `${name}#${issue.path}`,
          message: issue.message,
        })),
      );
      continue;
    }

    profiles.push(parsed.data);
  }

  issues.push(...validateProfileCatalog(profiles));

  return { ok: issues.length === 0, profiles, issues };
}

/**
 * Checks references between profiles and prerequisite cycles. Profiles are
 * independent: a broken reference is reported, never dropped silently.
 */
export function validateProfileCatalog(profiles: readonly TechnologyProfile[]): FrameworkIssue[] {
  const issues: FrameworkIssue[] = [];
  const byId = new Map<string, TechnologyProfile>();

  for (const profile of profiles) {
    if (byId.has(profile.id)) {
      issues.push({
        code: 'PROFILE_DUPLICATE_ID',
        path: profile.id,
        message: `Duplicate profile identifier ${profile.id}.`,
      });
      continue;
    }
    byId.set(profile.id, profile);
  }

  const known = new Set(byId.keys());

  for (const profile of profiles) {
    checkReferences(
      issues,
      profile.id,
      known,
      profile.prerequisites,
      'PROFILE_UNKNOWN_PREREQUISITE',
    );
    checkReferences(issues, profile.id, known, profile.related, 'PROFILE_UNKNOWN_RELATED');
    checkReferences(
      issues,
      profile.id,
      known,
      profile.compatibility.conflictsWith,
      'PROFILE_UNKNOWN_CONFLICT',
    );

    if (profile.prerequisites.includes(profile.id)) {
      issues.push({
        code: 'PROFILE_SELF_REFERENCE',
        path: `${profile.id}.prerequisites`,
        message: `${profile.id} cannot require itself.`,
      });
    }
  }

  issues.push(...prerequisiteCycles(profiles));

  return issues;
}

/** Selects the profiles a project's technology selection and type actually match. */
export function selectProfiles(
  profiles: readonly TechnologyProfile[],
  config: ProjectConfig,
): TechnologyProfile[] {
  const technologies = new Set(Object.values(config.technology).flat());

  return profiles.filter((profile) => {
    const appliesToType =
      profile.projectTypes.includes('all') || profile.projectTypes.includes(config.project.type);

    return technologies.has(profile.technology) && appliesToType;
  });
}

/** Explains selected profiles, including missing prerequisites and conflicts. */
export function evaluateProfileSelection(
  profiles: readonly TechnologyProfile[],
  config: ProjectConfig,
): { profiles: TechnologyProfile[]; issues: FrameworkIssue[] } {
  const selected = selectProfiles(profiles, config);
  const selectedIds = new Set(selected.map((profile) => profile.id));
  const issues: FrameworkIssue[] = [];

  for (const profile of selected) {
    for (const prerequisite of profile.prerequisites) {
      if (!selectedIds.has(prerequisite)) {
        issues.push({
          code: 'PROFILE_PREREQUISITE_NOT_SELECTED',
          path: profile.id,
          message: `${profile.id} requires ${prerequisite}, which this project does not select.`,
        });
      }
    }

    for (const conflict of profile.compatibility.conflictsWith) {
      if (selectedIds.has(conflict)) {
        issues.push({
          code: 'PROFILE_CONFLICT',
          path: profile.id,
          message: `${profile.id} conflicts with ${conflict}; select one of them.`,
        });
      }
    }
  }

  const covered = new Set(selected.map((profile) => profile.technology));
  for (const technology of new Set(Object.values(config.technology).flat())) {
    if (!covered.has(technology)) {
      issues.push({
        code: 'TECHNOLOGY_PROFILE_UNKNOWN',
        path: 'technology',
        message: `No technology profile covers "${technology}".`,
      });
    }
  }

  return { profiles: selected, issues };
}

function checkReferences(
  issues: FrameworkIssue[],
  profileId: string,
  known: ReadonlySet<string>,
  references: readonly string[],
  code: string,
): void {
  for (const reference of references) {
    if (!known.has(reference)) {
      issues.push({
        code,
        path: `${profileId}.references`,
        message: `Unknown profile ${reference}.`,
      });
    }
  }
}

function prerequisiteCycles(profiles: readonly TechnologyProfile[]): FrameworkIssue[] {
  const issues: FrameworkIssue[] = [];
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (id: string, path: string[]): void => {
    const current = state.get(id);
    if (current === 'done') {
      return;
    }
    if (current === 'visiting') {
      const start = path.indexOf(id);
      issues.push({
        code: 'PROFILE_PREREQUISITE_CYCLE',
        path: id,
        message: `Prerequisite cycle: ${[...path.slice(start === -1 ? 0 : start), id].join(' -> ')}.`,
      });
      return;
    }

    state.set(id, 'visiting');
    path.push(id);
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      if (byId.has(prerequisite)) {
        visit(prerequisite, path);
      }
    }
    path.pop();
    state.set(id, 'done');
  };

  for (const profile of profiles) {
    visit(profile.id, []);
  }

  return issues;
}
