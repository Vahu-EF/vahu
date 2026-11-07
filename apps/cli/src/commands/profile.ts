import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';
import { loadProfileCatalog } from '@vahu-ef/core';

const REPORT_VERSION = '1.0.0';

interface ProfileOptions {
  path?: string;
  json?: boolean;
}

export function registerProfileCommands(program: Command): void {
  const profile = program.command('profile').description('Inspect reusable technology profiles.');

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

function bundledProfileDirectory(): string {
  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  const bundled = join(currentDirectory, 'technology-profiles');
  if (existsSync(bundled)) {
    return bundled;
  }
  return join(currentDirectory, '../../../../packages/framework/technology-profiles');
}

function printIssues(issues: readonly { code: string; path: string; message: string }[]): void {
  for (const issue of issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
}
