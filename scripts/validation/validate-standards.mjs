import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const coreEntry = join(root, 'packages/core/dist/index.js');

if (!existsSync(coreEntry)) {
  console.error(
    'Framework validation needs the built workspace. Run `pnpm build` before `pnpm validate:standards`.',
  );
  process.exit(1);
}

const { validateFramework } = await import(coreEntry);
const report = await validateFramework(root);

if (!report.ok) {
  console.error('Framework validation failed:');
  for (const issue of report.issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
  process.exit(1);
}

console.log(
  `Framework content OK: ${report.standardsChecked} standard page(s), ` +
    `${report.contentChecked} content item(s), ${report.adrsChecked} ADR(s) valid.`,
);
