import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { contentItemSchema } from '../src/content.js';
import { projectConfigSchema } from '../src/project.js';

function writeSchema(name: string, schema: z.ZodType): void {
  const json = z.toJSONSchema(schema, { target: 'draft-2020-12' });
  writeFileSync(name, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
}

writeSchema('project.schema.json', projectConfigSchema);
writeSchema('content.schema.json', contentItemSchema);
