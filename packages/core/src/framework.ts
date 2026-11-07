import { validateContentModel } from './content.js';
import type { FrameworkIssue } from './issues.js';
import { validateStandards } from './standards.js';

export interface FrameworkReport {
  ok: boolean;
  standardsChecked: number;
  contentChecked: number;
  adrsChecked: number;
  issues: FrameworkIssue[];
}

/**
 * Runs every framework content contract against a repository root:
 * standard-page structure, the content metadata model, and the decision index.
 */
export async function validateFramework(root: string): Promise<FrameworkReport> {
  const standards = await validateStandards(root);
  const content = await validateContentModel(root);
  const issues = [...standards.issues, ...content.issues];

  return {
    ok: issues.length === 0,
    standardsChecked: standards.standardsChecked,
    contentChecked: content.items.length,
    adrsChecked: standards.adrsChecked,
    issues,
  };
}
