import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import type { FrameworkIssue } from './issues.js';
import {
  levelTwoHeadings,
  markdownFiles,
  readHeaderMetadata,
  ruleBlocks,
  ruleFields,
  unresolvedRelativeLinks,
} from './markdown.js';

export type StandardIssue = FrameworkIssue;

export interface StandardsReport {
  ok: boolean;
  standardsChecked: number;
  adrsChecked: number;
  issues: StandardIssue[];
}

export const REQUIRED_STANDARD_METADATA = [
  'Standard ID',
  'Status',
  'Owner',
  'Approver',
  'Approval',
  'Version',
  'Applies to',
  'Related',
] as const;

export const REQUIRED_STANDARD_SECTIONS = [
  'Purpose',
  'Scope',
  'Non-goals',
  'Rules',
  'Examples',
  'Exceptions',
  'Verification',
  'Related decisions',
  'Change history',
] as const;

export const ALLOWED_STANDARD_STATUSES = ['Draft', 'Accepted', 'Superseded', 'Retired'] as const;

export const ALLOWED_RULE_LEVELS = ['MUST', 'MUST NOT', 'SHOULD', 'SHOULD NOT', 'MAY'] as const;

export const REQUIRED_RULE_FIELDS = ['Level', 'Rule', 'Rationale', 'Verification'] as const;

const adrFilePattern = /^ADR-\d+(?:-.+)?\.md$/;

export async function validateStandards(root: string): Promise<StandardsReport> {
  const issues: StandardIssue[] = [];
  const seenRuleIds = new Set<string>();
  let standardsChecked = 0;

  const frameworkPages = await markdownFiles(join(root, 'packages/framework'));
  for (const file of frameworkPages.sort()) {
    const content = await readFile(file, 'utf8');
    const metadata = readHeaderMetadata(content);
    const standardId = metadata.get('Standard ID');
    if (!standardId) {
      continue;
    }

    standardsChecked += 1;
    validateStandardPage({
      file,
      root,
      content,
      metadata,
      standardId,
      seenRuleIds,
      issues,
    });
  }

  const decisionsRoot = join(root, 'architecture/decisions');
  const decisionFiles = (await markdownFiles(decisionsRoot)).sort();
  const adrFiles = decisionFiles.filter((file) => adrFilePattern.test(basename(file)));
  const indexFile = join(decisionsRoot, 'README.md');
  const indexContent = existsSync(indexFile) ? await readFile(indexFile, 'utf8') : '';

  for (const file of adrFiles) {
    const name = basename(file);
    if (!indexContent.includes(name)) {
      issues.push({
        code: 'ADR_INDEX_MISSING',
        path: relative(root, indexFile),
        message: `${name} is not listed in the decision index.`,
      });
    }
    issues.push(...linkIssues(root, file, await readFile(file, 'utf8')));
  }

  if (existsSync(indexFile)) {
    issues.push(...linkIssues(root, indexFile, indexContent));
  }

  return {
    ok: issues.length === 0,
    standardsChecked,
    adrsChecked: adrFiles.length,
    issues,
  };
}

interface ValidatePageInput {
  file: string;
  root: string;
  content: string;
  metadata: Map<string, string>;
  standardId: string;
  seenRuleIds: Set<string>;
  issues: StandardIssue[];
}

function validateStandardPage(input: ValidatePageInput): void {
  const { file, root, content, metadata, standardId, seenRuleIds, issues } = input;
  const path = relative(root, file);
  const add = (code: string, message: string): void => {
    issues.push({ code, path, message });
  };

  for (const key of REQUIRED_STANDARD_METADATA) {
    const value = metadata.get(key);
    if (!value) {
      add('STANDARD_METADATA', `Missing or empty metadata field: ${key}.`);
    }
  }

  const status = metadata.get('Status');
  if (status && !(ALLOWED_STANDARD_STATUSES as readonly string[]).includes(status)) {
    add(
      'STANDARD_STATUS',
      `Unknown status "${status}". Use one of: ${ALLOWED_STANDARD_STATUSES.join(', ')}.`,
    );
  }

  const declaredId = metadata.get('Standard ID');
  if (declaredId && !/^P1-\d{2}$/.test(declaredId)) {
    add('STANDARD_ID', `Standard ID "${declaredId}" does not use the P1-NN form.`);
  }

  const sections = levelTwoHeadings(content);
  const positions = new Map<string, number>();
  for (const section of REQUIRED_STANDARD_SECTIONS) {
    const position = sections.indexOf(section);
    if (position === -1) {
      add('STANDARD_SECTION', `Missing required section: ${section}.`);
      continue;
    }
    positions.set(section, position);
  }

  const orderedPositions = REQUIRED_STANDARD_SECTIONS.map((section) =>
    positions.get(section),
  ).filter((position): position is number => position !== undefined);
  const isOrdered = orderedPositions.every(
    (position, index) => index === 0 || position > (orderedPositions[index - 1] ?? -1),
  );
  if (orderedPositions.length > 1 && !isOrdered) {
    add(
      'STANDARD_SECTION_ORDER',
      `Required sections must appear in this order: ${REQUIRED_STANDARD_SECTIONS.join(', ')}.`,
    );
  }

  const rules = ruleBlocks(content);
  if (rules.length === 0) {
    add('RULE_MISSING', `The standard defines no ${standardId}-R<n> rules.`);
  }

  for (const rule of rules) {
    if (!rule.id.startsWith(`${standardId}-R`)) {
      add('RULE_ID', `Rule ${rule.id} does not belong to standard ${standardId}.`);
    }
    if (seenRuleIds.has(rule.id)) {
      add('RULE_DUPLICATE', `Rule ID ${rule.id} is used by more than one rule.`);
    }
    seenRuleIds.add(rule.id);

    const fields = ruleFields(rule);
    for (const field of REQUIRED_RULE_FIELDS) {
      if (!fields.get(field)) {
        add('RULE_FIELD', `${rule.id} is missing the ${field} field.`);
      }
    }

    const level = fields.get('Level');
    if (level && !(ALLOWED_RULE_LEVELS as readonly string[]).includes(level)) {
      add(
        'RULE_LEVEL',
        `${rule.id} has unknown level "${level}". Use one of: ${ALLOWED_RULE_LEVELS.join(', ')}.`,
      );
    }
  }

  issues.push(...linkIssues(root, file, content));
}

function linkIssues(root: string, file: string, content: string): StandardIssue[] {
  return unresolvedRelativeLinks(file, content).map((target) => ({
    code: 'LINK_UNRESOLVED',
    path: relative(root, file),
    message: `Relative link does not resolve: ${target}`,
  }));
}
