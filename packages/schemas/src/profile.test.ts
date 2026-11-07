import { describe, expect, it } from 'vitest';
import { parseTechnologyProfile } from './profile.js';

function profile(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0.0',
    id: 'PROFILE-NODE-BACKEND',
    name: 'Node.js backend',
    description: 'Server-side TypeScript on Node.js.',
    version: '0.1.0',
    category: 'backend',
    technology: 'node',
    supportedVersions: ['>=22'],
    projectTypes: ['all'],
    ...overrides,
  };
}

describe('technology profile schema', () => {
  it('accepts a minimal profile and defaults the guidance lists', () => {
    const result = parseTechnologyProfile(profile());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.prerequisites).toEqual([]);
      expect(result.data.security).toEqual([]);
      expect(result.data.compatibility.conflictsWith).toEqual([]);
    }
  });

  it('requires at least one supported version', () => {
    expect(parseTechnologyProfile(profile({ supportedVersions: [] })).ok).toBe(false);
  });

  it('rejects an identifier that is not a profile id', () => {
    const result = parseTechnologyProfile(profile({ id: 'node-backend' }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('id');
    }
  });

  it('rejects an unknown category', () => {
    expect(parseTechnologyProfile(profile({ category: 'desktop' })).ok).toBe(false);
  });

  it('accepts prerequisites, conflicts, and guidance', () => {
    const result = parseTechnologyProfile(
      profile({
        prerequisites: ['PROFILE-TYPESCRIPT'],
        compatibility: { conflictsWith: ['PROFILE-DENO'], notes: 'Runtime choice.' },
        security: ['Pin runtime versions.'],
        checks: ['pnpm check'],
      }),
    );

    expect(result.ok).toBe(true);
  });

  it('rejects unknown fields', () => {
    expect(parseTechnologyProfile(profile({ recommended: true })).ok).toBe(false);
  });
});
