import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDocumentation } from '../../packages/core/src/documentation.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const report = await validateDocumentation(root);

if (!report.ok) {
  console.error('Documentation validation failed:');
  for (const issue of report.issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
  process.exit(1);
}

console.log(`Documentation links OK: ${report.filesChecked} Markdown file(s) checked.`);
