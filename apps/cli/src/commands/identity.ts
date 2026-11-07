import { resolve } from 'node:path';
import type { Command } from 'commander';
import { approveIdentity, loadProjectConfig, saveProjectConfig } from '@vahu-ef/core';
import { formatIdentity } from '../core/output.js';
import { canPrompt, createPromptSession } from '../core/prompt.js';

interface IdentityOptions {
  path: string;
  json?: boolean;
}

interface ApproveOptions extends IdentityOptions {
  by?: string;
}

export function registerIdentityCommand(program: Command): void {
  const identity = program
    .command('identity')
    .description('Show the Project Identity and its approval status.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--json', 'Print a machine-readable result.')
    .action(async (options: IdentityOptions) => {
      await showIdentity(options);
    });

  identity
    .command('approve')
    .description('Record explicit approval of the Project Identity.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--by <name>', 'Name of the person approving the identity.')
    .option('--json', 'Print a machine-readable result.')
    .action(async (_options: ApproveOptions, command: Command) => {
      // `--path` is declared on both `identity` and `identity approve`, so
      // commander records the value on the parent command.
      await approve(command.optsWithGlobals<ApproveOptions>());
    });
}

async function showIdentity(options: IdentityOptions): Promise<void> {
  const loaded = await loadProjectConfig(resolve(options.path));
  if (loaded.status !== 'valid') {
    failForLoad(loaded.status, loaded.configPath);
    return;
  }

  if (options.json === true) {
    const { project, identity } = loaded.config;
    console.log(JSON.stringify({ ok: true, project, identity }, null, 2));
    return;
  }

  console.log(formatIdentity(loaded.config));
}

async function approve(options: ApproveOptions): Promise<void> {
  const target = resolve(options.path);
  const loaded = await loadProjectConfig(target);
  if (loaded.status !== 'valid') {
    failForLoad(loaded.status, loaded.configPath);
    return;
  }

  let approver = options.by?.trim() ?? '';
  if (approver.length === 0 && canPrompt()) {
    const session = createPromptSession();
    approver = await session.ask('Approved by');
    session.close();
  }

  if (approver.length === 0) {
    fail('An approval needs a named approver. Pass --by "Your Name".');
    return;
  }

  const result = approveIdentity(loaded.config, { by: approver });
  if (!result.ok) {
    fail('The identity was not approved.');
    for (const issue of result.issues) {
      console.error(`- ${issue.path}: ${issue.message}`);
    }
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
        { ok: true, path: saved.configPath, identity: result.config.identity },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`Identity approved by ${result.config.identity.approvedBy}.`);
  console.log(`Recorded in ${saved.configPath}`);
  console.log('');
  console.log('Next: vahu validate');
}

function failForLoad(status: string, configPath: string): void {
  if (status === 'missing') {
    fail(`No configuration found at ${configPath}. Run \`vahu init\` first.`);
    return;
  }
  fail(`The configuration at ${configPath} cannot be read (${status}). Run \`vahu validate\`.`);
}

function fail(message: string): void {
  console.error(message);
  process.exitCode = 1;
}
