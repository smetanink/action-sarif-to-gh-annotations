'use strict';

import * as Core from '@actions/core';

import Constants from './constants';
import getSarifReport from './sarif';
import { createAnnotations } from './annotations';

async function makeAnnotations() {
  try {
    const sarif = getSarifReport(Constants.input.fileName);
    await createAnnotations(sarif);
    process.exit(0);
  } catch (e) {
    Core.setFailed((e as Error).message);
    process.exit(1);
  }
}

makeAnnotations().then();
