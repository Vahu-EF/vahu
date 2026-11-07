import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const source = join(scriptDirectory, '../../../packages/framework/technology-profiles');
const destination = join(scriptDirectory, '../dist/technology-profiles');
const files = (await readdir(source)).filter((name) => name.endsWith('.json')).sort();

await mkdir(destination, { recursive: true });
for (const file of files) {
  await cp(join(source, file), join(destination, file));
}
