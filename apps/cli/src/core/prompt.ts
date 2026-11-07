import { createInterface, type Interface } from 'node:readline/promises';

export interface PromptSession {
  ask(question: string, fallback?: string): Promise<string>;
  confirm(question: string): Promise<boolean>;
  close(): void;
}

/**
 * Wraps a readline session so commands can ask questions without owning stdin.
 * A blank answer accepts the fallback; `confirm` defaults to "no" so an
 * accidental Enter never writes a file.
 */
export function createPromptSession(): PromptSession {
  const readline: Interface = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    async ask(question: string, fallback?: string): Promise<string> {
      const suffix = fallback ? ` [${fallback}]` : '';
      const answer = (await readline.question(`${question}${suffix}: `)).trim();
      return answer.length > 0 ? answer : (fallback ?? '');
    },
    async confirm(question: string): Promise<boolean> {
      const answer = (await readline.question(`${question} [y/N]: `)).trim().toLowerCase();
      return answer === 'y' || answer === 'yes';
    },
    close(): void {
      readline.close();
    },
  };
}

export function canPrompt(): boolean {
  return process.stdin.isTTY === true;
}
