import { existsSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export interface RuleBlock {
  id: string;
  body: string[];
}

const metadataPattern = /^- \*\*([^*]+):\*\*\s*(.*)$/;
const ruleHeadingPattern = /^### (P1-\d+-R\d+) — (.+)$/;
const headingPattern = /^(#{1,6}) (.+)$/;
const linkPattern = /\[[^\]]*\]\(([^)\s]+)\)/g;

/** Reads the `- **Key:** value` metadata lines before the first level-two heading. */
export function readHeaderMetadata(content: string): Map<string, string> {
  const metadata = new Map<string, string>();
  for (const line of content.split('\n')) {
    if (line.startsWith('## ')) {
      break;
    }
    const match = metadataPattern.exec(line);
    const key = match?.[1]?.trim();
    const value = match?.[2]?.trim();
    if (key && value) {
      metadata.set(key, value);
    }
  }
  return metadata;
}

export function levelTwoHeadings(content: string): string[] {
  const headings: string[] = [];
  for (const line of content.split('\n')) {
    const match = /^## (.+)$/.exec(line);
    if (match?.[1]) {
      headings.push(match[1].trim());
    }
  }
  return headings;
}

export function firstHeading(content: string): string | null {
  for (const line of content.split('\n')) {
    const match = /^# (.+)$/.exec(line);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/** Returns the first paragraph after a level-two heading, or null when absent. */
export function firstParagraphUnder(content: string, heading: string): string | null {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) {
    return null;
  }

  const paragraph: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (paragraph.length > 0) break;
      continue;
    }
    if (headingPattern.test(trimmed)) break;
    paragraph.push(trimmed);
  }

  return paragraph.length > 0 ? paragraph.join(' ') : null;
}

/** Returns the first prose paragraph after the title, skipping metadata bullets. */
export function firstParagraphAfterTitle(content: string): string | null {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => line.startsWith('# '));
  if (start === -1) {
    return null;
  }

  const paragraph: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('- ')) {
      if (paragraph.length > 0) break;
      continue;
    }
    if (headingPattern.test(trimmed)) break;
    paragraph.push(trimmed);
  }

  return paragraph.length > 0 ? paragraph.join(' ') : null;
}

export function ruleBlocks(content: string): RuleBlock[] {
  const rules: RuleBlock[] = [];
  let current: RuleBlock | null = null;

  for (const line of content.split('\n')) {
    const heading = ruleHeadingPattern.exec(line);
    if (heading?.[1]) {
      if (current) rules.push(current);
      current = { id: heading[1], body: [] };
      continue;
    }
    if (current && line.startsWith('#')) {
      rules.push(current);
      current = null;
      continue;
    }
    current?.body.push(line);
  }

  if (current) rules.push(current);
  return rules;
}

export function ruleFields(rule: RuleBlock): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of rule.body) {
    const match = /^- \*\*(Level|Rule|Rationale|Verification):\*\*\s*(.*)$/.exec(line);
    const key = match?.[1];
    const value = match?.[2]?.trim();
    if (key && value) {
      fields.set(key, value);
    }
  }
  return fields;
}

/** Returns relative link targets that do not resolve from the file's directory. */
export function unresolvedRelativeLinks(file: string, content: string): string[] {
  const missing: string[] = [];
  const baseDirectory = dirname(file);

  for (const match of content.matchAll(linkPattern)) {
    const rawTarget = match[1];
    if (!rawTarget) continue;
    if (/^(?:https?:|mailto:|tel:)/.test(rawTarget) || rawTarget.startsWith('#')) {
      continue;
    }

    const withoutAnchor = rawTarget.split('#')[0]?.split('?')[0] ?? '';
    if (withoutAnchor.length === 0) continue;

    if (!existsSync(resolve(baseDirectory, withoutAnchor))) {
      missing.push(rawTarget);
    }
  }

  return missing;
}

export async function markdownFiles(directory: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}
