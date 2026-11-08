import { resolve } from 'node:path';
import type { Command } from 'commander';
import { validateDocumentation } from '@vahu-ef/core';

const REPORT_VERSION = '1.0.0';

interface DocumentationOptions {
  path: string;
  json?: boolean;
}

export function registerDocumentationCommands(program: Command): void {
  program
    .command('docs')
    .description('Validate project documentation.')
    .command('validate')
    .description(
      'Check local Markdown links in documentation, examples, templates, and framework content.',
    )
    .option('--path <directory>', 'Repository root to validate.', process.cwd())
    .option('--json', 'Print a versioned machine-readable report.')
    .action(async (options: DocumentationOptions) => {
      const report = await validateDocumentation(resolve(options.path));
      const result = {
        contractVersion: REPORT_VERSION,
        reportType: 'documentation-validation',
        ok: report.ok,
        filesChecked: report.filesChecked,
        issues: report.issues,
      };

      if (options.json === true) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else if (report.ok) {
        process.stdout.write(
          `Documentation links OK: ${report.filesChecked} Markdown file(s) checked.\n`,
        );
      } else {
        process.stdout.write(
          `Documentation validation failed (${report.issues.length} issue(s)):\n`,
        );
        for (const issue of report.issues) {
          process.stdout.write(`- ${issue.path}: ${issue.message} (${issue.code})\n`);
        }
      }

      if (!report.ok) {
        process.exitCode = 1;
      }
    });
}
