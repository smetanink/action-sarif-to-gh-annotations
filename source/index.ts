'use strict';

import * as Core from '@actions/core';
import Input from './input';

try {
  Core.info(`Input: ${JSON.stringify(Input())}`);
} catch (e) {
  Core.setFailed((e as Error).message);
}
