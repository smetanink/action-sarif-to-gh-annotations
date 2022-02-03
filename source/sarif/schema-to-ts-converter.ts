'use strict';

import { writeFileSync, readFileSync } from 'fs';
import { compileFromFile } from 'json-schema-to-typescript';
import * as Path from 'path';

const prettierSettings = JSON.parse(readFileSync('.prettierrc.json', { encoding: 'utf-8' }));

const schemaName = 'sarif-schema-2.1.0-rtm.4.json';
const dtsName = 'sarif-schema-2.1.0.d.ts';

async function generate() {
  writeFileSync(
    Path.join(__dirname, dtsName),
    await compileFromFile(Path.join(__dirname, schemaName), { style: prettierSettings }),
  );
}

generate().then();
