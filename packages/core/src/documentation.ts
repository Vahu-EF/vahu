import type { Dirent } from 'node:fs';
import { realpath, readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { FrameworkIssue } from './issues.js';

const markdownLink = /\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)/g;
const fencedCode = /^\s{0,3}(```+|~~~+).*$\n[\s\S]*?^\s{0,3}\1.*$/gm;
const inlineCode = /(`+)[^`\n]*\1/g;
const scanDirectories = [
  'docs',
  'examples',
  'templates',
  'architecture',
  'packages/framework',
  'apps/cli',
  'apps/website',
] as const;

export interface DocumentationReport {
  ok: boolean;
  filesChecked: number;
  issues: FrameworkIssue[];
}

/** Checks local Markdown links in the project's human-facing documentation trees. */
export async function validateDocumentation(root: string): Promise<DocumentationReport> {
  const absoluteRoot = (await canonicalPath(resolve(root))) ?? resolve(root);
  const files = new Set<string>();

  for (const directory of scanDirectories) {
    for (const file of await markdownFiles(join(absoluteRoot, directory), absoluteRoot)) {
      files.add(file);
    }
  }

  for (const file of await rootMarkdownFiles(absoluteRoot)) {
    files.add(file);
  }

  const issues: FrameworkIssue[] = [];
  for (const file of [...files].sort()) {
    const content = await readFile(file, 'utf8');
    const prose = content.replace(fencedCode, '').replace(inlineCode, '');
    for (const match of prose.matchAll(markdownLink)) {
      const rawTarget = (match[1] ?? '').replace(/^<|>$/g, '');
      if (
        rawTarget.length === 0 ||
        /^(?:https?:|mailto:|tel:|data:)/i.test(rawTarget) ||
        rawTarget.startsWith('#')
      ) {
        continue;
      }

      const targetPath = rawTarget.split('#')[0]?.split('?')[0] ?? '';
      if (targetPath.length === 0) {
        continue;
      }

      let decodedTarget: string;
      try {
        decodedTarget = decodeURIComponent(targetPath);
      } catch {
        issues.push({
          code: 'LINK_INVALID_ENCODING',
          path: relative(absoluteRoot, file),
          message: `Relative link has invalid percent encoding: ${rawTarget}`,
        });
        continue;
      }

      const target = decodedTarget.startsWith('/')
        ? resolve(absoluteRoot, `.${decodedTarget}`)
        : resolve(file, '..', decodedTarget);
      const targetRelative = relative(absoluteRoot, target);
      if (
        targetRelative === '..' ||
        targetRelative.startsWith(`..${sep}`) ||
        isAbsolute(targetRelative)
      ) {
        issues.push({
          code: 'LINK_OUTSIDE_ROOT',
          path: relative(absoluteRoot, file),
          message: `Local link resolves outside the repository: ${rawTarget}`,
        });
        continue;
      }

      const canonicalTarget = await canonicalPath(target);
      if (canonicalTarget === null) {
        issues.push({
          code: 'LINK_UNRESOLVED',
          path: relative(absoluteRoot, file),
          message: `Relative link does not resolve: ${rawTarget}`,
        });
        continue;
      }
      const canonicalRelative = relative(absoluteRoot, canonicalTarget);
      if (
        canonicalRelative === '..' ||
        canonicalRelative.startsWith(`..${sep}`) ||
        isAbsolute(canonicalRelative)
      ) {
        issues.push({
          code: 'LINK_OUTSIDE_ROOT',
          path: relative(absoluteRoot, file),
          message: `Local link resolves outside the repository: ${rawTarget}`,
        });
      }
    }
  }

  return { ok: issues.length === 0, filesChecked: files.size, issues };
}

async function markdownFiles(directory: string, root: string): Promise<string[]> {
  const canonicalDirectory = await canonicalPath(directory);
  if (canonicalDirectory === null || isOutsideRoot(root, canonicalDirectory)) {
    return [];
  }

  let entries: Dirent[];
  try {
    entries = await readdir(canonicalDirectory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue;
    }
    const fullPath = join(canonicalDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(fullPath, root)));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
      files.push(fullPath);
    }
  }
  return files;
}

function isOutsideRoot(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot);
}

async function rootMarkdownFiles(root: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.md')
    .map((entry) => join(root, basename(entry.name)));
}

async function canonicalPath(path: string): Promise<string | null> {
  try {
    await stat(path);
    return await realpath(path);
  } catch {
    return null;
  }
}
