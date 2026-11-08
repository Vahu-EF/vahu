import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const coreEntry = join(root, 'packages/core/dist/index.js');

if (!existsSync(coreEntry)) {
  console.error(
    'Framework validation needs the built workspace. Run `pnpm build` before `pnpm validate:standards`.',
  );
  process.exit(1);
}

const { validateFramework } = await import(pathToFileURL(coreEntry).href);
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
