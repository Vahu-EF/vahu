import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';
import {
  loadProfileCatalog,
  loadProjectConfig,
  saveProjectConfig,
  selectProfiles,
  TECHNOLOGY_AREAS,
  updateTechnology,
  type TechnologyArea,
} from '@vahu-ef/core';

const REPORT_VERSION = '1.0.0';

interface ProfileOptions {
  path?: string;
  json?: boolean;
}

interface ProfileChangeOptions {
  path: string;
  catalog?: string;
  area?: string;
  write?: boolean;
  json?: boolean;
}

export function registerProfileCommands(program: Command): void {
  const profile = program.command('profile').description('Inspect and select technology profiles.');

  profile
    .command('list')
    .description('List the available technology profiles. Read-only.')
    .option('--path <directory>', 'Profile catalog directory; defaults to the bundled catalog.')
    .option('--json', 'Print a versioned machine-readable report.')
    .action((options: ProfileOptions) => runProfileList(options));

  profile
    .command('validate')
    .description('Validate profile definitions and references. Read-only.')
    .option('--path <directory>', 'Profile catalog directory; defaults to the bundled catalog.')
    .option('--json', 'Print a versioned machine-readable report.')
    .action((options: ProfileOptions) => runProfileValidation(options));

  for (const action of ['add', 'remove'] as const) {
    profile
      .command(`${action} <profile-id>`)
      .description(
        `${action === 'add' ? 'Select' : 'Remove'} a profile technology for this project.`,
      )
      .option('--path <directory>', 'Project directory.', process.cwd())
      .option(
        '--catalog <directory>',
        'Profile catalog directory; defaults to the bundled catalog.',
      )
      .option(
        '--area <area>',
        `Project technology area: ${TECHNOLOGY_AREAS.join(', ')}; defaults to the profile category.`,
      )
      .option('--write', 'Write the change; without this flag, only show the preview.')
      .option('--json', 'Print a versioned machine-readable report.')
      .action((profileId: string, options: ProfileChangeOptions) =>
        runProfileChange(profileId, action, options),
      );
  }
}

async function runProfileList(options: ProfileOptions): Promise<void> {
  const catalog = await loadProfileCatalog(resolve(options.path ?? bundledProfileDirectory()));
  const report = {
    contractVersion: REPORT_VERSION,
    reportType: 'profile-list',
    ok: catalog.ok,
    profiles: catalog.profiles.map(
      ({ id, name, description, category, technology, version, supportedVersions }) => ({
        id,
        name,
        description,
        category,
        technology,
        version,
        supportedVersions,
      }),
    ),
    issues: catalog.issues,
  };

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (!catalog.ok) {
    printIssues(catalog.issues);
  } else if (catalog.profiles.length === 0) {
    console.log('No technology profiles found.');
  } else {
    console.log('VAHU technology profiles');
    for (const item of report.profiles) {
      console.log(`- ${item.id}: ${item.name} (${item.category}; ${item.technology})`);
      console.log(`  Version ${item.version}; supports ${item.supportedVersions.join(', ')}`);
      console.log(`  ${item.description}`);
    }
    console.log(`\n${report.profiles.length} profile(s).`);
  }

  if (!catalog.ok) {
    process.exitCode = 1;
  }
}

async function runProfileValidation(options: ProfileOptions): Promise<void> {
  const catalog = await loadProfileCatalog(resolve(options.path ?? bundledProfileDirectory()));
  const report = {
    contractVersion: REPORT_VERSION,
    reportType: 'profile-validation',
    ok: catalog.ok,
    profilesChecked: catalog.profiles.length,
    issues: catalog.issues,
  };

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (catalog.ok) {
    console.log(
      `Technology profile validation passed: ${catalog.profiles.length} profile(s) valid.`,
    );
  } else {
    console.error('Technology profile validation failed:');
    printIssues(catalog.issues);
  }

  if (!catalog.ok) {
    process.exitCode = 1;
  }
}

