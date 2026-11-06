import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await writeFile('dist/.nojekyll', '', 'utf8');
console.log('Website built in apps/website/dist.');
