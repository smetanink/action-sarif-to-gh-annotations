'use strict';

import * as Core from '@actions/core';

import Input from './input';
import { getSarif } from './sarif';

try {
  Core.info(`Input: ${JSON.stringify(Input())}`);
  const sarif = getSarif(Input().fileName);
  Core.info(`sarif: ${JSON.stringify(sarif)}`);
} catch (e) {
  Core.setFailed((e as Error).message);
}
