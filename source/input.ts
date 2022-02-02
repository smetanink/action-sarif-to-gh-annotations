'use strict';

import * as Core from '@actions/core';
import { NoRequiredImport } from './errors';

interface Input {
  fileName: string;
}

let inputData: undefined | Input;

function getInput(inputName: string): string {
  try {
    return Core.getInput(inputName, { required: true });
  } catch (e) {
    throw new NoRequiredImport(inputName);
  }
}

export default function (): Input {
  if (typeof inputData === 'undefined') {
    inputData = {
      fileName: getInput('fileName'),
    };
  }
  return inputData;
}
