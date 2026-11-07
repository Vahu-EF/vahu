import { resolve } from 'node:path';
import type { Command } from 'commander';
import {
  buildProjectConfig,
  changedConfigPaths,
  loadProjectConfig,
  mergeIdentity,
  PROJECT_LIFECYCLES,
  PROJECT_TYPES,
  saveProjectConfig,
  suggestSlug,
  validateAnswers,
  type IdentityAnswers,
} from '@vahu-ef/core';
import type {
  ProjectConfig,
  ProjectLifecycle,
  ProjectType,
  RepositoryLocation,
} from '@vahu-ef/schemas';
import { formatChangePreview } from '../core/output.js';
import { canPrompt, createPromptSession, type PromptSession } from '../core/prompt.js';

interface InitOptions {
  path: string;
  name?: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  purpose?: string;
  users?: string;
  type?: string;
  lifecycle?: string;
  languages?: string;
  scope?: string;
  constraints?: string;
  nonGoals?: string;
  repository: string[];
  yes?: boolean;
  force?: boolean;
  json?: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Create or update .vahu/project.json through Project Identity onboarding.')
    .option('--path <directory>', 'Project directory to initialize.', process.cwd())
    .option('--name <name>', 'Formal project name.')
    .option('--slug <slug>', 'Project slug; derived from the name when omitted.')
    .option('--description <text>', 'Short project description.')
    .option('--long-description <text>', 'Longer project description.')
    .option('--purpose <text>', 'What the project exists to do.')
    .option('--users <list>', 'Comma-separated target users.')
    .option('--type <type>', `Project type: ${PROJECT_TYPES.join(', ')}.`)
    .option('--lifecycle <lifecycle>', `Project lifecycle: ${PROJECT_LIFECYCLES.join(', ')}.`)
    .option('--languages <list>', 'Comma-separated documentation languages.', 'en')
    .option('--scope <text>', 'Scope of the first release.')
    .option('--constraints <list>', 'Comma-separated constraints.')
    .option('--non-goals <list>', 'Comma-separated non-goals.')
    .option(
      '--repository <spec>',
      'Repository location as name=path-or-url. Repeatable.',
      collect,
      [],
    )
    .option('--yes', 'Write a new configuration without asking for confirmation.')
    .option('--force', 'Replace an existing configuration after the change preview.')
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: InitOptions) => {
      await runInit(options);
    });
}

