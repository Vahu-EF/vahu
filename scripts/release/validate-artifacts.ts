#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { RELEASE_PACKAGES, renderChecksums, validateReleaseArtifacts } from './artifacts.js';

const USAGE = `Usage: tsx scripts/release/validate-artifacts.ts [options]

Inspect packed release candidates without publishing anything.

Options:
  --dir <directory>  Directory holding the .tgz candidates (default: artifacts)
  --pack             Pack the approved packages into the directory first
  --json             Print the machine-readable report
  -h, --help         Show this help

Packing requires a completed build (pnpm build) so package dist/ output exists.`;

interface Options {
  directory: string;
  pack: boolean;
  json: boolean;
}

function parseArgs(argv: readonly string[]): Options | 'help' {
  const options: Options = { directory: 'artifacts', pack: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    switch (argument) {
      case '--pack':
        options.pack = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--dir': {
        const value = argv[index + 1];
        if (value === undefined) {
          throw new Error('--dir requires a directory.');
        }
        options.directory = value;
        index += 1;
        break;
      }
      case '-h':
      case '--help':
        return 'help';
      default:
        throw new Error(`Unknown argument: ${argument ?? ''}`);
    }
  }
  return options;
}

function packCandidates(directory: string): void {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  for (const spec of RELEASE_PACKAGES) {
    process.stderr.write(`Packing ${spec.name}\n`);
    execFileSync(pnpm, ['--filter', spec.name, 'pack', '--pack-destination', directory], {
      stdio: 'inherit',
    });
  }
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options === 'help') {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const directory = resolve(options.directory);
  if (options.pack) {
    await mkdir(directory, { recursive: true });
    packCandidates(directory);
  }

  const report = await validateReleaseArtifacts(directory);

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`Release candidate: ${options.directory}\n`);
    for (const entry of report.packages) {
      process.stdout.write(
        `PASS  ${entry.name} ${entry.version} (${entry.files} files, ${formatBytes(entry.bytes)}, sha256 ${entry.sha256.slice(0, 12)})\n`,
      );
    }
    for (const issue of report.issues) {
      process.stdout.write(`ERROR ${issue.code} ${issue.package}: ${issue.message}\n`);
    }
  }

  if (!report.ok) {
    process.exitCode = 1;
    return;
  }

  const checksums = renderChecksums(report.packages);
  await writeFile(join(directory, 'SHA256SUMS'), checksums, 'utf8');
  if (!options.json) {
    process.stdout.write(`\nChecksums written to ${join(options.directory, 'SHA256SUMS')}\n`);
    process.stdout.write(
      'Nothing was published. Publication requires explicit release approval.\n',
    );
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
