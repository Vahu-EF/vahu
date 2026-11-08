import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { renderChecksums, validateReleaseArtifacts } from './artifacts.js';

interface FixtureFile {
  path: string;
  content: string;
}

const BLOCK_SIZE = 512;

function writeOctal(buffer: Buffer, offset: number, length: number, value: number): void {
  const text = `${value.toString(8).padStart(length - 1, '0')}\0`;
  buffer.write(text, offset, 'ascii');
}

function writeTar(files: readonly FixtureFile[]): Buffer {
  const blocks: Buffer[] = [];
  for (const file of files) {
    const content = Buffer.from(file.content, 'utf8');
    const header = Buffer.alloc(BLOCK_SIZE);
    header.write(file.path, 0, 'utf8');
    writeOctal(header, 100, 8, 0o644);
    writeOctal(header, 108, 8, 0);
    writeOctal(header, 116, 8, 0);
    writeOctal(header, 124, 12, content.byteLength);
    writeOctal(header, 136, 12, 0);
    header.fill(0x20, 148, 156);
    header.write('0', 156, 'ascii');
    header.write('ustar\0', 257, 'ascii');
    header.write('00', 263, 'ascii');

    let checksum = 0;
    for (const byte of header) {
      checksum += byte;
    }
    const checksumText = `${checksum.toString(8).padStart(6, '0')}\0 `;
    header.write(checksumText, 148, 'ascii');

    blocks.push(header, content);
    const padding = (BLOCK_SIZE - (content.byteLength % BLOCK_SIZE)) % BLOCK_SIZE;
    if (padding > 0) {
      blocks.push(Buffer.alloc(padding));
    }
  }
  blocks.push(Buffer.alloc(BLOCK_SIZE * 2));
  return gzipSync(Buffer.concat(blocks), { level: 9 });
}

function manifest(overrides: Record<string, unknown> & { name: string }): string {
  return JSON.stringify(
    {
      version: '0.1.0',
      license: 'Apache-2.0',
      type: 'module',
      publishConfig: { access: 'public', provenance: true },
      ...overrides,
    },
    null,
    2,
  );
}

function cliFiles(): FixtureFile[] {
  return [
    {
      path: 'package/package.json',
      content: manifest({
        name: 'vahu',
        bin: { vahu: './dist/index.js' },
        dependencies: { '@vahu-ef/adapters': '0.1.0', '@vahu-ef/core': '0.1.0' },
      }),
    },
    { path: 'package/README.md', content: '# vahu\n' },
    { path: 'package/LICENSE', content: 'Apache License 2.0\n' },
    { path: 'package/dist/index.js', content: '#!/usr/bin/env node\n' },
    { path: 'package/dist/agents/AGENT-IMPLEMENTER.json', content: '{}\n' },
    { path: 'package/dist/agents/AGENT-REVIEWER.json', content: '{}\n' },
    { path: 'package/dist/technology-profiles/PROFILE-NODE-BACKEND.json', content: '{}\n' },
    { path: 'package/dist/technology-profiles/PROFILE-POSTGRESQL.json', content: '{}\n' },
    { path: 'package/dist/technology-profiles/PROFILE-VITEST.json', content: '{}\n' },
  ];
}

function adapterFiles(): FixtureFile[] {
  return [
    {
      path: 'package/package.json',
      content: manifest({
        name: '@vahu-ef/adapters',
        main: './dist/index.js',
        types: './dist/index.d.ts',
        exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
        dependencies: { '@vahu-ef/schemas': '0.1.0' },
      }),
    },
    { path: 'package/README.md', content: '# @vahu-ef/adapters\n' },
    { path: 'package/LICENSE', content: 'Apache License 2.0\n' },
    { path: 'package/dist/index.js', content: 'export {};\n' },
    { path: 'package/dist/index.d.ts', content: 'export {};\n' },
  ];
}

function coreFiles(): FixtureFile[] {
  return [
    {
      path: 'package/package.json',
      content: manifest({
        name: '@vahu-ef/core',
        main: './dist/index.js',
        types: './dist/index.d.ts',
        exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
        dependencies: { '@vahu-ef/schemas': '0.1.0' },
      }),
    },
    { path: 'package/README.md', content: '# @vahu-ef/core\n' },
    { path: 'package/LICENSE', content: 'Apache License 2.0\n' },
    { path: 'package/dist/index.js', content: 'export {};\n' },
    { path: 'package/dist/index.d.ts', content: 'export {};\n' },
  ];
}

