import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteHtml = await readFile(join(websiteRoot, 'src/index.html'), 'utf8');
const siteCss = await readFile(join(websiteRoot, 'src/styles.css'), 'utf8');
const cliDocs = await readFile(join(websiteRoot, '../../docs/cli/README.md'), 'utf8');
const profileDocs = await readFile(
  join(websiteRoot, '../../docs/technology-profiles/README.md'),
  'utf8',
);
const examplesDocs = await readFile(join(websiteRoot, '../../examples/README.md'), 'utf8');
const builtHtml = await readFile(join(websiteRoot, 'dist/index.html'), 'utf8');

describe('VAHU project website content', () => {
  it('explains the product, its status, the first-run path, and current capabilities', () => {
    expect(siteHtml).toContain('PROJECT STATUS');
    expect(siteHtml).toContain('pnpm check');
    expect(siteHtml).toContain('project inspect');
    expect(siteHtml).toContain('profile list');
    expect(siteHtml).toContain('No provider adapter');
    expect(siteHtml).not.toContain('Phase 0 foundation.');
  });

  it('links to maintained documentation, the roadmap, examples, and source repository', async () => {
    const links = [
      ...siteHtml.matchAll(/href="https:\/\/github\.com\/Vahu-EF\/vahu\/blob\/main\/([^"]+)"/g),
    ];
    const targets = links.map((match) => match[1]).filter((target): target is string => !!target);

    expect(targets).toContain('docs/getting-started/README.md');
    expect(targets).toContain('docs/cli/README.md');
    expect(targets).toContain('architecture/specifications/roadmap.md');
    expect(targets).toContain('examples/README.md');
    expect(siteHtml).toContain('https://github.com/Vahu-EF/vahu');
    for (const target of targets) {
      await expect(access(join(websiteRoot, '../..', target))).resolves.toBeUndefined();
    }
  });

  it('keeps the linked CLI, profile, and examples documentation consistent with this milestone', () => {
    expect(cliDocs).toContain('vahu project inspect');
    expect(cliDocs).toContain('vahu profile list');
    expect(cliDocs).not.toContain('profiles arrive in Phase 4');
    expect(profileDocs).toContain('three initial profiles are implemented');
    expect(profileDocs).not.toContain(
      'The profile format and the initial profiles are **planned**',
    );
    expect(examplesDocs).toContain('CLI test suite');
    expect(examplesDocs).toContain('Mobile UI with approved design system');
  });

  it('ships the updated source into the Pages build output', () => {
    expect(builtHtml).toContain('PROJECT STATUS');
    expect(builtHtml).toContain('id="quick-start"');
    expect(builtHtml).toContain('No provider adapter is implemented');
  });

  it('provides semantic navigation, sections, and keyboard focus styling', () => {
    expect(siteHtml).toMatch(/<nav\b[^>]*aria-label=/);
    expect(siteHtml).toMatch(/<main\b[^>]*>/);
    expect(siteHtml).toContain('id="quick-start"');
    expect(siteHtml).toContain('id="capabilities"');
    expect(siteHtml).toContain('id="agent-support"');
    expect(siteHtml).toContain('id="profiles"');
    expect(siteCss).toContain(':focus-visible');
    expect(siteCss).toMatch(/@media\s*\(max-width:/);
  });
});
