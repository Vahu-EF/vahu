import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const coreEntry = join(root, 'packages/core/dist/index.js');

if (!existsSync(coreEntry)) {
  console.error(
    'Workflow validation needs the built workspace. Run `pnpm build` before `pnpm validate:workflows`.',
  );
  process.exit(1);
}

const { loadWorkflowCatalog } = await import(coreEntry);
const catalog = await loadWorkflowCatalog(join(root, 'packages/framework/workflows'));

if (!catalog.ok) {
  console.error('Workflow validation failed:');
  for (const issue of catalog.issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
  process.exit(1);
}

console.log(
  `Workflows OK: ${catalog.workflows.length} workflow(s), ${catalog.gates.length} quality gate(s) valid.`,
);
