'use strict';

import * as Core from '@actions/core';

import Input from './input';
import { getSarif } from './sarif';
import { createAnnotations } from './annotations';

try {
  const sarif = getSarif(Input().fileName);
  createAnnotations(sarif);
} catch (e) {
  Core.setFailed((e as Error).message);
}
