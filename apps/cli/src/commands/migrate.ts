import { resolve } from 'node:path';
import type { Command } from 'commander';
import { loadProjectConfig, saveProjectConfig } from '@vahu-ef/core';

interface MigrateOptions {
  path: string;
  write?: boolean;
  json?: boolean;
}

export function registerMigrateCommand(program: Command): void {
  program
    .command('migrate')
    .description('Read an older configuration and optionally write the current schema version.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--write', 'Rewrite the configuration with the current schema version.')
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: MigrateOptions) => {
      await runMigrate(options);
    });
}

async function runMigrate(options: MigrateOptions): Promise<void> {
  const target = resolve(options.path);
  const loaded = await loadProjectConfig(target);

  if (loaded.status === 'missing') {
    fail(`No configuration found at ${loaded.configPath}. Run \`vahu init\` first.`);
    return;
  }

  if (loaded.status !== 'valid') {
    fail(`The configuration at ${loaded.configPath} cannot be read (${loaded.status}).`);
    if (loaded.status === 'invalid-schema') {
      for (const issue of loaded.issues) {
        console.error(`- ${issue.path}: ${issue.message}`);
      }
    }
    return;
  }

  if (!loaded.migratedFrom) {
    if (options.json === true) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            path: loaded.configPath,
            schemaVersion: loaded.config.schemaVersion,
            changed: false,
          },
          null,
          2,
        ),
      );
      return;
    }
    console.log(
      `The configuration already uses schema ${loaded.config.schemaVersion}. Nothing to do.`,
    );
    return;
  }

  if (options.write !== true) {
    if (options.json === true) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            path: loaded.configPath,
            from: loaded.migratedFrom,
            to: loaded.config.schemaVersion,
            changed: true,
            written: false,
          },
          null,
          2,
        ),
      );
      return;
    }
    console.log(`Schema ${loaded.migratedFrom} → ${loaded.config.schemaVersion}`);
    console.log('Adds `project.nonGoals: []` and `repositories.locations: []`; keeps every value.');
    console.log('');
    console.log('Read-only. Re-run with --write to update the file.');
    return;
  }

  const saved = await saveProjectConfig(target, loaded.config, { overwrite: true });
  if (!saved.ok) {
    fail(`The configuration was not written (${saved.reason}).`);
    return;
  }

  if (options.json === true) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          path: saved.configPath,
          from: loaded.migratedFrom,
          to: loaded.config.schemaVersion,
          changed: true,
          written: true,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    `Migrated ${saved.configPath} from schema ${loaded.migratedFrom} to ${loaded.config.schemaVersion}.`,
  );
}

function fail(message: string): void {
  console.error(message);
  process.exitCode = 1;
}
