import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { readTarGz, type ArchiveEntry } from './tar.js';

/** Package boundary the release process is allowed to publish. */
export interface ReleasePackageSpec {
  readonly name: string;
  /** Files that must be inside the tarball in addition to the manifest, README, and license. */
  readonly requiredFiles: readonly string[];
}

export const RELEASE_PACKAGES: readonly ReleasePackageSpec[] = [
  {
    name: 'vahu',
    requiredFiles: [
      'dist/index.js',
      'dist/agents/AGENT-IMPLEMENTER.json',
      'dist/agents/AGENT-REVIEWER.json',
      'dist/technology-profiles/PROFILE-NODE-BACKEND.json',
      'dist/technology-profiles/PROFILE-POSTGRESQL.json',
      'dist/technology-profiles/PROFILE-VITEST.json',
    ],
  },
  {
    name: '@vahu-ef/adapters',
    requiredFiles: ['dist/index.js', 'dist/index.d.ts'],
  },
  {
    name: '@vahu-ef/core',
    requiredFiles: ['dist/index.js', 'dist/index.d.ts'],
  },
  {
    name: '@vahu-ef/schemas',
    requiredFiles: [
      'dist/index.js',
      'dist/index.d.ts',
      'agent.schema.json',
      'content.schema.json',
      'profile.schema.json',
      'project.schema.json',
      'quality-gate.schema.json',
      'workflow.schema.json',
    ],
  },
];

