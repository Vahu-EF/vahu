import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseAgentDefinition, type AgentDefinition } from '@vahu-ef/schemas';
import type { FrameworkIssue } from './issues.js';

export interface AgentCatalog {
  ok: boolean;
  agents: AgentDefinition[];
  issues: FrameworkIssue[];
}

/** Loads and validates each canonical agent definition in a directory. */
export async function loadAgentCatalog(directory: string): Promise<AgentCatalog> {
  let files: string[];
  try {
    files = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  } catch {
    return {
      ok: false,
      agents: [],
      issues: [
        {
          code: 'AGENT_DIRECTORY_MISSING',
          path: directory,
          message: 'The agent-definition directory does not exist.',
        },
      ],
    };
  }

  const agents: AgentDefinition[] = [];
  const issues: FrameworkIssue[] = [];
  for (const name of files) {
    let input: unknown;
    try {
      input = JSON.parse(await readFile(join(directory, name), 'utf8'));
    } catch {
      issues.push({
        code: 'AGENT_INVALID_JSON',
        path: name,
        message: 'The agent definition is not valid JSON.',
      });
      continue;
    }

    const parsed = parseAgentDefinition(input);
    if (!parsed.ok) {
      issues.push(
        ...parsed.issues.map((issue) => ({
          code: 'AGENT_INVALID',
          path: `${name}#${issue.path}`,
          message: issue.message,
        })),
      );
      continue;
    }
    agents.push(parsed.data);
  }

  const known = new Set<string>();
  for (const agent of agents) {
    if (known.has(agent.id)) {
      issues.push({
        code: 'AGENT_DUPLICATE_ID',
        path: agent.id,
        message: `Duplicate agent identifier ${agent.id}.`,
      });
    }
    known.add(agent.id);
  }

  return { ok: issues.length === 0, agents, issues };
}
