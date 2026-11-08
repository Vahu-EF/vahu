import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, open, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';
import { genericAdapter } from '@vahu-ef/adapters';
import { loadAgentCatalog } from '@vahu-ef/core';
import { collect } from '../core/inputs.js';

const REPORT_VERSION = '1.0.0';

interface AgentOptions {
  path?: string;
  catalog?: string;
  agent?: string[];
  write?: boolean;
  json?: boolean;
}

export function registerAgentCommands(program: Command): void {
  const agents = program.command('agents').description('Inspect canonical agent definitions.');

  agents
    .command('list')
    .description('List the available canonical agent definitions. Read-only.')
    .option('--path <directory>', 'Agent catalog directory; defaults to bundled definitions.')
    .option('--json', 'Print a versioned machine-readable report.')
    .action((options: AgentOptions) => listAgents(options));

  agents
    .command('inspect <agent-id>')
    .description('Inspect one canonical agent definition. Read-only.')
    .option('--path <directory>', 'Agent catalog directory; defaults to bundled definitions.')
    .option('--json', 'Print a versioned machine-readable report.')
    .action((agentId: string, options: AgentOptions) => inspectAgent(agentId, options));

  agents
    .command('sync')
    .description('Preview or write generic AGENTS.md from canonical definitions.')
    .option('--path <directory>', 'Project directory.', process.cwd())
    .option('--catalog <directory>', 'Agent catalog directory; defaults to bundled definitions.')
    .requiredOption(
      '--agent <agent-id>',
      'Canonical agent identifier; repeat to select multiple.',
      collect,
      [],
    )
    .option('--write', 'Write the generated file; without this flag, only show the preview.')
    .option('--json', 'Print a versioned machine-readable report.')
    .action((options: AgentOptions) => syncAgents(options));
}

async function listAgents(options: AgentOptions): Promise<void> {
  const catalog = await loadAgentCatalog(resolve(options.path ?? bundledAgentDirectory()));
  const report = {
    contractVersion: REPORT_VERSION,
    reportType: 'agent-list',
    ok: catalog.ok,
    agents: catalog.agents.map(({ id, name, description, version, compatibility }) => ({
      id,
      name,
      description,
      version,
      adapters: compatibility.adapters,
    })),
    issues: catalog.issues,
  };

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (catalog.ok) {
    console.log('VAHU canonical agents');
    for (const agent of report.agents) {
      console.log(`- ${agent.id}: ${agent.name} (v${agent.version})`);
      console.log(`  ${agent.description}`);
    }
    console.log(`\n${report.agents.length} agent(s).`);
  } else {
    printIssues(catalog.issues);
  }

  if (!catalog.ok) {
    process.exitCode = 1;
  }
}