function schemasFiles(): FixtureFile[] {
  return [
    {
      path: 'package/package.json',
      content: manifest({
        name: '@vahu-ef/schemas',
        main: './dist/index.js',
        types: './dist/index.d.ts',
        exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
      }),
    },
    { path: 'package/README.md', content: '# @vahu-ef/schemas\n' },
    { path: 'package/LICENSE', content: 'Apache License 2.0\n' },
    { path: 'package/dist/index.js', content: 'export {};\n' },
    { path: 'package/dist/index.d.ts', content: 'export {};\n' },
    { path: 'package/project.schema.json', content: '{}\n' },
    { path: 'package/agent.schema.json', content: '{}\n' },
    { path: 'package/content.schema.json', content: '{}\n' },
    { path: 'package/profile.schema.json', content: '{}\n' },
    { path: 'package/workflow.schema.json', content: '{}\n' },
    { path: 'package/quality-gate.schema.json', content: '{}\n' },
  ];
}

async function artifactDirectory(
  archives: readonly { file: string; files: readonly FixtureFile[] }[],
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'vahu-release-'));
  for (const archive of archives) {
    await writeFile(join(directory, archive.file), writeTar(archive.files));
  }
  return directory;
}

async function completeCandidate(): Promise<string> {
  return artifactDirectory([
    { file: 'vahu-0.1.0.tgz', files: cliFiles() },
    { file: 'vahu-ef-adapters-0.1.0.tgz', files: adapterFiles() },
    { file: 'vahu-ef-core-0.1.0.tgz', files: coreFiles() },
    { file: 'vahu-ef-schemas-0.1.0.tgz', files: schemasFiles() },
  ]);
}

function codes(report: { issues: readonly { code: string }[] }): string[] {
  return report.issues.map((issue) => issue.code);
}

