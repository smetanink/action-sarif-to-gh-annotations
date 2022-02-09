'use strict';

import * as Core from '@actions/core';
import { NoRequiredImport } from './errors';

interface Input {
  fileName: string;
  isAnnotateOnlyChangedFiles: boolean;
  changedFiles: string[];
}

let inputData: undefined | Input;

function getInput(inputName: string, required: boolean): string {
  try {
    return Core.getInput(inputName, { required });
  } catch (e) {
    throw new NoRequiredImport(inputName);
  }
}

function getBooleanInput(inputName: string): boolean {
  try {
    return Core.getBooleanInput(inputName, { required: true });
  } catch (e) {
    throw new NoRequiredImport(inputName);
  }
}

function clearFileNames(files: string[]): string[] {
  for (let i = 0; i < files.length; i++) {
    if (files[i].indexOf('/') === 0) {
      files[i] = files[i].substring(1);
    }
  }
  return files;
}

export default function (): Input {
  if (typeof inputData === 'undefined') {
    inputData = {
      fileName: getInput('fileName', true),
      isAnnotateOnlyChangedFiles: false,
      changedFiles: [],
    };
    inputData.isAnnotateOnlyChangedFiles = getBooleanInput('annotateOnlyChangedFiles');
    inputData.changedFiles = clearFileNames(
      getInput('changedFiles', inputData.isAnnotateOnlyChangedFiles).split(' '),
    );
  }
  return inputData;
}