async function inspectAgent(agentId: string, options: AgentOptions): Promise<void> {
  const catalog = await loadAgentCatalog(resolve(options.path ?? bundledAgentDirectory()));
  const agent = catalog.agents.find((item) => item.id === agentId) ?? null;
  const ok = catalog.ok && agent !== null;
  const report = {
    contractVersion: REPORT_VERSION,
    reportType: 'agent-inspection',
    ok,
    agent,
    issues: [
      ...catalog.issues,
      ...(!agent && catalog.ok
        ? [{ code: 'AGENT_UNKNOWN', path: agentId, message: `Unknown agent "${agentId}".` }]
        : []),
    ],
  };

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (agent && catalog.ok) {
    console.log(`VAHU agent ${agent.id}`);
    console.log(`Name: ${agent.name}`);
    console.log(`Version: ${agent.version}`);
    console.log(`Description: ${agent.description}`);
    console.log(`Adapters: ${agent.compatibility.adapters.join(', ') || 'none declared'}`);
    console.log(`Instructions: ${agent.instructions.length}`);
    console.log(`Rules: ${agent.rules.length}`);
    console.log(`Skills: ${agent.skills.length}`);
    console.log(`Commands: ${agent.commands.length}`);
    console.log(`Workflows: ${agent.workflows.length}`);
    console.log(`Tools: ${agent.tools.length}`);
  } else {
    printIssues(report.issues);
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

async function syncAgents(options: AgentOptions): Promise<void> {
  const selectedIds = options.agent ?? [];
  const catalog = await loadAgentCatalog(resolve(options.catalog ?? bundledAgentDirectory()));
  const selected = selectedIds.map((id) => catalog.agents.find((agent) => agent.id === id));
  const unknownIds = selectedIds.filter((_, index) => selected[index] === undefined);
  const issues = [
    ...catalog.issues,
    ...unknownIds.map((id) => ({
      code: 'AGENT_UNKNOWN',
      path: id,
      message: `Unknown agent "${id}".`,
    })),
  ];
  if (!catalog.ok || issues.length > 0 || selected.some((agent) => agent === undefined)) {
    failSync(options, issues);
    return;
  }

  const definitions = selected.filter((agent) => agent !== undefined);
  const content = genericAdapter.render(definitions);
  const target = resolve(options.path ?? process.cwd(), genericAdapter.outputPath);
  let current: string | null = null;
  try {
    const details = await lstat(target);
    if (!details.isFile()) {
      failSync(options, [
        {
          code: 'AGENT_OUTPUT_UNSAFE',
          path: target,
          message: 'The target exists but is not a regular file; refusing to replace it.',
        },
      ]);
      return;
    }
    current = await readFile(target, 'utf8');
  } catch (error) {
    if (!isMissingFile(error)) {
      failSync(options, [
        {
          code: 'AGENT_OUTPUT_UNREADABLE',
          path: target,
          message: error instanceof Error ? error.message : String(error),
        },
      ]);
      return;
    }
  }

  const marker =
    '<!-- Generated by VAHU (generic adapter). Edit the canonical definitions, not this file. -->';
  if (current !== null && !current.startsWith(`${marker}\n`)) {
    failSync(options, [
      {
        code: 'AGENT_OUTPUT_UNMANAGED',
        path: target,
        message: 'The existing file is not generated by VAHU; refusing to replace it.',
      },
    ]);
    return;
  }

  const changed = current !== content;
  let written = false;
  if (options.write === true && changed) {
    const temporary = join(dirname(target), `.AGENTS.md.${randomUUID()}.tmp`);
    try {
      const handle = await open(temporary, 'wx', 0o644);
      try {
        await handle.writeFile(content, 'utf8');
      } finally {
        await handle.close();
      }
      await rename(temporary, target);
      written = true;
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      failSync(options, [
        {
          code: 'AGENT_OUTPUT_WRITE_FAILED',
          path: target,
          message: error instanceof Error ? error.message : String(error),
        },
      ]);
      return;
    }
  }

  const report = {
    contractVersion: REPORT_VERSION,
    reportType: 'agent-sync',
    ok: true,
    path: target,
    adapter: genericAdapter.id,
    agentIds: definitions.map((agent) => agent.id),
    changed,
    written,
    preview: options.write === true ? undefined : content,
    issues: [],
  };
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  process.stdout.write(
    `Agent sync ${written ? 'written' : 'preview'}\nAdapter: ${genericAdapter.id}\nFile: ${target}\nAgents: ${report.agentIds.join(', ')}\nChanged: ${changed ? 'yes' : 'no'}\nWritten: ${written ? 'yes' : 'no'}\n${changed && !written ? `\n--- proposed AGENTS.md ---\n${content}` : ''}`,
  );
}

function failSync(
  options: AgentOptions,
  issues: readonly { code: string; path: string; message: string }[],
): void {
  if (options.json === true) {
    process.stdout.write(
      `${JSON.stringify(
        {
          contractVersion: REPORT_VERSION,
          reportType: 'agent-sync',
          ok: false,
          changed: false,
          written: false,
          issues,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    printIssues(issues);
  }
  process.exitCode = 1;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function bundledAgentDirectory(): string {
  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  const bundled = join(currentDirectory, 'agents');
  if (existsSync(bundled)) {
    return bundled;
  }
  return join(currentDirectory, '../../../../packages/framework/agents');
}

function printIssues(issues: readonly { code: string; path: string; message: string }[]): void {
  for (const issue of issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
}
