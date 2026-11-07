#!/usr/bin/env node

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Command } from 'commander';
import { runDoctor, validateProject } from '@vahu-ef/core';
import { registerIdentityCommand } from './commands/identity.js';
import { registerInitCommand } from './commands/init.js';
import { formatDoctor, formatValidation } from './core/output.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };

export function createProgram(): Command {
  const program = new Command();

  program
    .name('vahu')
    .description('Build Better Software, With Better Agents.')
    .version(packageJson.version, '-v, --version', 'Print the VAHU CLI version.');

  program
    .command('doctor')
    .description('Check the local environment and project configuration.')
    .option('--json', 'Print a machine-readable report.')
    .action(async (options: { json?: boolean }) => {
      const report = await runDoctor(process.cwd());
      process.stdout.write(
        options.json === true
          ? `${JSON.stringify(report, null, 2)}\n`
          : `${formatDoctor(report)}\n`,
      );
      if (!report.ok) {
        process.exitCode = 1;
      }
    });

  program
    .command('validate')
    .description('Validate the VAHU configuration in a project directory.')
    .option('--path <directory>', 'Project directory to validate.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: { path: string; json?: boolean }) => {
      const result = await validateProject(options.path);
      process.stdout.write(
        options.json === true
          ? `${JSON.stringify(result, null, 2)}\n`
          : `${formatValidation(result)}\n`,
      );
      if (!result.ok) {
        process.exitCode = 1;
      }
    });

  registerInitCommand(program);
  registerIdentityCommand(program);

  return program;
}

export async function main(argv: string[] = process.argv): Promise<void> {
  await createProgram().parseAsync(argv);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
