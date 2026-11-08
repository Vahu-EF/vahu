import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const coreEntry = join(root, 'packages/core/dist/index.js');

if (!existsSync(coreEntry)) {
  console.error(
    'Workspace validation needs the built workspace. Run `pnpm build` before `pnpm validate:workspace`.',
  );
  process.exit(1);
}

const { validateWorkspace } = await import(coreEntry);
const report = await validateWorkspace(root);

if (!report.ok) {
  console.error('Workspace validation failed:');
  for (const issue of report.issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
  process.exit(1);
}

console.log(
  `Workspace OK: ${report.packages} package(s), required structure and boundaries valid.`,
);
