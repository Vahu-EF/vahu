import { resolve } from 'node:path';
import type { Command } from 'commander';
import {
  applyBrand,
  applyDesignSystem,
  applyRepositories,
  BRAND_STATUSES,
  DESIGN_SOURCES,
  DESIGN_STATUSES,
  detectFoundation,
  loadProjectConfig,
  recordReadiness,
  REPOSITORY_STRATEGIES,
  saveProjectConfig,
  TECHNOLOGY_AREAS,
  updateTechnology,
  validateProjectConfig,
  type BrandInput,
  type BrandStatus,
  type DesignInput,
  type DesignSource,
  type DesignStatus,
  type RepositoriesInput,
  type RepositoryStrategy,
  type StageResult,
  type TechnologyArea,
  type ValidationResult,
} from '@vahu-ef/core';
import type { ProjectConfig } from '@vahu-ef/schemas';
import { collect, parseRepositorySpecs, splitList } from '../core/inputs.js';
import {
  formatBrand,
  formatDesignSystem,
  formatFoundation,
  formatReadiness,
  formatRepositories,
  formatTechnology,
} from '../core/output.js';

interface TargetOptions {
  path: string;
  json?: boolean;
}

interface BrandOptions extends TargetOptions {
  status?: string;
  logo?: string;
  colors?: string;
  typography?: string;
  guidelines?: string;
  notes?: string;
}

interface DesignOptions {
  directory?: string;
  json?: boolean;
  status?: string;
  source?: string;
  path?: string;
  notes?: string;
}

interface TechnologyOptions extends TargetOptions {
  area?: string;
  add?: string;
  remove?: string;
}

interface RepositoriesOptions extends TargetOptions {
  strategy?: string;
  notes?: string;
  location: string[];
}

interface ReadinessOptions extends TargetOptions {
  record?: boolean;
}

export function registerProjectStageCommands(program: Command): void {
  registerBrand(program);
  registerDesign(program);
  registerTechnology(program);
  registerRepositories(program);
  registerFoundation(program);
  registerReadiness(program);
}

function registerBrand(program: Command): void {
  program
    .command('brand')
    .description('Record brand identity, assets, or a not-applicable decision.')
    .option('--status <status>', `One of: ${BRAND_STATUSES.join(', ')}.`)
    .option('--logo <reference>', 'Logo path or URL.')
    .option('--colors <list>', 'Comma-separated brand colors.')
    .option('--typography <list>', 'Comma-separated typefaces.')
    .option('--guidelines <reference>', 'Brand guidelines path or URL.')
    .option('--notes <text>', 'Reason, context, or a link.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: BrandOptions) => {
      const hasInput = [
        options.status,
        options.logo,
        options.colors,
        options.typography,
        options.guidelines,
        options.notes,
      ].some((value) => value !== undefined);

      if (!hasInput) {
        await showSection(options, (config) => config.brand, formatBrand);
        return;
      }

      if (options.status !== undefined && !isBrandStatus(options.status)) {
        fail(`Unknown brand status "${options.status}". Use: ${BRAND_STATUSES.join(', ')}.`);
        return;
      }

      const input: BrandInput = {
        ...(isBrandStatus(options.status) ? { status: options.status } : {}),
        ...(options.logo !== undefined ? { logo: options.logo } : {}),
        ...(options.colors !== undefined ? { colors: splitList(options.colors) } : {}),
        ...(options.typography !== undefined ? { typography: splitList(options.typography) } : {}),
        ...(options.guidelines !== undefined ? { guidelines: options.guidelines } : {}),
        ...(options.notes !== undefined ? { notes: options.notes } : {}),
      };

      await applyAndSave(
        options,
        (config) => applyBrand(config, input),
        formatBrand,
        (config) => config.brand,
      );
    });
}