async function runProfileChange(
  profileId: string,
  action: 'add' | 'remove',
  options: ProfileChangeOptions,
): Promise<void> {
  const target = resolve(options.path);
  const catalog = await loadProfileCatalog(resolve(options.catalog ?? bundledProfileDirectory()));
  if (!catalog.ok) {
    fail('Profile catalog validation failed.');
    printIssues(catalog.issues);
    return;
  }

  const profile = catalog.profiles.find((item) => item.id === profileId);
  if (!profile) {
    fail(`Unknown profile "${profileId}".`);
    return;
  }

  const profileArea = technologyAreaFor(profile.category);
  if (!profileArea) {
    fail(
      `Profile ${profile.id} has category "${profile.category}", which cannot be selected by the current project schema.`,
    );
    return;
  }
  const area = technologyAreaFor(options.area ?? profile.category);
  if (area === null || area !== profileArea) {
    fail(
      `Profile ${profile.id} must be assigned to its matching technology area "${profileArea}".`,
    );
    return;
  }

  const loaded = await loadProjectConfig(target);
  if (loaded.status !== 'valid') {
    fail(`No valid project configuration at ${loaded.configPath} (${loaded.status}).`);
    return;
  }

  const currentProfiles = selectProfiles(catalog.profiles, loaded.config);
  const selectedIds = new Set(currentProfiles.map((item) => item.id));
  const isSelected = selectedIds.has(profile.id);
  const issues: Array<{ code: string; path: string; message: string }> = [];

  if (action === 'add') {
    if (
      !profile.projectTypes.includes('all') &&
      !profile.projectTypes.includes(loaded.config.project.type)
    ) {
      issues.push({
        code: 'PROFILE_PROJECT_TYPE_MISMATCH',
        path: profile.id,
        message: `Profile ${profile.id} does not apply to project type ${loaded.config.project.type}.`,
      });
    }
    for (const prerequisite of profile.prerequisites) {
      if (!selectedIds.has(prerequisite)) {
        issues.push({
          code: 'PROFILE_PREREQUISITE_NOT_SELECTED',
          path: profile.id,
          message: `Select prerequisite profile ${prerequisite} before adding ${profile.id}.`,
        });
      }
    }
    const conflict = currentProfiles.find(
      (selected) =>
        profile.compatibility.conflictsWith.includes(selected.id) ||
        selected.compatibility.conflictsWith.includes(profile.id),
    );
    if (conflict && conflict.id !== profile.id) {
      issues.push({
        code: 'PROFILE_CONFLICT',
        path: profile.id,
        message: `Profile ${profile.id} conflicts with already selected profile ${conflict.id}.`,
      });
    }
  } else if (!isSelected) {
    issues.push({
      code: 'PROFILE_NOT_SELECTED',
      path: profile.id,
      message: `Profile ${profile.id} is not selected in technology area ${area}.`,
    });
  } else {
    const dependent = currentProfiles.find((selected) =>
      selected.prerequisites.includes(profile.id),
    );
    if (dependent) {
      issues.push({
        code: 'PROFILE_PREREQUISITE_IN_USE',
        path: profile.id,
        message: `Remove dependent profile ${dependent.id} before removing ${profile.id}.`,
      });
    }
    const overlapping = currentProfiles.find(
      (selected) =>
        selected.id !== profile.id &&
        selected.category === profile.category &&
        selected.technology === profile.technology,
    );
    if (overlapping) {
      issues.push({
        code: 'PROFILE_TECHNOLOGY_IN_USE',
        path: profile.id,
        message: `Profile ${overlapping.id} also uses ${profile.technology}; removing ${profile.id} would remove their shared technology selection.`,
      });
    }
  }

  if (issues.length > 0) {
    fail('The profile change is not valid.');
    printIssues(issues);
    return;
  }

  const result = updateTechnology(loaded.config, area, {
    ...(action === 'add' ? { add: [profile.technology] } : { remove: [profile.technology] }),
  });
  if (!result.ok) {
    fail('The profile change is not valid.');
    printIssues(result.issues);
    return;
  }

  const changed = result.changed.length > 0;
  let written = false;
  if (options.write === true && changed) {
    const saved = await saveProjectConfig(target, result.config, { overwrite: true });
    if (!saved.ok) {
      fail(`The configuration was not written (${saved.reason}).`);
      return;
    }
    written = true;
  }

  const report = {
    contractVersion: REPORT_VERSION,
    reportType: 'profile-selection-change',
    ok: true,
    action,
    profileId: profile.id,
    technology: profile.technology,
    area,
    changed,
    written,
    path: loaded.configPath,
    nextTechnology: result.config.technology[area],
  };

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  process.stdout.write(
    `Profile selection preview\nAction: ${action} ${profile.id}\nTechnology: ${profile.technology} (${area})\nChange: ${changed ? 'yes' : 'no'}\nWritten: ${written ? 'yes' : 'no'}\n${written ? '' : 'Re-run with --write to save this change.\n'}`,
  );
}

function technologyAreaFor(category: string): TechnologyArea | null {
  return (TECHNOLOGY_AREAS as readonly string[]).includes(category)
    ? (category as TechnologyArea)
    : null;
}

function bundledProfileDirectory(): string {
  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  const bundled = join(currentDirectory, 'technology-profiles');
  if (existsSync(bundled)) {
    return bundled;
  }
  return join(currentDirectory, '../../../../packages/framework/technology-profiles');
}

function fail(message: string): void {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function printIssues(issues: readonly { code: string; path: string; message: string }[]): void {
  for (const issue of issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
}
