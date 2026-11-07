import { gunzipSync } from 'node:zlib';

/**
 * Minimal reader for the compressed tar archives produced by `pnpm pack`.
 *
 * It intentionally supports only the subset of the ustar format npm-compatible
 * packers emit: regular files, directories (skipped), PAX path records, and GNU
 * long names. That is enough to inspect our own release candidates without
 * adding a dependency or shelling out to a platform-specific `tar`.
 */

const BLOCK_SIZE = 512;

export interface ArchiveEntry {
  path: string;
  content: Buffer;
  mode: number;
}

export interface ArchiveContents {
  entries: Map<string, ArchiveEntry>;
  totalBytes: number;
}

function headerText(field: Buffer): string {
  const text = field.toString('utf8');
  const end = text.indexOf('\0');
  return (end === -1 ? text : text.slice(0, end)).trim();
}

function headerNumber(field: Buffer): number {
  const text = headerText(field);
  if (text === '') {
    return 0;
  }
  const value = Number.parseInt(text, 8);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid tar header number: ${JSON.stringify(text)}`);
  }
  return value;
}

function isZeroBlock(block: Buffer): boolean {
  for (const byte of block) {
    if (byte !== 0) {
      return false;
    }
  }
  return true;
}

function parsePaxRecords(content: Buffer): Record<string, string> {
  const records: Record<string, string> = {};
  const text = content.toString('utf8');
  let offset = 0;
  while (offset < text.length) {
    const space = text.indexOf(' ', offset);
    if (space === -1) {
      break;
    }
    const length = Number.parseInt(text.slice(offset, space), 10);
    if (!Number.isFinite(length) || length <= 0) {
      break;
    }
    // Records are "<length> <key>=<value>\n" where <length> counts the whole line.
    const record = text.slice(space + 1, offset + length - 1);
    const separator = record.indexOf('=');
    if (separator !== -1) {
      records[record.slice(0, separator)] = record.slice(separator + 1);
    }
    offset += length;
  }
  return records;
}

export function readTarGz(archive: Buffer): ArchiveContents {
  const data = gunzipSync(archive);
  const entries = new Map<string, ArchiveEntry>();
  let offset = 0;
  let pendingPath: string | undefined;

  while (offset + BLOCK_SIZE <= data.length) {
    const header = data.subarray(offset, offset + BLOCK_SIZE);
    if (isZeroBlock(header)) {
      break;
    }

    const size = headerNumber(header.subarray(124, 136));
    const mode = headerNumber(header.subarray(100, 108));
    const type = header.subarray(156, 157).toString('utf8');
    const prefix = headerText(header.subarray(345, 500));
    const name = headerText(header.subarray(0, 100));

    const contentStart = offset + BLOCK_SIZE;
    const contentEnd = contentStart + size;
    if (contentEnd > data.length) {
      throw new Error('Tar archive is truncated.');
    }
    const content = data.subarray(contentStart, contentEnd);
    offset = contentStart + Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;

    if (type === 'x') {
      const records = parsePaxRecords(content);
      if (typeof records.path === 'string') {
        pendingPath = records.path;
      }
      continue;
    }

    if (type === 'L') {
      pendingPath = headerText(content);
      continue;
    }

    const path = pendingPath ?? (prefix === '' ? name : `${prefix}/${name}`);
    pendingPath = undefined;

    if (type === '0' || type === '\0' || type === '') {
      entries.set(path, { path, content: Buffer.from(content), mode });
    }
  }

  return { entries, totalBytes: data.byteLength };
}
