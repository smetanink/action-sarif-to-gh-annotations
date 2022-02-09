'use strict';

import * as Core from '@actions/core';

import Constants from './constants';
import { getSarif } from './sarif';
import { createAnnotations } from './annotations';

try {
  Core.info(JSON.stringify(Constants));
  const sarif = getSarif(Constants.input.fileName);
  createAnnotations(sarif);
  process.exit(0);
} catch (e) {
  Core.setFailed((e as Error).message);
  process.exit(1);
}
