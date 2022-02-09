'use strict';

import * as Core from '@actions/core';
import { NoRequiredImport } from './errors';

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

function setConstants() {
  const fileName = getInput('fileName', true);
  const isAnnotateOnlyChangedFiles = getBooleanInput('annotateOnlyChangedFiles');
  const changedFiles = clearFileNames(
    getInput('changedFiles', isAnnotateOnlyChangedFiles).split(' '),
  );

  return {
    input: {
      fileName,
      isAnnotateOnlyChangedFiles,
      changedFiles,
    },
  };
}

const constants: {
  input: {
    fileName: string;
    isAnnotateOnlyChangedFiles: boolean;
    changedFiles: string[];
  };
} = setConstants();

export default constants;
