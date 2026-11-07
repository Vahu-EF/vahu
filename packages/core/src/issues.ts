/** A single validation finding, shared by the framework validators. */
export interface FrameworkIssue {
  code: string;
  path: string;
  message: string;
}
