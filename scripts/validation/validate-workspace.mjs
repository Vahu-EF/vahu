import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const errors = [];

const requiredPaths = [
  'VAHU.md',
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'tsconfig.base.json',
  'apps/cli',
  'apps/website',
  'packages/core',
  'packages/schemas',
  'packages/framework/technology-profiles',
  'docs',
  'templates',
  'architecture',
  'scripts',
  'tests',
];

for (const requiredPath of requiredPaths) {
  try {
    await stat(join(root, requiredPath));
  } catch {
    errors.push(`Missing required path: ${requiredPath}`);
  }
}

try {
  await stat(join(root, 'profiles'));
  errors.push(
    'Root profiles/ must not exist; technology profiles belong in packages/framework/technology-profiles/.',
  );
} catch {
  // Expected: there is one canonical profile location.
}

const packageFiles = [];
for (const parent of ['apps', 'packages']) {
  let entries = [];
  try {
    entries = await readdir(join(root, parent), { withFileTypes: true });
  } catch {
    continue;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const packageFile = join(root, parent, entry.name, 'package.json');
    try {
      await stat(packageFile);
      packageFiles.push(packageFile);
    } catch {
      // Content-only directories do not need a package manifest.
    }
  }
}

const packages = new Map();
for (const file of packageFiles) {
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  if (typeof manifest.name !== 'string') {
    errors.push(`Package has no name: ${file}`);
    continue;
  }
  if (packages.has(manifest.name)) {
    errors.push(`Duplicate package name: ${manifest.name}`);
  }
  packages.set(manifest.name, { file, manifest });
}

const forbidden = new Map([
  ['@vahu-ef/schemas', new Set(['@vahu-ef/core', 'vahu'])],
  ['@vahu-ef/core', new Set(['vahu'])],
  ['@vahu-ef/website', new Set(['@vahu-ef/core', 'vahu'])],
]);

for (const [name, { manifest }] of packages) {
  const dependencies = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
  };
  for (const dependency of Object.keys(dependencies)) {
    if (forbidden.get(name)?.has(dependency)) {
      errors.push(`Forbidden dependency: ${name} -> ${dependency}`);
    }
  }
}

const graph = new Map();
for (const [name, { manifest }] of packages) {
  const dependencies = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
  };
  graph.set(
    name,
    Object.keys(dependencies).filter((dependency) => packages.has(dependency)),
  );
}

function visit(name, path, visiting) {
  if (visiting.has(name)) {
    errors.push(`Workspace dependency cycle: ${[...path, name].join(' -> ')}`);
    return;
  }
  if (path.includes(name)) return;
  visiting.add(name);
  for (const dependency of graph.get(name) ?? []) {
    visit(dependency, [...path, name], visiting);
  }
  visiting.delete(name);
}

for (const name of graph.keys()) {
  visit(name, [], new Set());
}

if (errors.length > 0) {
  console.error('Workspace validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Workspace OK: ${packages.size} package(s), required structure and boundaries valid.`);