const REQUIRED_IN_EVERY_PACKAGE = ['package.json', 'README.md', 'LICENSE'] as const;
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const FORBIDDEN_PATHS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /^src\//, reason: 'source directory' },
  { pattern: /^tests?\//, reason: 'test directory' },
  { pattern: /^node_modules\//, reason: 'installed dependencies' },
  { pattern: /(?:^|\/)\.env(?:\.|$)/, reason: 'environment file' },
  { pattern: /^tsconfig[^/]*\.json$/, reason: 'TypeScript configuration' },
  { pattern: /^\.changeset\//, reason: 'changeset data' },
  { pattern: /\.map$/, reason: 'source map' },
  { pattern: /\.tsbuildinfo$/, reason: 'TypeScript build info' },
  { pattern: /\.tgz$/, reason: 'nested archive' },
];

export type ReleaseIssueCode =
  | 'ARCHIVE_UNREADABLE'
  | 'MANIFEST_INVALID'
  | 'MISSING_PACKAGE'
  | 'UNEXPECTED_PACKAGE'
  | 'DUPLICATE_PACKAGE'
  | 'PRIVATE_PACKAGE'
  | 'MISSING_LICENSE_FIELD'
  | 'MISSING_FILE'
  | 'MISSING_ENTRY'
  | 'FORBIDDEN_FILE'
  | 'WORKSPACE_PROTOCOL'
  | 'INTERNAL_DEPENDENCY_MISMATCH';

export interface ReleaseIssue {
  code: ReleaseIssueCode;
  package: string;
  message: string;
}

export interface ReleaseArtifact {
  name: string;
  version: string;
  file: string;
  files: number;
  bytes: number;
  sha256: string;
}

export interface ReleaseReport {
  ok: boolean;
  directory: string;
  packages: ReleaseArtifact[];
  issues: ReleaseIssue[];
}

interface ParsedArchive {
  file: string;
  bytes: number;
  sha256: string;
  entries: Map<string, ArchiveEntry>;
  manifest: Record<string, unknown> | undefined;
}

function normalizeEntryPath(path: string): string {
  return path.startsWith('package/') ? path.slice('package/'.length) : path;
}

function fail(issues: ReleaseIssue[], code: ReleaseIssueCode, name: string, message: string): void {
  issues.push({ code, package: name, message });
}

function stringField(manifest: Record<string, unknown>, field: string): string | undefined {
  const value = manifest[field];
  return typeof value === 'string' ? value : undefined;
}

function normalizeTarget(target: string): string {
  return target.replace(/^\.\//, '');
}

function collectExportTargets(value: unknown, targets: string[]): void {
  if (typeof value === 'string') {
    targets.push(normalizeTarget(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectExportTargets(item, targets);
    }
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) {
      collectExportTargets(item, targets);
    }
  }
}

function manifestEntrypoints(manifest: Record<string, unknown>): string[] {
  const targets: string[] = [];
  for (const field of ['main', 'types', 'module'] as const) {
    const value = stringField(manifest, field);
    if (value !== undefined) {
      targets.push(normalizeTarget(value));
    }
  }

  const bin = manifest.bin;
  if (typeof bin === 'string') {
    targets.push(normalizeTarget(bin));
  } else if (bin !== null && typeof bin === 'object') {
    for (const value of Object.values(bin)) {
      if (typeof value === 'string') {
        targets.push(normalizeTarget(value));
      }
    }
  }

  collectExportTargets(manifest.exports, targets);
  return [...new Set(targets)];
}

async function parseArchive(directory: string, file: string): Promise<ParsedArchive> {
  const bytes = await readFile(join(directory, file));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const contents = readTarGz(bytes);

  const entries = new Map<string, ArchiveEntry>();
  for (const [path, entry] of contents.entries) {
    entries.set(normalizeEntryPath(path), entry);
  }

  const manifestEntry = entries.get('package.json');
  let manifest: Record<string, unknown> | undefined;
  if (manifestEntry !== undefined) {
    try {
      const parsed: unknown = JSON.parse(manifestEntry.content.toString('utf8'));
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        manifest = parsed as Record<string, unknown>;
      }
    } catch {
      manifest = undefined;
    }
  }

  return { file, bytes: bytes.byteLength, sha256, entries, manifest };
}

function checkManifest(
  spec: ReleasePackageSpec,
  archive: ParsedArchive,
  versions: ReadonlyMap<string, string>,
  issues: ReleaseIssue[],
): ReleaseArtifact | undefined {
  const manifest = archive.manifest;
  if (manifest === undefined) {
    fail(
      issues,
      'MANIFEST_INVALID',
      spec.name,
      `${archive.file} has no readable package/package.json.`,
    );
    return undefined;
  }

  const version = stringField(manifest, 'version');
  if (version === undefined || !SEMVER_PATTERN.test(version)) {
    fail(issues, 'MANIFEST_INVALID', spec.name, `${archive.file} has an invalid version field.`);
    return undefined;
  }

  if (stringField(manifest, 'license') === undefined) {
    fail(issues, 'MISSING_LICENSE_FIELD', spec.name, `${spec.name} declares no license.`);
  }

  for (const path of [...REQUIRED_IN_EVERY_PACKAGE, ...spec.requiredFiles]) {
    if (!archive.entries.has(path)) {
      fail(issues, 'MISSING_FILE', spec.name, `${archive.file} does not contain ${path}.`);
    }
  }

  for (const target of manifestEntrypoints(manifest)) {
    if (!archive.entries.has(target)) {
      fail(
        issues,
        'MISSING_ENTRY',
        spec.name,
        `${archive.file} references ${target}, which it does not contain.`,
      );
    }
  }

  for (const path of archive.entries.keys()) {
    if (path.endsWith('.d.ts')) {
      continue;
    }
    const forbidden =
      FORBIDDEN_PATHS.find((rule) => rule.pattern.test(path)) ??
      (path.endsWith('.ts') ? { reason: 'TypeScript source' } : undefined);
    if (forbidden !== undefined) {
      fail(
        issues,
        'FORBIDDEN_FILE',
        spec.name,
        `${archive.file} contains ${path} (${forbidden.reason}).`,
      );
    }
  }

  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = manifest[field];
    if (dependencies === null || typeof dependencies !== 'object' || Array.isArray(dependencies)) {
      continue;
    }
    for (const [dependency, range] of Object.entries(dependencies)) {
      if (typeof range !== 'string') {
        continue;
      }
      if (range.startsWith('workspace:')) {
        fail(
          issues,
          'WORKSPACE_PROTOCOL',
          spec.name,
          `${spec.name} depends on ${dependency} with "${range}"; the packed manifest must pin a released version.`,
        );
        continue;
      }
      const siblingVersion = versions.get(dependency);
      if (siblingVersion !== undefined && range !== siblingVersion) {
        fail(
          issues,
          'INTERNAL_DEPENDENCY_MISMATCH',
          spec.name,
          `${spec.name} depends on ${dependency} at "${range}" but this candidate provides ${siblingVersion}.`,
        );
      }
    }
  }

  return {
    name: spec.name,
    version,
    file: archive.file,
    files: archive.entries.size,
    bytes: archive.bytes,
    sha256: archive.sha256,
  };
}

/**
 * Inspect packed release candidates and report whether they are safe to publish.
 *
 * This only reads the directory; nothing is published or rewritten.
 */
export async function validateReleaseArtifacts(directory: string): Promise<ReleaseReport> {
  const issues: ReleaseIssue[] = [];
  let archives: string[] = [];
  try {
    const listed = await readdir(directory, { withFileTypes: true });
    archives = listed
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tgz'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      throw error;
    }
  }

  if (archives.length === 0) {
    fail(issues, 'MISSING_PACKAGE', 'release', `No packed artifacts found in ${directory}.`);
  }

  const parsed: ParsedArchive[] = [];
  for (const file of archives) {
    try {
      parsed.push(await parseArchive(directory, file));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      fail(issues, 'ARCHIVE_UNREADABLE', basename(file), `${file} could not be read: ${reason}`);
    }
  }

  const byName = new Map<string, ParsedArchive>();
  for (const archive of parsed) {
    const name = archive.manifest === undefined ? undefined : stringField(archive.manifest, 'name');
    if (name === undefined) {
      fail(
        issues,
        'MANIFEST_INVALID',
        basename(archive.file),
        `${archive.file} declares no package name.`,
      );
      continue;
    }
    if (archive.manifest?.private === true) {
      fail(issues, 'PRIVATE_PACKAGE', name, `${name} is marked private and must not be published.`);
    }
    const existing = byName.get(name);
    if (existing !== undefined) {
      fail(
        issues,
        'DUPLICATE_PACKAGE',
        name,
        `${archive.file} duplicates ${existing.file} for the same package.`,
      );
      continue;
    }
    byName.set(name, archive);
  }

  const versions = new Map<string, string>();
  for (const [name, archive] of byName) {
    const version =
      archive.manifest === undefined ? undefined : stringField(archive.manifest, 'version');
    if (version !== undefined && SEMVER_PATTERN.test(version)) {
      versions.set(name, version);
    }
  }

  const packages: ReleaseArtifact[] = [];
  for (const spec of RELEASE_PACKAGES) {
    const archive = byName.get(spec.name);
    if (archive === undefined) {
      fail(issues, 'MISSING_PACKAGE', spec.name, `No packed artifact for ${spec.name} is present.`);
      continue;
    }
    const artifact = checkManifest(spec, archive, versions, issues);
    if (artifact !== undefined) {
      packages.push(artifact);
    }
  }

  for (const name of byName.keys()) {
    if (!RELEASE_PACKAGES.some((spec) => spec.name === name)) {
      fail(
        issues,
        'UNEXPECTED_PACKAGE',
        name,
        `${name} is not part of the approved release package set.`,
      );
    }
  }

  packages.sort((left, right) => left.name.localeCompare(right.name));
  return { ok: issues.length === 0, directory, packages, issues };
}

/** `sha256sum`-compatible listing, sorted by file so the output is reproducible. */
export function renderChecksums(packages: readonly ReleaseArtifact[]): string {
  return [...packages]
    .sort((left, right) => left.file.localeCompare(right.file))
    .map((entry) => `${entry.sha256}  ${entry.file}`)
    .join('\n')
    .concat('\n');
}