describe('release candidate artifacts', () => {
  it('accepts a complete candidate set and reports checksums', async () => {
    const report = await validateReleaseArtifacts(await completeCandidate());

    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.packages.map((entry) => entry.name).sort()).toEqual(
      ['@vahu-ef/core', '@vahu-ef/adapters', '@vahu-ef/schemas', 'vahu'].sort(),
    );
    for (const entry of report.packages) {
      expect(entry.version).toBe('0.1.0');
      expect(entry.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(entry.bytes).toBeGreaterThan(0);
    }
  });

  it('rejects artifacts that still reference workspace dependencies', async () => {
    const files = coreFiles().map((file) =>
      file.path === 'package/package.json'
        ? {
            ...file,
            content: manifest({
              name: '@vahu-ef/core',
              main: './dist/index.js',
              exports: { '.': { import: './dist/index.js' } },
              dependencies: { '@vahu-ef/schemas': 'workspace:*' },
            }),
          }
        : file,
    );
    const directory = await artifactDirectory([
      { file: 'vahu-0.1.0.tgz', files: cliFiles() },
      { file: 'vahu-ef-adapters-0.1.0.tgz', files: adapterFiles() },
      { file: 'vahu-ef-core-0.1.0.tgz', files },
      { file: 'vahu-ef-schemas-0.1.0.tgz', files: schemasFiles() },
    ]);

    const report = await validateReleaseArtifacts(directory);

    expect(report.ok).toBe(false);
    expect(codes(report)).toContain('WORKSPACE_PROTOCOL');
  });

  it('rejects a candidate missing its readme or license', async () => {
    const files = cliFiles().filter((file) => file.path !== 'package/LICENSE');
    const report = await validateReleaseArtifacts(
      await artifactDirectory([
        { file: 'vahu-0.1.0.tgz', files },
        { file: 'vahu-ef-adapters-0.1.0.tgz', files: adapterFiles() },
        { file: 'vahu-ef-core-0.1.0.tgz', files: coreFiles() },
        { file: 'vahu-ef-schemas-0.1.0.tgz', files: schemasFiles() },
      ]),
    );

    expect(report.ok).toBe(false);
    expect(codes(report)).toContain('MISSING_FILE');
    expect(report.issues.some((issue) => issue.message.includes('LICENSE'))).toBe(true);
  });

  it('rejects source files, tests, and source maps inside an archive', async () => {
    const files = [
      ...coreFiles(),
      { path: 'package/src/config.ts', content: 'export {};\n' },
      { path: 'package/dist/index.js.map', content: '{}\n' },
      { path: 'package/tests/config.test.ts', content: 'import "vitest";\n' },
    ];
    const report = await validateReleaseArtifacts(
      await artifactDirectory([
        { file: 'vahu-0.1.0.tgz', files: cliFiles() },
        { file: 'vahu-ef-adapters-0.1.0.tgz', files: adapterFiles() },
        { file: 'vahu-ef-core-0.1.0.tgz', files },
        { file: 'vahu-ef-schemas-0.1.0.tgz', files: schemasFiles() },
      ]),
    );

    expect(report.ok).toBe(false);
    expect(codes(report).filter((code) => code === 'FORBIDDEN_FILE')).toHaveLength(3);
  });

  it('rejects a missing package and an unexpected package', async () => {
    const directory = await artifactDirectory([
      { file: 'vahu-0.1.0.tgz', files: cliFiles() },
      { file: 'vahu-ef-core-0.1.0.tgz', files: coreFiles() },
      {
        file: 'vahu-ef-website-0.1.0.tgz',
        files: [
          {
            path: 'package/package.json',
            content: manifest({ name: '@vahu-ef/website', private: true }),
          },
        ],
      },
    ]);

    const report = await validateReleaseArtifacts(directory);

    expect(report.ok).toBe(false);
    expect(codes(report)).toContain('MISSING_PACKAGE');
    expect(codes(report)).toContain('UNEXPECTED_PACKAGE');
    expect(codes(report)).toContain('PRIVATE_PACKAGE');
  });

  it('rejects an adapter package whose published entry points are missing', async () => {
    const files = adapterFiles().filter((file) => file.path !== 'package/dist/index.d.ts');
    const report = await validateReleaseArtifacts(
      await artifactDirectory([
        { file: 'vahu-0.1.0.tgz', files: cliFiles() },
        { file: 'vahu-ef-adapters-0.1.0.tgz', files },
        { file: 'vahu-ef-core-0.1.0.tgz', files: coreFiles() },
        { file: 'vahu-ef-schemas-0.1.0.tgz', files: schemasFiles() },
      ]),
    );

    expect(report.ok).toBe(false);
    expect(codes(report)).toContain('MISSING_ENTRY');
  });

  it('rejects an internal dependency whose version differs from the candidate', async () => {
    const files = coreFiles().map((file) =>
      file.path === 'package/package.json'
        ? {
            ...file,
            content: manifest({
              name: '@vahu-ef/core',
              main: './dist/index.js',
              exports: { '.': { import: './dist/index.js' } },
              dependencies: { '@vahu-ef/schemas': '0.0.9' },
            }),
          }
        : file,
    );
    const report = await validateReleaseArtifacts(
      await artifactDirectory([
        { file: 'vahu-0.1.0.tgz', files: cliFiles() },
        { file: 'vahu-ef-adapters-0.1.0.tgz', files: adapterFiles() },
        { file: 'vahu-ef-core-0.1.0.tgz', files },
        { file: 'vahu-ef-schemas-0.1.0.tgz', files: schemasFiles() },
      ]),
    );

    expect(report.ok).toBe(false);
    expect(codes(report)).toContain('INTERNAL_DEPENDENCY_MISMATCH');
  });

  it('rejects an entry point that is not present in the archive', async () => {
    const files = coreFiles().filter((file) => file.path !== 'package/dist/index.d.ts');
    const report = await validateReleaseArtifacts(
      await artifactDirectory([
        { file: 'vahu-0.1.0.tgz', files: cliFiles() },
        { file: 'vahu-ef-adapters-0.1.0.tgz', files: adapterFiles() },
        { file: 'vahu-ef-core-0.1.0.tgz', files },
        { file: 'vahu-ef-schemas-0.1.0.tgz', files: schemasFiles() },
      ]),
    );

    expect(report.ok).toBe(false);
    expect(codes(report)).toContain('MISSING_ENTRY');
  });

  it('reports a missing artifact directory instead of throwing', async () => {
    const directory = join(await mkdtemp(join(tmpdir(), 'vahu-release-')), 'absent');

    const report = await validateReleaseArtifacts(directory);

    expect(report.ok).toBe(false);
    expect(codes(report)).toContain('MISSING_PACKAGE');
    expect(report.packages).toEqual([]);
  });

  it('renders a deterministic checksum file covering every tarball', async () => {
    const report = await validateReleaseArtifacts(await completeCandidate());

    const text = renderChecksums(report.packages);

    expect(text.trim().split('\n')).toHaveLength(4);
    expect(text).toBe(renderChecksums([...report.packages].reverse()));
    expect(text).toContain('  vahu-0.1.0.tgz');
  });
});