async function runInit(options: InitOptions): Promise<void> {
  const target = resolve(options.path);
  const loaded = await loadProjectConfig(target);

  if (loaded.status === 'unreadable' || loaded.status === 'invalid-json') {
    fail(
      `The existing configuration at ${loaded.configPath} cannot be read (${loaded.status}). Fix it first.`,
    );
    return;
  }

  if (loaded.status === 'invalid-schema') {
    fail('The existing configuration does not match the schema. Fix it before running init.');
    for (const issue of loaded.issues) {
      console.error(`- ${issue.path}: ${issue.message}`);
    }
    return;
  }

  const existing = loaded.status === 'valid' ? loaded.config : null;
  const answers = await collectAnswers(options, existing);
  if (!answers) {
    return;
  }

  const issues = validateAnswers(answers);
  if (issues.length > 0) {
    fail('The identity answers are not valid.');
    printIssues(issues);
    return;
  }

  const next = existing ? mergeIdentity(existing, answers) : buildProjectConfig(answers);
  const changed = changedConfigPaths(existing, next);

  if (options.json !== true) {
    console.log(formatChangePreview(changed, existing !== null));
    console.log('');
  }

  if (!(await confirmWrite(options, existing !== null))) {
    return;
  }

  const saved = await saveProjectConfig(target, next, { overwrite: existing !== null });
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
          created: saved.created,
          changed,
          identity: next.identity.status,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`${saved.created ? 'Created' : 'Updated'} ${saved.configPath}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review the file and adjust any field.');
  console.log('  2. vahu identity approve --by "Your Name"');
  console.log('  3. vahu validate');
}

async function confirmWrite(options: InitOptions, exists: boolean): Promise<boolean> {
  if (exists) {
    if (options.force === true) {
      return true;
    }
    if (!canPrompt()) {
      fail('A configuration already exists. Review the preview, then re-run with --force.');
      return false;
    }
    const session = createPromptSession();
    const approved = await session.confirm('Replace the existing configuration?');
    session.close();
    if (!approved) {
      console.log('Aborted; no changes written.');
    }
    return approved;
  }

  if (options.yes === true) {
    return true;
  }
  if (!canPrompt()) {
    fail('Pass --yes to write a new configuration without an interactive prompt.');
    return false;
  }
  const session = createPromptSession();
  const approved = await session.confirm('Write .vahu/project.json?');
  session.close();
  if (!approved) {
    console.log('Aborted; no changes written.');
  }
  return approved;
}

async function collectAnswers(
  options: InitOptions,
  existing: ProjectConfig | null,
): Promise<IdentityAnswers | null> {
  const session: PromptSession | null = canPrompt() ? createPromptSession() : null;
  const missing: string[] = [];

  const required = async (
    flag: string | undefined,
    label: string,
    fallback: string,
  ): Promise<string> => {
    if (flag !== undefined && flag.trim().length > 0) {
      return flag.trim();
    }
    if (session) {
      return (await session.ask(label, fallback.length > 0 ? fallback : undefined)).trim();
    }
    if (fallback.trim().length > 0) {
      return fallback.trim();
    }
    missing.push(label);
    return '';
  };

  const optional = async (
    flag: string | undefined,
    label: string,
    fallback: string,
  ): Promise<string> => {
    if (flag !== undefined) {
      return flag.trim();
    }
    if (session) {
      return (await session.ask(label, fallback.length > 0 ? fallback : undefined)).trim();
    }
    return fallback.trim();
  };

  try {
    const name = await required(options.name, 'Project name', existing?.project.name ?? '');
    if (name.length === 0 && !session) {
      missing.push('name');
    }

    const slugFlag = options.slug ?? existing?.project.slug;
    const slugFallback = slugFlag ?? suggestSlug(name);
    const slug = await required(slugFlag, 'Project slug', slugFallback);

    const description = await required(
      options.description,
      'Short description',
      existing?.project.description ?? '',
    );
    const purpose = await required(options.purpose, 'Purpose', existing?.project.purpose ?? '');
    const users = await required(
      options.users,
      'Target users (comma-separated)',
      (existing?.project.targetUsers ?? []).join(', '),
    );
    const scope = await required(
      options.scope,
      'Scope of the first release',
      existing?.project.scope ?? '',
    );

    const typeText = await required(
      options.type,
      `Project type (${PROJECT_TYPES.join(', ')})`,
      existing?.project.type ?? 'backend-service',
    );
    const languages = await required(
      options.languages,
      'Documentation languages (comma-separated)',
      (existing?.project.languages ?? ['en']).join(', '),
    );
    const constraints = await optional(
      options.constraints,
      'Constraints (comma-separated, blank for none)',
      (existing?.project.constraints ?? []).join(', '),
    );
    const longDescription = await optional(
      options.longDescription,
      'Long description (blank to skip)',
      existing?.project.longDescription ?? '',
    );
    const lifecycleText = await optional(
      options.lifecycle,
      `Project lifecycle (${PROJECT_LIFECYCLES.join(', ')}, blank to skip)`,
      existing?.project.lifecycle ?? '',
    );
    const nonGoals = await optional(
      options.nonGoals,
      'Non-goals (comma-separated, blank for none)',
      (existing?.project.nonGoals ?? []).join(', '),
    );
    const repositoryText = await optional(
      options.repository.length > 0 ? options.repository.join(', ') : undefined,
      'Repository locations (name=path, comma-separated, blank for none)',
      (existing?.repositories.locations ?? []).map(formatRepositorySpec).join(', '),
    );

    if (missing.length > 0) {
      fail(`Missing required answers: ${missing.join(', ')}. Pass flags or run interactively.`);
      return null;
    }

    if (!isProjectType(typeText)) {
      fail(`Unknown project type "${typeText}". Use one of: ${PROJECT_TYPES.join(', ')}.`);
      return null;
    }

    if (lifecycleText.length > 0 && !isLifecycle(lifecycleText)) {
      fail(`Unknown lifecycle "${lifecycleText}". Use one of: ${PROJECT_LIFECYCLES.join(', ')}.`);
      return null;
    }

    const repositories = parseRepositories(splitList(repositoryText));
    if (!repositories) {
      fail('Repository locations must look like name=path or name=https://example.com/repo.');
      return null;
    }

    return {
      name,
      slug,
      description,
      ...(longDescription.length > 0 ? { longDescription } : {}),
      purpose,
      targetUsers: splitList(users),
      type: typeText,
      ...(lifecycleText.length > 0 ? { lifecycle: lifecycleText as ProjectLifecycle } : {}),
      languages: splitList(languages),
      scope,
      constraints: splitList(constraints),
      nonGoals: splitList(nonGoals),
      repositories,
    };
  } finally {
    session?.close();
  }
}

function isProjectType(value: string): value is ProjectType {
  return (PROJECT_TYPES as readonly string[]).includes(value);
}

function isLifecycle(value: string): value is ProjectLifecycle {
  return (PROJECT_LIFECYCLES as readonly string[]).includes(value);
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function formatRepositorySpec(location: RepositoryLocation): string {
  return `${location.name}=${location.path ?? location.url ?? ''}`;
}

function parseRepositories(specs: readonly string[]): RepositoryLocation[] | null {
  const locations: RepositoryLocation[] = [];

  for (const spec of specs) {
    const separator = spec.indexOf('=');
    if (separator <= 0) {
      return null;
    }

    const name = spec.slice(0, separator).trim();
    const location = spec.slice(separator + 1).trim();
    if (name.length === 0 || location.length === 0) {
      return null;
    }

    locations.push(
      location.startsWith('http://') || location.startsWith('https://')
        ? { name, url: location }
        : { name, path: location },
    );
  }

  return locations;
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
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
