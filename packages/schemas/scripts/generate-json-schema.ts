import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { projectConfigSchema } from '../src/project.js';

const schema = z.toJSONSchema(projectConfigSchema, { target: 'draft-2020-12' });
writeFileSync('project.schema.json', `${JSON.stringify(schema, null, 2)}\n`, 'utf8');
