import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseProjectConfig, type ConfigIssue, type ProjectConfig } from '@vahu-ef/schemas';

export const PROJECT_CONFIG_RELATIVE_PATH = '.vahu/project.json';

export type ConfigLoadResult =
  | { status: 'missing'; configPath: string }
  | { status: 'unreadable'; configPath: string; message: string }
  | { status: 'invalid-json'; configPath: string; message: string }
  | { status: 'invalid-schema'; configPath: string; issues: ConfigIssue[] }
  | { status: 'valid'; configPath: string; config: ProjectConfig };

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

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  return { ok: true, configPath, created: !existed };
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

  const parsed = parseProjectConfig(input);
  if (!parsed.ok) {
    return { status: 'invalid-schema', configPath, issues: parsed.issues };
  }

  return { status: 'valid', configPath, config: parsed.data };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
