import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  migrateProjectConfig,
  SCHEMA_VERSION,
  type ConfigIssue,
  type ProjectConfig,
  type SchemaVersion,
} from '@vahu-ef/schemas';

export const PROJECT_CONFIG_RELATIVE_PATH = '.vahu/project.json';

export type ConfigLoadResult =
  | { status: 'missing'; configPath: string }
  | { status: 'unreadable'; configPath: string; message: string }
  | { status: 'invalid-json'; configPath: string; message: string }
  | { status: 'invalid-schema'; configPath: string; issues: ConfigIssue[] }
  | {
      status: 'valid';
      configPath: string;
      config: ProjectConfig;
      migratedFrom?: Exclude<SchemaVersion, typeof SCHEMA_VERSION>;
    };

export function projectConfigPath(cwd: string): string {
  return resolve(cwd, PROJECT_CONFIG_RELATIVE_PATH);
}

export type SaveConfigResult =
  | { ok: true; configPath: string; created: boolean }
  | { ok: false; configPath: string; reason: 'exists' };

/**
 * Writes the project configuration. An existing file is only replaced when
 * `overwrite` is explicit, so a caller cannot silently destroy user changes.
 */
export async function saveProjectConfig(
  cwd: string,
  config: ProjectConfig,
  options: { overwrite?: boolean } = {},
): Promise<SaveConfigResult> {
  const configPath = projectConfigPath(cwd);
  const existed = existsSync(configPath);

  if (existed && options.overwrite !== true) {
    return { ok: false, configPath, reason: 'exists' };
  }

  await writeConfigAtomically(configPath, `${JSON.stringify(config, null, 2)}\n`);

  return { ok: true, configPath, created: !existed };
}

/**
 * Writes the complete configuration to a temporary file in the same directory,
 * then renames it into place. A reader therefore sees either the previous file
 * or the complete new one, never a truncated write, and the rename replaces a
 * symlink at the target path instead of following it outside the project.
 */
async function writeConfigAtomically(configPath: string, contents: string): Promise<void> {
  const directory = dirname(configPath);
  await mkdir(directory, { recursive: true });
  const temporaryPath = join(directory, `.project.json.${randomUUID()}.tmp`);

  try {
    await writeFile(temporaryPath, contents, { encoding: 'utf8', mode: 0o644, flag: 'wx' });
    await rename(temporaryPath, configPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function loadProjectConfig(cwd: string): Promise<ConfigLoadResult> {
  const configPath = projectConfigPath(cwd);
  let source: string;

  try {
    source = await readFile(configPath, 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return { status: 'missing', configPath };
    }

    return {
      status: 'unreadable',
      configPath,
      message: error instanceof Error ? error.message : 'Unknown read error.',
    };
  }

  let input: unknown;
  try {
    input = JSON.parse(source);
  } catch (error) {
    return {
      status: 'invalid-json',
      configPath,
      message: error instanceof Error ? error.message : 'Invalid JSON.',
    };
  }

  const migrated = migrateProjectConfig(input);
  if (!migrated.ok) {
    return { status: 'invalid-schema', configPath, issues: migrated.issues };
  }

  return {
    status: 'valid',
    configPath,
    config: migrated.config,
    ...(migrated.from === SCHEMA_VERSION ? {} : { migratedFrom: migrated.from }),
  };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