function registerDesign(program: Command): void {
  const design = program
    .command('design')
    .description('Record or approve the design system.')
    .option('--status <status>', `One of: ${DESIGN_STATUSES.join(', ')}.`)
    .option('--source <source>', `One of: ${DESIGN_SOURCES.join(', ')}.`)
    .option('--path <path>', 'Design-system document or token directory.')
    .option('--notes <text>', 'Context for the decision.')
    .option('--directory <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: DesignOptions) => {
      const target = targetOptions(options.directory, options.json);
      const hasInput = [options.status, options.source, options.path, options.notes].some(
        (value) => value !== undefined,
      );

      if (!hasInput) {
        await showSection(target, (config) => config.designSystem, formatDesignSystem);
        return;
      }

      if (options.status !== undefined && !isDesignStatus(options.status)) {
        fail(
          `Unknown design-system status "${options.status}". Use: ${DESIGN_STATUSES.join(', ')}.`,
        );
        return;
      }
      if (options.source !== undefined && !isDesignSource(options.source)) {
        fail(
          `Unknown design-system source "${options.source}". Use: ${DESIGN_SOURCES.join(', ')}.`,
        );
        return;
      }

      const input: DesignInput = {
        ...(isDesignStatus(options.status) ? { status: options.status } : {}),
        ...(isDesignSource(options.source) ? { source: options.source } : {}),
        ...(options.path !== undefined ? { path: options.path } : {}),
        ...(options.notes !== undefined ? { notes: options.notes } : {}),
      };

      await applyAndSave(
        target,
        (config) => applyDesignSystem(config, input),
        formatDesignSystem,
        (config) => config.designSystem,
      );
    });

  design
    .command('approve')
    .description('Approve an existing design system that has a source and a path.')
    .option('--directory <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (_options: unknown, command: Command) => {
      const global = command.optsWithGlobals<{ directory?: string; json?: boolean }>();
      await applyAndSave(
        targetOptions(global.directory, global.json),
        (config) => applyDesignSystem(config, { status: 'approved' }),
        formatDesignSystem,
        (config) => config.designSystem,
      );
    });
}

function registerTechnology(program: Command): void {
  program
    .command('technology')
    .description('Select or remove technologies by project area.')
    .option('--area <area>', `One of: ${TECHNOLOGY_AREAS.join(', ')}.`)
    .option('--add <list>', 'Comma-separated technologies to add.')
    .option('--remove <list>', 'Comma-separated technologies to remove.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: TechnologyOptions) => {
      if (options.area === undefined) {
        await showSection(options, (config) => config.technology, formatTechnology);
        return;
      }

      if (!isTechnologyArea(options.area)) {
        fail(`Unknown technology area "${options.area}". Use: ${TECHNOLOGY_AREAS.join(', ')}.`);
        return;
      }

      const area = options.area;
      if (options.add === undefined && options.remove === undefined) {
        await showSection(
          options,
          (config) => ({ [area]: config.technology[area] }),
          formatTechnology,
        );
        return;
      }

      await applyAndSave(
        options,
        (config) =>
          updateTechnology(config, area, {
            ...(options.add !== undefined ? { add: splitList(options.add) } : {}),
            ...(options.remove !== undefined ? { remove: splitList(options.remove) } : {}),
          }),
        formatTechnology,
        (config) => config.technology[area],
      );
    });
}

function registerRepositories(program: Command): void {
  program
    .command('repositories')
    .description('Record the repository strategy, notes, and locations.')
    .option('--strategy <strategy>', `One of: ${REPOSITORY_STRATEGIES.join(', ')}.`)
    .option('--notes <text>', 'Repository boundaries and relationships.')
    .option(
      '--location <spec>',
      'Repository location as name=path-or-url. Repeatable.',
      collect,
      [],
    )
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: RepositoriesOptions) => {
      const hasInput =
        options.strategy !== undefined ||
        options.notes !== undefined ||
        options.location.length > 0;

      if (!hasInput) {
        await showSection(options, (config) => config.repositories, formatRepositories);
        return;
      }

      if (options.strategy !== undefined && !isRepositoryStrategy(options.strategy)) {
        fail(
          `Unknown repository strategy "${options.strategy}". Use: ${REPOSITORY_STRATEGIES.join(', ')}.`,
        );
        return;
      }

      const locations =
        options.location.length > 0 ? parseRepositorySpecs(options.location) : undefined;
      if (locations === null) {
        fail('Repository locations must look like name=path or name=https://example.com/repo.');
        return;
      }

      const input: RepositoriesInput = {
        ...(isRepositoryStrategy(options.strategy) ? { strategy: options.strategy } : {}),
        ...(options.notes !== undefined ? { notes: options.notes } : {}),
        ...(locations !== undefined ? { locations } : {}),
      };

      await applyAndSave(
        options,
        (config) => applyRepositories(config, input),
        formatRepositories,
        (config) => config.repositories,
      );
    });
}

function registerFoundation(program: Command): void {
  program
    .command('foundation')
    .description('Inspect engineering-foundation facts; nothing is written.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable report.')
    .action((options: TargetOptions) => {
      const report = detectFoundation(resolve(options.path));
      console.log(
        options.json === true ? JSON.stringify(report, null, 2) : formatFoundation(report),
      );
    });
}

