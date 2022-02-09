'use strict';

import * as Core from '@actions/core';

import Input from './input';
import { getSarif } from './sarif';
import { createAnnotations } from './annotations';

try {
  Core.info(JSON.stringify(Input()));
  const sarif = getSarif(Input().fileName);
  createAnnotations(sarif);
  process.exit(0);
} catch (e) {
  Core.setFailed((e as Error).message);
  process.exit(1);
}
