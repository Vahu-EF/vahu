import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Facts detected from a project, never written to the configuration. */
export interface FoundationReport {
  packageManager?: string;
  scripts: string[];
  ciWorkflows: string[];
  docsPaths: string[];
  envExample?: string;
}

/**
 * Inspects a project directory for engineering-foundation facts. Everything
 * reported here is detected from files; nothing is inferred or assumed.
 */
export function detectFoundation(cwd: string): FoundationReport {
  const report: FoundationReport = {
    scripts: [],
    ciWorkflows: [],
    docsPaths: [],
  };

  const packageManager = detectPackageManager(cwd);
  if (packageManager) {
    report.packageManager = packageManager;
  }

  report.scripts = detectScripts(cwd);
  report.ciWorkflows = detectWorkflows(join(cwd, '.github/workflows'));
  report.docsPaths = detectDocs(cwd);

  const envExample = ['.env.example', '.env.sample'].find((name) => existsSync(join(cwd, name)));
  if (envExample) {
    report.envExample = envExample;
  }

  return report;
}

function detectPackageManager(cwd: string): string | undefined {
  const packageJson = join(cwd, 'package.json');
  if (existsSync(packageJson)) {
    try {
      const parsed = JSON.parse(readFileSync(packageJson, 'utf8')) as {
        packageManager?: unknown;
      };
      if (typeof parsed.packageManager === 'string' && parsed.packageManager.length > 0) {
        return parsed.packageManager;
      }
    } catch {
      return undefined;
    }
  }

  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (existsSync(join(cwd, 'package-lock.json'))) {
    return 'npm';
  }
  return undefined;
}

function detectScripts(cwd: string): string[] {
  const packageJson = join(cwd, 'package.json');
  if (!existsSync(packageJson)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(packageJson, 'utf8')) as {
      scripts?: Record<string, unknown>;
    };
    return Object.keys(parsed.scripts ?? {}).sort();
  } catch {
    return [];
  }
}

function detectWorkflows(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  try {
    return readdirSync(directory)
      .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
      .sort();
  } catch {
    return [];
  }
}

function detectDocs(cwd: string): string[] {
  const candidates = ['README.md', 'CONTRIBUTING.md', 'docs', 'architecture', 'CHANGELOG.md'];

  return candidates.filter((name) => existsSync(join(cwd, name)));
}
