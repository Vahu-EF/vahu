import type { RepositoryLocation } from '@vahu-ef/schemas';

/** Commander collector for repeatable options. */
export function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function formatRepositorySpec(location: RepositoryLocation): string {
  return `${location.name}=${location.path ?? location.url ?? ''}`;
}

/** Parses `name=path` and `name=https://…` specifications, or `null` when one is malformed. */
export function parseRepositorySpecs(specs: readonly string[]): RepositoryLocation[] | null {
  const locations: RepositoryLocation[] = [];

  for (const spec of specs) {
    const separator = spec.indexOf('=');
    if (separator <= 0) {
      return null;
    }

    const name = spec.slice(0, separator).trim();
    const location = spec.slice(separator + 1).trim();
    if (name.length === 0 || location.length === 0) {
      return null;
    }

    locations.push(
      location.startsWith('http://') || location.startsWith('https://')
        ? { name, url: location }
        : { name, path: location },
    );
  }

  return locations;
}
