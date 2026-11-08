import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const coreEntry = join(root, 'packages/core/dist/index.js');

if (!existsSync(coreEntry)) {
  console.error(
    'Technology-profile validation needs the built workspace. Run `pnpm build` before `pnpm validate:profiles`.',
  );
  process.exit(1);
}

const { loadProfileCatalog } = await import(coreEntry);
const catalog = await loadProfileCatalog(join(root, 'packages/framework/technology-profiles'));

if (!catalog.ok) {
  console.error('Technology-profile validation failed:');
  for (const issue of catalog.issues) {
    console.error(`- ${issue.path}: ${issue.message} (${issue.code})`);
  }
  process.exit(1);
}

console.log(`Technology profiles OK: ${catalog.profiles.length} profile(s) valid.`);