function registerReadiness(program: Command): void {
  program
    .command('readiness')
    .description('Report readiness and optionally record the status and check time.')
    .option('--record', 'Store the computed status and the check time.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: ReadinessOptions) => {
      const target = resolve(options.path);
      const loaded = await load(target);
      if (!loaded) {
        return;
      }

      const assessed = recordReadiness(loaded.config);
      const issues = validateProjectConfig(loaded.config);
      const result: ValidationResult = {
        ok: !issues.some((issue) => issue.severity === 'error'),
        configPath: loaded.configPath,
        config: loaded.config,
        issues,
      };

      if (options.record === true) {
        const saved = await saveProjectConfig(target, assessed, { overwrite: true });
        if (!saved.ok) {
          fail(`The configuration was not written (${saved.reason}).`);
          return;
        }
      }

      if (options.json === true) {
        console.log(
          JSON.stringify(
            {
              ok: result.ok,
              path: loaded.configPath,
              status: assessed.readiness.status,
              recordedAt: options.record === true ? assessed.readiness.checkedAt : null,
              issues,
            },
            null,
            2,
          ),
        );
      } else {
        if (options.record === true) {
          console.log(
            `Recorded readiness: ${assessed.readiness.status} at ${assessed.readiness.checkedAt ?? ''}.\n`,
          );
        }
        console.log(formatReadiness(result, assessed.readiness.status));
      }

      if (!result.ok) {
        process.exitCode = 1;
      }
    });
}

async function showSection(
  options: TargetOptions,
  section: (config: ProjectConfig) => unknown,
  render: (config: ProjectConfig) => string,
): Promise<void> {
  const loaded = await load(resolve(options.path));
  if (!loaded) {
    return;
  }

  if (options.json === true) {
    console.log(
      JSON.stringify({ ok: true, path: loaded.configPath, value: section(loaded.config) }, null, 2),
    );
    return;
  }

  console.log(render(loaded.config));
}

async function applyAndSave(
  options: TargetOptions,
  apply: (config: ProjectConfig) => StageResult,
  render: (config: ProjectConfig) => string,
  section: (config: ProjectConfig) => unknown,
): Promise<void> {
  const target = resolve(options.path);
  const loaded = await load(target);
  if (!loaded) {
    return;
  }

  const result = apply(loaded.config);
  if (!result.ok) {
    fail('The change is not valid.');
    printIssues(result.issues);
    return;
  }

  if (result.changed.length === 0) {
    if (options.json === true) {
      console.log(JSON.stringify({ ok: true, path: loaded.configPath, changed: [] }, null, 2));
      return;
    }
    console.log(render(result.config));
    console.log('\nNo changes.');
    return;
  }

  const saved = await saveProjectConfig(target, result.config, { overwrite: true });
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
          changed: result.changed,
          value: section(result.config),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(render(result.config));
  console.log(`\nUpdated ${saved.configPath} (${result.changed.length} field(s)).`);
}

async function load(target: string): Promise<{ config: ProjectConfig; configPath: string } | null> {
  const loaded = await loadProjectConfig(target);

  if (loaded.status === 'missing') {
    fail(`No configuration found at ${loaded.configPath}. Run \`vahu init\` first.`);
    return null;
  }

  if (loaded.status !== 'valid') {
    fail(`The configuration at ${loaded.configPath} cannot be read (${loaded.status}).`);
    if (loaded.status === 'invalid-schema') {
      printIssues(loaded.issues);
    }
    return null;
  }

  return { config: loaded.config, configPath: loaded.configPath };
}

function isBrandStatus(value: string | undefined): value is BrandStatus {
  return typeof value === 'string' && (BRAND_STATUSES as readonly string[]).includes(value);
}

function isDesignStatus(value: string | undefined): value is DesignStatus {
  return typeof value === 'string' && (DESIGN_STATUSES as readonly string[]).includes(value);
}

function isDesignSource(value: string | undefined): value is DesignSource {
  return typeof value === 'string' && (DESIGN_SOURCES as readonly string[]).includes(value);
}

function isRepositoryStrategy(value: string | undefined): value is RepositoryStrategy {
  return typeof value === 'string' && (REPOSITORY_STRATEGIES as readonly string[]).includes(value);
}

function isTechnologyArea(value: string | undefined): value is TechnologyArea {
  return typeof value === 'string' && (TECHNOLOGY_AREAS as readonly string[]).includes(value);
}

function targetOptions(directory: string | undefined, json: boolean | undefined): TargetOptions {
  return {
    path: directory ?? process.cwd(),
    ...(json !== undefined ? { json } : {}),
  };
}

function printIssues(issues: readonly { path: string; message: string }[]): void {
  for (const issue of issues) {
    console.error(`- ${issue.path}: ${issue.message}`);
  }
}

function fail(message: string): void {
  console.error(message);
  process.exitCode = 1;
}
