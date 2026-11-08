import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const catalogs = [
  {
    source: join(scriptDirectory, '../../../packages/framework/technology-profiles'),
    destination: join(scriptDirectory, '../dist/technology-profiles'),
  },
  {
    source: join(scriptDirectory, '../../../packages/framework/agents'),
    destination: join(scriptDirectory, '../dist/agents'),
  },
];

for (const catalog of catalogs) {
  const files = (await readdir(catalog.source)).filter((name) => name.endsWith('.json')).sort();
  await mkdir(catalog.destination, { recursive: true });
  for (const file of files) {
    await cp(join(catalog.source, file), join(catalog.destination, file));
  }
}
