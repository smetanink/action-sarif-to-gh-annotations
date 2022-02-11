'use strict';

import * as Core from '@actions/core';

import Constants from './constants';
import GetSarifReport from './sarif';
import CreateAnnotations from './annotations';

async function makeAnnotations() {
  try {
    const sarif = GetSarifReport(Constants.input.fileName);
    await CreateAnnotations(sarif);
    process.exit(0);
  } catch (e) {
    Core.setFailed((e as Error).message);
    process.exit(1);
  }
}

makeAnnotations().then();
